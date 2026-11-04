"""Safety tests for the local-only command wrapper; no Docker/CLI is executed."""
import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import local_supabase as local


class LocalTargetTests(unittest.TestCase):
    def run_action(self, action, status=None, changed_config=None):
        with tempfile.TemporaryDirectory() as name:
            directory = Path(name) / 'verification'
            if changed_config is not None:
                (directory / 'supabase').mkdir(parents=True)
                (directory / 'supabase/config.toml').write_text(changed_config)
            result = subprocess.CompletedProcess([], 0, json.dumps(status or {}), '')
            with patch.object(local, 'WORKDIR', directory), patch('sys.argv', ['local_supabase.py', action]), patch.object(local.subprocess, 'run', return_value=result) as run, contextlib.redirect_stdout(io.StringIO()):
                try:
                    local.main()
                except SystemExit as error:
                    return error.code, run.call_args_list
                return 0, run.call_args_list

    def test_reset_is_explicitly_local_and_removes_inherited_cloud_targets(self):
        with patch.dict(local.os.environ, {'SUPABASE_ACCESS_TOKEN': 'test-only', 'DATABASE_URL': 'forbidden', 'DOCKER_CONTEXT': 'remote'}):
            code, calls = self.run_action('reset')
        self.assertEqual(code, 0)
        command = calls[-1].args[0]
        self.assertEqual(command[-4:], ['db', 'reset', '--local', '--no-seed'])
        self.assertIn('--workdir', command)
        env = calls[-1].kwargs['env']
        self.assertEqual(env['DOCKER_HOST'], 'unix:///var/run/docker.sock')
        for key in ('SUPABASE_ACCESS_TOKEN', 'DATABASE_URL', 'DOCKER_CONTEXT'):
            self.assertNotIn(key, env)

    def test_studio_preserves_data_and_keeps_migrations_disabled(self):
        with tempfile.TemporaryDirectory() as name:
            directory = Path(name) / 'verification'
            (directory / 'supabase').mkdir(parents=True)
            (directory / 'supabase/config.toml').write_text(local.LEGACY_CONFIG)
            def result(command, **kwargs):
                if 'network' in command and 'inspect' in command:
                    return subprocess.CompletedProcess(command, 1, '', '')
                if 'exec' in command:
                    return subprocess.CompletedProcess(command, 0, '17|unchanged-checksum', '')
                return subprocess.CompletedProcess(command, 0, '', '')
            with patch.object(local, 'WORKDIR', directory), patch('sys.argv', ['local_supabase.py', 'studio']), patch.object(local.subprocess, 'run', side_effect=result) as run, contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(SystemExit) as exit:
                    local.main()
                self.assertEqual(exit.exception.code, 0)
                config = local.tomllib.loads((directory / 'supabase/config.toml').read_text())
                self.assertTrue(config['studio']['enabled'])
                self.assertEqual(config['studio']['port'], 55323)
                self.assertEqual(config['api']['port'], 55321)
                self.assertEqual(config['db']['port'], 55322)
                self.assertFalse(config['db']['migrations']['enabled'])
                self.assertFalse(config['db']['seed']['enabled'])
                commands = [call.args[0] for call in run.call_args_list]
                self.assertFalse(any('reset' in c or 'push' in c or '--linked' in c for c in commands))
                started = next(c for c in commands if 'start' in c)
                self.assertIn('--network-id', started)
                self.assertNotIn('studio', started[started.index('--exclude') + 1].split(','))
                self.assertNotIn('postgres-meta', started[started.index('--exclude') + 1].split(','))

    def test_refuses_a_changed_project_config_before_cli_execution(self):
        code, calls = self.run_action('start', changed_config=local.CONFIG.replace(local.PROJECT, 'another-project'))
        self.assertIn('Refusing operation', code)
        self.assertEqual(len(calls), 1)  # Docker info only.

    def test_refuses_nonlocal_status_endpoint(self):
        code, _ = self.run_action('status', {'API_URL': 'https://example.invalid'})
        self.assertIn('nonlocal', code)

    def test_accepts_only_expected_loopback_port(self):
        code, _ = self.run_action('status', {'API_URL': 'http://127.0.0.1:54321'})
        self.assertIn('unexpected', code)
        code, _ = self.run_action('status', {'API_URL': 'http://127.0.0.1:55321'})
        self.assertEqual(code, 0)


if __name__ == '__main__':
    unittest.main()
