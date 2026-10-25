#!/usr/bin/env python3
"""Audit local runtime artifacts/config without printing environment secrets."""
import json
import re
import subprocess
import tempfile
from pathlib import Path

from common import COMPOSE, PROJECT, guard
guard()

def run(args):
    return subprocess.run(args, check=True, capture_output=True).stdout

secrets = []
for directory in ['HA_App', 'HA.USER/hoi-an-app', 'HA_ADMIN', 'HA_Store Owner']:
    for path in Path(directory).glob('.env*'):
        for line in path.read_text().splitlines():
            key, sep, value = line.partition('=')
            value = value.strip().strip('\"\'')
            if sep and re.search(r'SECRET|PASSWORD|TOKEN|PRIVATE_KEY', key, re.I) and len(value) >= 12:
                secrets.append(value.encode())

for service in ['hoian-frontend-user', 'hoian-frontend-admin', 'hoian-frontend-owner', 'hoian-edge']:
    cid = run(COMPOSE + ['ps', '-q', service]).decode().strip()
    info = json.loads(run(['docker', 'inspect', cid]))[0]
    assert info['Config']['User'] == 'nginx'
    assert info['HostConfig']['ReadonlyRootfs']
    assert info['State']['Health']['Status'] == 'healthy'
    syntax = run(COMPOSE + ['exec', '-T', service, 'nginx', '-t'])
    history = run(['docker', 'history', '--no-trunc', info['Image']])
    config = json.dumps(info['Config']).encode()
    assert not any(secret in history or secret in config for secret in secrets)
    if service == 'hoian-edge':
        print(service, 'PASS syntax/nonroot/read-only/health/image config')
        continue
    networks = list(info['NetworkSettings']['Networks'])
    assert networks == [PROJECT+'_frontend'], networks
    with tempfile.TemporaryDirectory(prefix='hoian-artifact-') as temp:
        run(['docker', 'cp', cid + ':/usr/share/nginx/html/.', temp])
        files = [p for p in Path(temp).rglob('*') if p.is_file()]
        assert not any(p.name.startswith('.') or p.suffix == '.map' for p in files)
        assert not (Path(temp)/'src').exists()
        assert not (Path(temp)/'node_modules').exists()
        bundle = b'\n'.join(p.read_bytes() for p in files)
        assert b'https://api.buivietquangvinh.xyz' in bundle
        assert b'localhost:9999' not in bundle
        assert not any(secret in bundle for secret in secrets), 'Known secret detected; values suppressed'
        # Check every emitted static file through the central proxy, including images.
        image_count = 0
        role = service.removeprefix('hoian-frontend-')
        for p in files:
            path = '/' + p.relative_to(temp).as_posix()
            if path == '/50x.html':  # inherited non-sensitive stock Nginx error page
                continue
            result = run(COMPOSE + ['exec', '-T', 'client-a', 'python', '-c',
                "import urllib.request; r=urllib.request.urlopen(urllib.request.Request(" +
                repr('http://hoian-edge'+path) + ",headers={'Host':" +
                repr('ha-'+role+'.buivietquangvinh.xyz') + "})); assert r.status==200; r.read()"])
            if p.suffix.lower() in ['.png','.jpg','.jpeg','.svg','.webp','.gif','.ico']:
                image_count += 1
        print(service, 'PASS syntax/nonroot/read-only/health/isolated network/production URL/static files',
              'images='+str(image_count), 'known-secret-check=PASS')
print('PASS artifact audit; not a full third-party vulnerability or arbitrary-secret scan')
