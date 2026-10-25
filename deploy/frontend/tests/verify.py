#!/usr/bin/env python3
"""Run from repository root after the isolated compose stack is healthy.
Uses two real Docker client IPs; does not send mutating requests to real backend.
"""
import json
import subprocess

from common import COMPOSE, guard
guard()

def client(name, code):
    result = subprocess.run(COMPOSE + ['exec', '-T', name, 'python', '-c', code],
                            check=False, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return json.loads(result.stdout)

PRELUDE = """
import urllib.request, urllib.error, json, concurrent.futures
BASE = 'http://hoian-edge'
def req(path='/', host='api.buivietquangvinh.xyz', extra=None):
    headers = {'Host': host}
    headers.update(extra or {})
    try:
        r = urllib.request.urlopen(urllib.request.Request(BASE+path, headers=headers), timeout=15)
    except urllib.error.HTTPError as e:
        r = e
    return r.status, dict(r.headers), r.read().decode(errors='replace')
"""

# Verify each virtual host, fallback, assets, cache and no accidental API fallback.
for role in ['user', 'admin', 'owner']:
    code = PRELUDE + f"""
host = 'ha-{role}.buivietquangvinh.xyz'
s,h,body = req(host=host)
assert s == 200 and '<html' in body.lower()
assets = __import__('re').findall(r'(?:src|href)="(/assets/[^"]+)', body)
assert assets
for asset in assets:
    status, headers, data = req(asset,host)
    assert status == 200, (asset,status)
    assert 'immutable' in headers.get('Cache-Control','')
    if asset.endswith('.js'): assert 'javascript' in headers.get('Content-Type','')
    if asset.endswith('.css'): assert 'text/css' in headers.get('Content-Type','')
assert req('/deployment-spa-probe',host)[2] == body
assert req('/api/missing',host)[0] == 404
assert req('/assets/missing.js',host)[0] == 404
for path in ['/.env','/.git/config','/private.key']:
    assert req(path,host)[0] == 404
assert 'no-store' in req('/index.html',host)[1].get('Cache-Control','')
assert req('/healthz',host)[0] == 200
print(json.dumps({{'frontend': '{role}', 'assets':len(assets),'result':'PASS'}}))
"""
    print(client('client-a', code))

# Ordinary API and unknown hostname. Query marker must never appear in logs.
print(client('client-b', PRELUDE + """
s,h,b = req('/api/poi/locations?token=SENSITIVE_TEST_MARKER')
assert s == 200 and 'isolated-api-fixture' in b
assert req(host='unknown.invalid')[0] == 404
print(json.dumps({'api_route':'PASS'}))
"""))
# Exhaust A rapidly; changing untrusted headers must not grant new buckets.
print(client('client-a', PRELUDE + """
def hit(i):
    return req('/api/poi/locations', extra={'CF-Connecting-IP':f'198.51.100.{i+1}', 'X-Forwarded-For':f'203.0.113.{i+1}'})[0]
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    statuses = list(pool.map(hit,range(24)))
assert 200 in statuses and 429 in statuses, statuses
assert req('/some-other-api-path')[0] == 429
assert req('/api/payments/vnpay/ipn')[0] == 200
assert req('/api/payments/test-transaction/status')[0] == 200
assert req('/healthz')[0] == 200
s,h,b = req('/some-other-api-path', extra={'Origin':'https://ha-user.buivietquangvinh.xyz'})
assert s == 429 and h.get('Access-Control-Allow-Origin') == 'https://ha-user.buivietquangvinh.xyz'
assert h.get('Access-Control-Allow-Credentials') == 'true' and h.get('Retry-After') == '6'
s,h,b = req('/some-other-api-path', extra={'Origin':'https://untrusted.invalid'})
assert s == 429 and 'Access-Control-Allow-Origin' not in h
assert req(host='ha-user.buivietquangvinh.xyz')[0] == 200
print(json.dumps({'burst':{str(s):statuses.count(s) for s in set(statuses)}, 'alternate_path_protected':True,'spoof_ignored':True,'ipn_separate':True}))
"""))
print(client('client-b', PRELUDE + """
assert req('/api/poi/locations')[0] == 200
print(json.dumps({'independent_client_ip':'PASS'}))
"""))
print(client('client-a', PRELUDE + """
__import__('time').sleep(2.2)
assert req('/api/poi/locations')[0] == 200
print(json.dumps({'leaky_bucket_recovery':'PASS'}))
"""))
# Separate finite IPN bucket: fixture only, no payment execution.
print(client('client-b', PRELUDE + """
with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
    statuses=list(pool.map(lambda _:req('/api/payments/vnpay/ipn')[0],range(40)))
assert 200 in statuses and 429 in statuses
print(json.dumps({'ipn_finite_bucket':{str(s):statuses.count(s) for s in set(statuses)}}))
"""))
# Redaction check: logs contain status/IP only, no path, query, headers or body.
logs=subprocess.run(COMPOSE+['logs','--no-color','hoian-edge'],capture_output=True,text=True,check=True).stdout
assert 'SENSITIVE_TEST_MARKER' not in logs
print('PASS: sanitized access logs and CORS-safe 429')

print(client('client-a', PRELUDE + """
def options(origin):
    headers={'Host':'api.buivietquangvinh.xyz','Origin':origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}
    try:r=urllib.request.urlopen(urllib.request.Request(BASE+'/api/auth/login',method='OPTIONS',headers=headers),timeout=5)
    except urllib.error.HTTPError as e:r=e
    return r.status,dict(r.headers)
for origin in ['https://ha-user.buivietquangvinh.xyz','https://ha-admin.buivietquangvinh.xyz','https://ha-owner.buivietquangvinh.xyz']:
    status,headers=options(origin)
    assert status==204 and headers.get('Access-Control-Allow-Origin')==origin
assert options('https://untrusted.invalid')[0]==403
print(json.dumps({'preflight_allowlist':'PASS','ordinary_bucket_does_not_starve_options':'PASS'}))
"""))
print(client('client-b', PRELUDE + """
# Separate polling bucket: two tabs at 3 seconds => 40/min is below 120/min.
statuses=[]
for _ in range(18): statuses.append(req('/api/payments/fixture/status')[0])
assert 200 in statuses and 429 in statuses
print(json.dumps({'polling_finite_bucket':'PASS'}))
"""))
print(client('client-b', PRELUDE + """
# Fixture only: no login/password or payment is created.
statuses=[req('/api/auth/login')[0] for _ in range(6)]
assert 200 in statuses and 429 in statuses
print(json.dumps({'login_finite_bucket':'PASS'}))
"""))
# Wait for a quiet ordinary bucket before testing the stricter payment bucket.
print(client('client-a', PRELUDE + """
__import__('time').sleep(12)
statuses=[req('/api/payments')[0] for _ in range(5)]
assert 200 in statuses and 429 in statuses
print(json.dumps({'payment_create_finite_bucket':'PASS'}))
"""))
