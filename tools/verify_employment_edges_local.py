"""Additional actual local API/connection tests; requires seeded verifier."""
import json
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
from verify_employment_local import ROOT, DOCKER, auth, request, sql

fixture=json.loads(Path('/tmp/team6310-phase2-verification/fixture.json').read_text())
token,owner=auth()
def row(id):return json.loads(sql(f"select to_jsonb(p) from playthroughs p where playthrough_id='{id}';"))
def create(t=token):return request('/rest/v1/rpc/start_individual_playthrough',{'p_persona_id':fixture['persona']},t)
def act(id,intent,rev=None,request_id=None,reject=False,t=token):
    before=row(id)
    if rev is None:rev=before['employment_state']['revision']
    result=request('/rest/v1/rpc/submit_employment_action',{'p_run_id':id,'p_request_id':request_id or str(uuid.uuid4()),'p_revision':rev,'p_action':intent},t,allowed=(400,401,403,404) if reject else (200,))
    if reject:assert row(id)==before
    return result
id=create();act(id,{'type':'initialize'})
for intent in [None,[],{}, {'type':'apply','jobId':str(uuid.uuid4())},{'type':'apply','jobId':False},{'type':'initialize','replayOf':[]},{'type':'end','arbitraryState':{}}]:act(id,intent,reject=True)
act(id,{'type':'apply','jobId':fixture['first']});act(id,{'type':'continue'});act(id,{'type':'continue'});act(id,{'type':'interview','choice':'current'});act(id,{'type':'continue'});act(id,{'type':'apply','jobId':fixture['fallback']});act(id,{'type':'continue'});act(id,{'type':'continue'});act(id,{'type':'interview','choice':'current'});act(id,{'type':'continue'})
while row(id)['current_day']<9:act(id,{'type':'continue'})
rev=row(id)['employment_state']['revision'];request_id=str(uuid.uuid4())
def pay(rid):
    return request('/rest/v1/rpc/submit_employment_action',{'p_run_id':id,'p_request_id':rid,'p_revision':rev,'p_action':{'type':'continue'}},token,allowed=(200,400))
with ThreadPoolExecutor(2) as pool:results=list(pool.map(pay,[request_id,str(uuid.uuid4())]))
assert sum('run' in r for r in results)==1
assert row(id)['current_day']==10 and float(row(id)['current_balance'])==600
assert row(id)['employment_state']['creditedDays']==[10]
# Retry the winning request after its response could have been lost.
winner=next(k for k in row(id)['employment_state']['receipts'] if row(id)['employment_state']['receipts'][k]['expectedRevision']==rev)
act(id,{'type':'continue'},rev,winner);assert float(row(id)['current_balance'])==600
act(id,{'type':'continue'});assert float(row(id)['current_balance'])==600
claims=json.dumps({'sub':owner,'is_anonymous':True})
for operation in [f"update playthroughs set current_balance=999 where playthrough_id='{id}'",f"delete from playthroughs where playthrough_id='{id}'"]:
    error=sql(f"begin;set local role authenticated;select set_config('request.jwt.claims','{claims}',true);{operation};",fail=True)
    assert 'permission denied' in error
registered,_=auth(True);registered_run=create(registered);assert row(registered_run)['employment_state'] is None
act(registered_run,{'type':'initialize'},0,reject=True,t=registered)
# Reject textual versions and unfamiliar documents without replacing either.
for document in [{'engine':'employment-v1','schemaVersion':'1','revision':0,'stage':'uninitialized','receipts':{}},{'engine':'other','schemaVersion':1}]:
    unsupported=create();sql(f"update playthroughs set employment_state='{json.dumps(document)}' where playthrough_id='{unsupported}';")
    act(unsupported,{'type':'initialize'},0,reject=True)
print('PASS: actual API malformed types/IDs, day-10 concurrent wage credit once, receipt retry and acknowledgment without another credit, direct UPDATE/DELETE denied, registered-run trigger exclusion, incompatible JSON preservation.')
