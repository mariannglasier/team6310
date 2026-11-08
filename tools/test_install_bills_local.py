"""Local installer target/refusal tests; no Docker or database required."""
import contextlib
import io
import json
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
        self.assertFalse(any('DELETE' in statement or 'ALTER TABLE' in statement for statement in statements))
        return result, statements

    def test_readiness_is_read_only_for_the_old_fixture(self):
        result, statements = self.invoke({'marker': False, 'functions': 0, 'triggers': 0,
                                         'definitions': 1, 'occurrences': 0}, ['--check'])
        self.assertEqual(result, 1)
        self.assertEqual(len(statements), 2)

    def test_default_install_never_removes_existing_content(self):
        result, _ = self.invoke({'marker': False, 'functions': 0, 'triggers': 0,
                                'definitions': 1, 'occurrences': 0})
        self.assertIn('No data changed', result)

    def test_partial_install_is_not_reapplied(self):
        result, _ = self.invoke({'marker': True, 'functions': 2, 'triggers': 0,
                                'definitions': 0, 'occurrences': 0})
        self.assertIn('Partial bills installation', result)

    def test_installed_stack_is_not_mutated(self):
        result, statements = self.invoke({'marker': True, 'functions': len(installer.FUNCTIONS),
                                         'triggers': len(installer.TRIGGERS), 'definitions': 0,
                                         'occurrences': 0})
        self.assertIsNone(result)
        self.assertEqual(len(statements), 2)

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
