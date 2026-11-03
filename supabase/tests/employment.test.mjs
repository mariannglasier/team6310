// Isolated test schema only; never a baseline or hosted migration.
// Run: PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node supabase/tests/employment.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const {PGlite} = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`create role leaked_default; alter default privileges grant execute on functions to leaked_default; create role anon; create role authenticated; create schema auth; grant usage on schema auth to authenticated;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('test.anonymous',true),''),'true')::boolean)$$;
create table content_versions(version_id uuid primary key,status text,published_at timestamptz);
create table personas(persona_id uuid primary key,version_id uuid,general_starting_balance numeric,has_english_skills boolean,has_computer_skills boolean);
create table jobs(job_id uuid primary key,version_id uuid,title text,is_active boolean,is_approved boolean,needs_english_skills boolean,needs_computer_skills boolean,weekly_gross_income numeric);
create table playthroughs(playthrough_id uuid primary key default gen_random_uuid(),persona_id uuid,current_scenario_id uuid,current_balance numeric,current_day smallint,cac_support_enabledabled boolean,status text,started_at timestamptz,version_id uuid,session_id uuid,employment_state jsonb,current_job_id uuid,owner_user_id uuid);
alter table playthroughs enable row level security;
grant select,insert on playthroughs to authenticated;
create policy own_read on playthroughs for select to authenticated using(owner_user_id=auth.uid());
create policy own_insert on playthroughs for insert to authenticated with check(owner_user_id=auth.uid() and employment_state is null and current_job_id is null and cac_support_enabledabled is null);
`);
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const owner=uuid(1),version=uuid(2),persona=uuid(3),job=uuid(4),otherJob=uuid(5);
await db.exec(`set test.uid='${owner}';insert into content_versions values('${version}','published',now());insert into personas values('${persona}','${version}',100,false,false);insert into jobs values('${job}','${version}','First',true,true,false,false,40),('${otherJob}','${version}','Other',true,true,false,false,40);`);
async function fresh(n,balance=100) {
 const id=uuid(n);
 const insertOwner=(await db.query('select auth.uid() uid')).rows[0].uid;
 if(balance!==100) await db.query('update personas set general_starting_balance=$1 where persona_id=$2',[balance,persona]);
 await db.query(`insert into playthroughs(playthrough_id,persona_id,version_id,owner_user_id,current_balance,current_day,status,started_at) values($1,$2,$3,$4,$5,1,'active',now())`,[id,persona,version,insertOwner,balance]);
 if(balance!==100) await db.query('update personas set general_starting_balance=100 where persona_id=$1',[persona]);
 return id;
}
await db.exec(readFileSync(new URL('../migrations/20261027064542_create_anon_individual_playthrough_rpc.sql',import.meta.url),'utf8'));
const rpcLegacy=(await db.query('select start_individual_playthrough($1) id',[persona])).rows[0].id;
assert.equal((await state(rpcLegacy)).employment_state,null);
const legacy=await fresh(10);
const migration=readFileSync(new URL('../migrations/20261103000000_employment_gameplay.sql',import.meta.url),'utf8');
await assert.rejects(()=>db.exec(migration),/Deployment blocked/);await db.exec('rollback');
await db.exec('set cac.employment_security_reviewed=on');await db.exec(migration);
for(const signature of ['public.valid_employment_document(jsonb)','public.mark_fresh_employment_run()','public.submit_employment_action(uuid,uuid,integer,jsonb)']) {
 const security=(await db.query(`select p.proowner=c.relowner as correct_owner,has_function_privilege('leaked_default',p.oid,'EXECUTE') as leaked from pg_proc p cross join pg_class c where p.oid=$1::regprocedure and c.oid='public.playthroughs'::regclass`,[signature])).rows[0];
 assert.equal(security.correct_owner,true);assert.equal(security.leaked,false);
}
assert.equal((await db.query(`select has_function_privilege('anon','public.submit_employment_action(uuid,uuid,integer,jsonb)','EXECUTE') ok`)).rows[0].ok,false);
assert.equal((await db.query(`select has_function_privilege('authenticated','public.mark_fresh_employment_run()','EXECUTE') ok`)).rows[0].ok,false);

const rpcFresh=(await db.query('select start_individual_playthrough($1) id',[persona])).rows[0].id;
const rpcFreshRow=(await db.query('select * from playthroughs where playthrough_id=$1',[rpcFresh])).rows[0];
assert.equal(rpcFreshRow.employment_state.stage,'uninitialized');assert.equal(rpcFreshRow.current_day,1);assert.equal(Number(rpcFreshRow.current_balance),100);
assert.equal((await db.query('select employment_state from playthroughs where playthrough_id=$1',[rpcLegacy])).rows[0].employment_state,null);
let sequence=1000;
async function state(id){return (await db.query('select * from playthroughs where playthrough_id=$1',[id])).rows[0]}
async function act(id,action,rev,request=uuid(sequence++)) {if(rev===undefined)rev=(await state(id)).employment_state?.revision??0;return (await db.query('select submit_employment_action($1,$2,$3,$4) result',[id,request,rev,action])).rows[0].result}
await assert.rejects(()=>act(legacy,{type:'initialize'}),/Unsupported/);assert.equal((await state(legacy)).employment_state,null);
const run=await fresh(11);const request=uuid(sequence++);
await act(run,{type:'initialize'},0,request);await act(run,{type:'initialize'},0,request);
await assert.rejects(()=>act(run,{type:'end'},0,request),/identity reused/);
await assert.rejects(()=>act(run,{type:'prepare'}),/unavailable/);
await assert.rejects(()=>act(run,{type:'apply',jobId:job,balance:1000}),/Unexpected/);
await db.exec(`set role authenticated;`);
const authenticatedFresh=await fresh(20);assert.equal((await state(authenticatedFresh)).employment_state.stage,'uninitialized');
await assert.rejects(()=>db.query('update playthroughs set current_balance=1000 where playthrough_id=$1',[run]),/permission denied/);
await act(run,{type:'apply',jobId:job});
await db.exec(`set test.uid='${uuid(99)}'`);await assert.rejects(()=>act(run,{type:'end'},2),/unavailable/);await db.exec(`reset role;set test.uid='${owner}'`);
await act(run,{type:'continue'});await act(run,{type:'continue'});
const rev=(await state(run)).employment_state.revision;const purchaseRequest=uuid(sequence++);
await act(run,{type:'interview',choice:'purchase'},rev,purchaseRequest);await act(run,{type:'interview',choice:'purchase'},rev,purchaseRequest);
assert.equal(Number((await state(run)).current_balance),40);
await assert.rejects(()=>act(run,{type:'continue'},rev),/Stale/);
await act(run,{type:'continue'});assert.equal((await state(run)).current_day,2);
await act(run,{type:'apply',jobId:otherJob});await act(run,{type:'continue'});await act(run,{type:'continue'});await act(run,{type:'interview',choice:'owned'});
assert.equal((await state(run)).current_job_id,otherJob);
while((await state(run)).employment_state.stage!=='complete')await act(run,{type:'continue'});
const completed=await state(run);assert.equal(completed.status,'completed');assert.equal(Number(completed.current_balance),160);assert.deepEqual(completed.employment_state.creditedDays,[10,17,24]);
await assert.rejects(()=>act(run,{type:'end'}),/not active/);
const replay=await fresh(12);await act(replay,{type:'initialize',replayOf:run});assert.equal((await state(replay)).cac_support_enabledabled,true);
await act(replay,{type:'prepare'});await act(replay,{type:'continue'});await act(replay,{type:'apply',jobId:job});await act(replay,{type:'continue'});await act(replay,{type:'continue'});await act(replay,{type:'interview',choice:'cac'});
assert.equal((await state(replay)).employment_state.hiredDay,2);
while((await state(replay)).employment_state.stage!=='complete')await act(replay,{type:'continue'});
assert.deepEqual((await state(replay)).employment_state.creditedDays,[9,16,23,30]);
const next=await fresh(13);await assert.rejects(()=>act(next,{type:'initialize',replayOf:replay}),/not eligible/);
await db.exec(`set test.uid='${uuid(99)}'`);const foreign=await fresh(14);await db.query('update playthroughs set owner_user_id=$1 where playthrough_id=$2',[uuid(99),foreign]);await assert.rejects(()=>act(foreign,{type:'initialize',replayOf:run}),/not eligible/);await db.exec(`set test.uid='${owner}'`);
const poor=await fresh(15,59.99);await act(poor,{type:'initialize'});await act(poor,{type:'apply',jobId:job});await act(poor,{type:'continue'});await act(poor,{type:'continue'});await act(poor,{type:'interview',choice:'purchase'});assert.equal((await state(poor)).status,'ended');assert.equal(Number((await state(poor)).current_balance),59.99);
const unknown=await fresh(16);await db.query(`update playthroughs set employment_state='{"schemaVersion":2}' where playthrough_id=$1`,[unknown]);await assert.rejects(()=>act(unknown,{type:'initialize'},0),/Unsupported/);
const race=await fresh(17);await act(race,{type:'initialize'});const raceRev=(await state(race)).employment_state.revision;
const outcomes=await Promise.allSettled([act(race,{type:'apply',jobId:job},raceRev),act(race,{type:'apply',jobId:otherJob},raceRev)]);
assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal((await state(race)).employment_state.revision,raceRev+1);
const repeat=await fresh(18);await act(repeat,{type:'initialize',replayOf:run});assert.equal((await state(repeat)).cac_support_enabledabled,true);
const rollback=await fresh(19);await act(rollback,{type:'initialize'});const beforeRollback=await state(rollback);
await db.exec(`alter table playthroughs add constraint test_terminal_reject check(status<>'ended') not valid`);
await assert.rejects(()=>act(rollback,{type:'end'}),/test_terminal_reject/);assert.deepEqual(await state(rollback),beforeRollback);
await db.exec('alter table playthroughs drop constraint test_terminal_reject');
// Envelope validation happens before looking up even a foreign/nonexistent row.
for(const bad of [null,[],{}, {type:'end',balance:1},{type:'apply',jobId:null},{type:'initialize',replayOf:123},{type:'interview',choice:[]}]) {
 await assert.rejects(()=>db.query('select submit_employment_action($1,$2,0,$3)',[uuid(999),uuid(sequence++),bad]),/Invalid|Unexpected/);
}
const noDay=await fresh(21);await db.query('update playthroughs set current_day=null where playthrough_id=$1',[noDay]);
await assert.rejects(()=>act(noDay,{type:'initialize'},0),/fresh/);
const legacyVersion=await fresh(22);await db.query(`update playthroughs set employment_state=jsonb_set(employment_state,'{schemaVersion}','"1"') where playthrough_id=$1`,[legacyVersion]);
const legacyBefore=await state(legacyVersion);await assert.rejects(()=>act(legacyVersion,{type:'initialize'},0),/Unsupported/);assert.deepEqual(await state(legacyVersion),legacyBefore);
const corruptPrevious=await fresh(23);await db.query(`update playthroughs set employment_state=$1,current_day=null,status='completed',cac_support_enabledabled=false where playthrough_id=$2`,[completed.employment_state,corruptPrevious]);
const deniedReplay=await fresh(24);await assert.rejects(()=>act(deniedReplay,{type:'initialize',replayOf:corruptPrevious}),/eligible/);
await db.exec('set test.anonymous=false');const registered=await fresh(25);assert.equal((await state(registered)).employment_state,null);
await assert.rejects(()=>act(run,{type:'end'},0),/authentication/);await db.exec('set test.anonymous=true');
const wrongBalance=uuid(26);await db.query(`insert into playthroughs(playthrough_id,persona_id,version_id,owner_user_id,current_balance,current_day,status,started_at) values($1,$2,$3,$4,999,1,'active',now())`,[wrongBalance,persona,version,owner]);assert.equal((await state(wrongBalance)).employment_state,null);
const foreignInsert=uuid(27);await db.query(`insert into playthroughs(playthrough_id,persona_id,version_id,owner_user_id,current_balance,current_day,status,started_at) values($1,$2,$3,$4,100,1,'active',now())`,[foreignInsert,persona,version,uuid(99)]);assert.equal((await state(foreignInsert)).employment_state,null);
console.log('PASS: fresh/legacy compatibility, ownership/RLS, exact costs, retry receipts, stale requests, both hiring/payday routes, replay ownership/eligibility, insufficient funds and unknown documents');
await db.close();
