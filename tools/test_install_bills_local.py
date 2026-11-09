"""Local installer target/refusal tests; no Docker or database required."""
import contextlib
import io
import json
import re
import hashlib
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import install_bills_local as installer


class InstallerTests(unittest.TestCase):
    def invoke(self, status, arguments=(), container=None):
        info = container or {'Name': '/' + installer.CONTAINER, 'State': {'Running': True},
                             'Mounts': [{'Name': installer.CONTAINER, 'Type': 'volume'}]}
        statements = []
        expected={}
        for name in installer.MIGRATIONS:
            for match in re.finditer(r'CREATE FUNCTION public\.(\w+)\([^;]*?\$\$(.*?)\$\$;', (installer.ROOT/'supabase/migrations'/name).read_text(), re.S):
                expected[match[1]]=hashlib.md5(match[2].encode()).hexdigest()
        status={'history_table':False,'source_hashes':expected,**status}

        def run(command, **kwargs):
            self.assertEqual(command[:3], installer.DOCKER)
            self.assertIn('/var/run/postgresql', command)
            statement = kwargs['input']
            statements.append(statement)
            value = 't' if statement.startswith('select to_regclass') else json.dumps(status)
            return subprocess.CompletedProcess(command, 0, value, '')

        with patch.object(sys, 'argv', ['install_bills_local.py', *arguments]), \
                patch.object(installer.subprocess, 'check_output', return_value=json.dumps([info])), \
                patch.object(installer.subprocess, 'run', side_effect=run), \
                contextlib.redirect_stdout(io.StringIO()):
            try:
                installer.main()
                result = None
            except SystemExit as error:
                result = error.code
        if '--refresh-development-sql' not in arguments:
            self.assertFalse(any('DELETE' in statement or 'ALTER TABLE' in statement for statement in statements))
        return result, statements

    def test_readiness_is_read_only_for_the_old_fixture(self):
        result, statements = self.invoke({'obsolete_column': False, 'functions': 0, 'triggers': 0,
                                         'definitions': 1, 'occurrences': 0}, ['--check'])
        self.assertEqual(result, 1)
        self.assertEqual(len(statements), 2)

    def test_default_install_never_removes_existing_content(self):
        result, _ = self.invoke({'obsolete_column': False, 'functions': 0, 'triggers': 0,
                                'definitions': 1, 'occurrences': 0})
        self.assertIn('No data changed', result)

    def test_partial_install_is_not_reapplied(self):
        result, _ = self.invoke({'obsolete_column': True, 'functions': 2, 'triggers': 0,
                                'definitions': 0, 'occurrences': 0})
        self.assertIn('Existing/partial bills schema differs', result)

    def test_installed_stack_is_not_mutated(self):
        result, statements = self.invoke({'obsolete_column': False, 'functions': len(installer.FUNCTIONS),
                                         'triggers': len(installer.TRIGGERS), 'definitions': 0,
                                         'occurrences': 0})
        self.assertIsNone(result)
        self.assertEqual(len(statements), 2)

    def test_changed_sources_are_not_silently_accepted(self):
        result, statements = self.invoke({'obsolete_column': False, 'functions': len(installer.FUNCTIONS),
                                         'triggers': len(installer.TRIGGERS), 'source_hashes': {},
                                         'definitions': 8, 'occurrences': 24}, ['--check'])
        self.assertEqual(result, 1)
        self.assertEqual(len(statements), 2)

    def test_development_refresh_refuses_recorded_history(self):
        result, statements = self.invoke({'obsolete_column': True, 'functions': len(installer.FUNCTIONS),
                                         'triggers': len(installer.TRIGGERS), 'history_table': True,
                                         'definitions': 8, 'occurrences': 24}, ['--refresh-development-sql'])
        self.assertIn('no recorded migration ledger', result)
        self.assertEqual(len(statements), 2)

    def test_explicit_refresh_is_atomic_and_does_not_replay_migrations(self):
        result, statements = self.invoke({'obsolete_column': True, 'functions': len(installer.FUNCTIONS),
                                         'triggers': len(installer.TRIGGERS),
                                         'definitions': 8, 'occurrences': 24}, ['--refresh-development-sql'])
        self.assertIsNone(result)
        refresh = statements[-1]
        self.assertTrue(refresh.startswith('BEGIN;'))
        self.assertTrue(refresh.endswith('COMMIT;'))
        self.assertEqual(refresh.count('CREATE OR REPLACE FUNCTION'), 9)
        self.assertIn('DROP COLUMN IF EXISTS expenses_initialized_at', refresh)
        self.assertIn('Gameplay data changed; rolling back', refresh)
        self.assertIn("NOTIFY pgrst,'reload schema'", refresh)
        self.assertNotIn('DELETE FROM', refresh)
        self.assertNotIn('CREATE TRIGGER', refresh)
        self.assertNotIn('schema_migrations', refresh)

    def test_unexpected_container_is_rejected_before_sql(self):
        result, statements = self.invoke({}, container={'Name': '/hosted', 'State': {'Running': True}, 'Mounts': []})
        self.assertIn('Refusing', result)
        self.assertEqual(statements, [])

    def test_each_migration_has_one_outer_transaction_removed(self):
        for name in installer.MIGRATIONS:
            source = (installer.ROOT / 'supabase/migrations' / name).read_text()
            body = installer.migration_body(source)
            self.assertNotIn('\nBEGIN;\n', body)
            self.assertNotIn('\nCOMMIT;', body)
            self.assertIn('CREATE FUNCTION', body)
        with self.assertRaises(ValueError):
            installer.migration_body('select 1;')


if __name__ == '__main__':
    unittest.main()
