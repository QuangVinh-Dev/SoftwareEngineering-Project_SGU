#!/usr/bin/env python3
"""Build and test only a new, isolated project against pinned Git sources."""
import importlib.util
import json
import os
import subprocess
import sys
import uuid
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]

def main():
    if os.environ.get('DOCKER_HOST') and not os.environ['DOCKER_HOST'].startswith('unix://'):
        raise SystemExit('Refusing nonlocal DOCKER_HOST')
    endpoint=subprocess.check_output(['docker','context','inspect','--format','{{.Endpoints.docker.Host}}'],text=True).strip()
    if not endpoint.startswith('unix://'):
        raise SystemExit('Refusing nonlocal Docker context')
    spec=importlib.util.spec_from_file_location('prepare_source',ROOT/'deploy/frontend/prepare_source.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    source=module.prepare()
    testid=uuid.uuid4().hex[:12]
    env={**os.environ,'HOIAN_BUILD_ROOT':str(source),'FRONTEND_TAG':'test-'+testid,
         'HOIAN_TEST_PROJECT':'hoian-deploy-test-'+testid,'PYTHONDONTWRITEBYTECODE':'1'}
    command=['docker','compose','--env-file','/dev/null','-p',env['HOIAN_TEST_PROJECT'],'-f',str(ROOT/'deploy/frontend/compose.local.yml')]
    config=json.loads(subprocess.check_output(command+['config','--format','json'],env=env,cwd=ROOT))
    assert 'app' not in config['services'], 'Fixture must not override backend app'
    for service in config['services'].values():
        assert not service.get('container_name') and not service.get('ports') and not service.get('volumes')
    for network in config['networks'].values():
        assert not network.get('external') and network['name'].startswith(env['HOIAN_TEST_PROJECT']+'_')
    state={'project':env['HOIAN_TEST_PROJECT'],'source':str(source),'tag':env['FRONTEND_TAG']}
    statefile=source/'test-state.json';statefile.write_text(json.dumps(state,indent=2)+'\n')
    print(json.dumps(state),flush=True)
    subprocess.run([sys.executable,str(ROOT/'deploy/frontend/tests/verify_compose.py')],check=True,env=env,cwd=ROOT)
    subprocess.run(command+['build'],check=True,env=env,cwd=ROOT)
    subprocess.run(command+['up','-d','--wait','--wait-timeout','90'],check=True,env=env,cwd=ROOT)
    for script in ['verify.py','audit.py']:
        subprocess.run([sys.executable,str(ROOT/'deploy/frontend/tests'/script)],check=True,env=env,cwd=ROOT)
    print('ALL LOCAL TESTS PASSED. Containers retained for inspection; no production changes.',flush=True)
    print('State file: '+str(statefile),flush=True)

if __name__=='__main__':main()
