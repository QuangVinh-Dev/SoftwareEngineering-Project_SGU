import json
import os
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
PROJECT=os.environ.get('HOIAN_TEST_PROJECT','')
if not PROJECT.startswith('hoian-deploy-test-'):
    raise RuntimeError('Run tests/run.py: unique isolated project required')
COMPOSE=['docker','compose','--env-file','/dev/null','-p',PROJECT,'-f',str(ROOT/'deploy/frontend/compose.local.yml')]

def guard():
    cid=subprocess.check_output(COMPOSE+['ps','-q','hoian-api-fixture'],text=True).strip()
    info=json.loads(subprocess.check_output(['docker','inspect',cid]))[0]
    assert info['Config']['Labels']['com.docker.compose.project']==PROJECT
    assert info['Config']['Image'].startswith('hoian-api-fixture:test-')
    assert all(name.startswith(PROJECT+'_') for name in info['NetworkSettings']['Networks'])
