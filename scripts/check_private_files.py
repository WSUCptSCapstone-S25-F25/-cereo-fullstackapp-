"""Block private files and embedded credentials without printing their contents."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
RULES = [
    ('private key', re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')),
    ('credential URL', re.compile(rb'postgres(?:ql)?://[^\s\x27\x22<>:]+:[^\s\x27\x22<>]+@')),
    ('Mapbox token', re.compile(rb'(?:pk|sk)\.eyJ[A-Za-z0-9_.-]+')),
    ('cloud API key', re.compile(rb'(?:AKIA|ASIA)[A-Z0-9]{16}|SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}')),
    ('literal password', re.compile(rb'(?i)(?:password|passwd|sender_password)\s*[:=]\s*[\x27\x22](?![<{\x27\x22])[^\x27\x22\r\n]{8,}[\x27\x22]')),
]


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def private_path(path):
    parts = Path(path).parts
    name = Path(path).name.lower()
    return (
        path.startswith('documentation/') and path != 'documentation/chatbot_development_progress.md'
        or any(p in {'.private', 'node_modules', 'myenv', '.vs', '__pycache__', '.netlify'} for p in parts)
        or name.startswith('.env') and name not in {'.env.example', '.env.template'}
        or name.startswith('servicekey') and name.endswith('.json')
        or 'service-account' in name or 'service_account' in name
        or name.endswith(('.pem', '.key'))
        or path.startswith('LivingAtlas1-main/database/db_dump/')
        or re.match(r'LivingAtlas1-main/database/database_schema/livingAtlas_Defualt_Insert_Data.*\.sql$', path)
        or path == '.claude/settings.local.json' or path.startswith('.claude/worktrees/')
    )


def inspect(entries, worktree=False):
    failures = []
    for oid, path in entries:
        if private_path(path):
            failures.append((path, 'private file'))
            continue
        data = (ROOT / path).read_bytes() if worktree else git('cat-file', 'blob', oid)
        for reason, pattern in RULES:
            if pattern.search(data):
                failures.append((path, reason))
                break
    if failures:
        print('BLOCKED: private data detected; file contents are not displayed.', file=sys.stderr)
        for path, reason in failures[:20]:
            print(f'  {path}: {reason}', file=sys.stderr)
        print('Rotate exposed credentials and clean outgoing history before pushing.', file=sys.stderr)
        return 1
    print('Private-file check passed.')
    return 0


def index_entries(worktree=False, staged_only=False):
    result = []
    staged_paths = None
    if staged_only:
        staged_paths = {
            path.decode('utf-8')
            for path in git('diff', '--cached', '--name-only', '--diff-filter=ACM', '-z').split(b'\0')
            if path
        }
    for entry in git('ls-files', '--stage', '-z').split(b'\0'):
        if not entry:
            continue
        metadata, path_bytes = entry.split(b'\t', 1)
        mode, oid, stage = metadata.split()
        path = path_bytes.decode('utf-8')
        if staged_paths is not None and path not in staged_paths:
            continue
        if mode == b'160000':
            raise RuntimeError('Submodules must be reviewed separately before pushing.')
        if worktree and not (ROOT / path).is_file():
            continue
        result.append((oid.decode(), path))
    return result


def main():
    if '--pre-push' not in sys.argv:
        return inspect(index_entries('--worktree' in sys.argv, '--staged' in sys.argv), '--worktree' in sys.argv)
    entries = set()
    for line in sys.stdin:
        local_ref, local_sha, remote_ref, remote_sha = line.split()
        if set(local_sha) == {'0'}:
            continue
        args = ['rev-list', '--objects', local_sha]
        if set(remote_sha) != {'0'}:
            # An unknown remote object fails closed rather than skipping history.
            args.append('^' + remote_sha)
        objects = []
        for entry in git(*args).decode('utf-8').splitlines():
            oid, separator, path = entry.partition(' ')
            if separator:
                objects.append((oid, path))
        forbidden = [(oid, path) for oid, path in objects if private_path(path)]
        if forbidden:
            return inspect(forbidden)
        for oid, path in objects:
            if git('cat-file', '-t', oid).strip() == b'blob':
                entries.add((oid, path))
    return inspect(sorted(entries))


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(f'Private-file check could not complete ({type(error).__name__}); push blocked.', file=sys.stderr)
        sys.exit(1)
