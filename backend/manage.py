#!/usr/bin/env python
import os
import sys
from pathlib import Path


def main():
    project_dir = Path(__file__).resolve().parent
    venv_python = project_dir / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')

    if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
        os.execv(str(venv_python), [str(venv_python), *sys.argv])

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError('Could not import Django. Is it installed and available on your PYTHONPATH?') from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
