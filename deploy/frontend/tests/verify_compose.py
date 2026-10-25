#!/usr/bin/env python3
"""Read-only Compose regression against the real pinned backend Compose file."""
import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
REVISION='42d982969a3a656131ebaf0864678f69042e6313'

def render(files):
    command=['docker','compose','--env-file','/dev/null','-p','hoian-config-validation']
    for file in files: command += ['-f',str(file)]
    command += ['config','--no-interpolate','--format','json']
    return subprocess.run(command,cwd=ROOT,capture_output=True,text=True)

def main():
    original=subprocess.check_output(['git','show',REVISION+':HA_App/docker-compose.yml'],cwd=ROOT)
    with tempfile.TemporaryDirectory(prefix='hoian-backend-compose-') as directory:
        backend=Path(directory)/'backend.yml';backend.write_bytes(original)
        baseline=json.loads(render([backend]).stdout)
        production=render([backend,ROOT/'deploy/frontend/compose.yml',
                           ROOT/'deploy/frontend/backend.integration.example.yml',
                           ROOT/'deploy/frontend/backend.cors.production.yml'])
        if production.returncode: raise RuntimeError(production.stderr)
        services=json.loads(production.stdout)['services']
        for name in ['app','postgres','redis','cloudflared']:
            for key in ['build','image','container_name','ports','volumes','command']:
                assert services[name].get(key)==baseline['services'][name].get(key),(name,key)
        environment=services['app']['environment']
        if isinstance(environment,list):
            environment=dict(entry.split('=',1) for entry in environment)
        assert environment['CORS_ALLOWED_ORIGINS']==','.join(
            'https://ha-'+role+'.buivietquangvinh.xyz' for role in ['user','admin','owner'])
        assert set(services['app']['networks'])=={'backend','api_edge'}
        for role in ['user','admin','owner']:
            svc=services['hoian-frontend-'+role]
            assert set(svc['networks'])=={'frontend'} and not svc.get('ports')
        # Render-only misuse regression. Refusal is safe; if accepted, app must be unchanged.
        wrong=render([backend,ROOT/'deploy/frontend/compose.local.yml'])
        if wrong.returncode==0:
            app=json.loads(wrong.stdout)['services']['app']
            assert app.get('image')==baseline['services']['app'].get('image')
            assert app.get('build')==baseline['services']['app'].get('build')
            print('PASS wrong-merge regression: backend image/build preserved')
        else:
            print('PASS wrong-merge regression: standalone test file rejected in backend combination')
        print('PASS production Compose render: Spring/backend image, build, ports, command and data volumes preserved; exact CORS allowlist')

if __name__=='__main__':main()
