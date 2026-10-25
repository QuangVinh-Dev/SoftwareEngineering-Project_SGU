#!/usr/bin/env python3
"""Enforce configuration-only staging; never print matched sensitive values."""
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
EXACT={str(Path(directory)/filename) for directory in ['HA.USER/hoi-an-app','HA_ADMIN','HA_Store Owner']
       for filename in ['Dockerfile','.dockerignore','nginx.conf']}
EXACT|={'docs/FRONTEND_DOCKER_DEPLOYMENT.md','docs/FRONTEND_DOCKER_TEST_RESULTS.md'}

def main():
    branch=subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()
    assert branch=='deploy/frontend-docker-hostfix', 'Wrong deployment branch'
    files=subprocess.check_output(['git','diff','--cached','--name-only','-z'],cwd=ROOT).decode().split('\0')
    files=[name for name in files if name]
    assert files, 'Nothing staged'
    for name in files:
        path=Path(name)
        assert name in EXACT or name.startswith('deploy/frontend/'), 'Out-of-scope staged file'
        assert not any(part in {'src','node_modules','dist','Data_Storage','__pycache__'} or part.startswith('.env') for part in path.parts)
        assert path.suffix not in {'.pyc','.log','.pem','.key','.p12','.pfx','.dump','.mp3','.png','.jpg'}
        data=subprocess.check_output(['git','show',':'+name],cwd=ROOT)
        patterns=[rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
                  rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'AKIA[A-Z0-9]{16}']
        assert not any(re.search(pattern,data) for pattern in patterns), 'Possible secret in staged content'
    subprocess.run(['git','diff','--cached','--check'],cwd=ROOT,check=True)
    print('PASS configuration-only staged allowlist and sensitive-file/token checks:',len(files),'files')

if __name__=='__main__':main()
