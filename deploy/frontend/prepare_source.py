#!/usr/bin/env python3
"""Materialize pinned Git frontend sources outside the deployment-only checkout."""
import argparse
import io
import json
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2]
REVISION = '42d982969a3a656131ebaf0864678f69042e6313'
FRONTENDS = ['HA.USER/hoi-an-app', 'HA_ADMIN', 'HA_Store Owner']

def prepare():
    revision = subprocess.check_output(['git', 'rev-parse', REVISION+'^{commit}'], cwd=ROOT, text=True).strip()
    archive = subprocess.check_output(['git', 'archive', revision, '--', *FRONTENDS], cwd=ROOT)
    target = Path(tempfile.mkdtemp(prefix='hoian-build-source-'))
    with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
        for member in tar:
            path = PurePosixPath(member.name)
            if path.is_absolute() or '..' in path.parts:
                raise RuntimeError('Unsafe archive path')
            if any(part.startswith('.env') or part in {'.git', 'node_modules', 'dist'} for part in path.parts):
                continue
            if member.isdir():
                continue
            if not member.isfile():
                raise RuntimeError('Unsupported archive member')
            output = target / member.name
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(tar.extractfile(member).read())
    for frontend in FRONTENDS:
        for filename in ['Dockerfile', '.dockerignore', 'nginx.conf']:
            shutil.copyfile(ROOT/frontend/filename, target/frontend/filename)
    (target/'source-manifest.json').write_text(json.dumps({'revision':revision,'frontends':FRONTENDS},indent=2)+'\n')
    return target

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    print(prepare())
