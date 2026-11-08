// Disposable PostgreSQL fixture only; never a hosted schema or production content.
// PGLITE_MODULE=/tmp/.../pglite/dist/index.js node supabase/tests/bills-foundation.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
if (!globalThis.__billsTestDb) process.on('uncaughtException', error => {
 console.error(error.message, error.detail || '', error.where || '', error.stack?.split('\n').slice(-3).join('\n') || '');
 process.exit(1);
});
const db = globalThis.__billsTestDb ?? new (await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')).PGlite();
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const owner = uuid(1), version = uuid(2), persona = uuid(3);
const migration = name => readFileSync(new URL(`../migrations/${name}.sql`, import.meta.url), 'utf8');
await db.exec(`
 create role anon; create role authenticated; create role service_role; create role leaked_default;
 alter default privileges grant execute on functions to leaked_default;
 create schema auth;
 grant usage on schema auth to authenticated;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('test.anonymous',true),''),'true')::boolean)$$;
 create table content_versions(version_id uuid primary key,status text,published_at timestamptz);
 create table personas(persona_id uuid primary key,version_id uuid references content_versions,
   general_starting_balance numeric,has_english_skills boolean,has_computer_skills boolean);
 create table jobs(job_id uuid primary key,version_id uuid,title text,is_active boolean,is_approved boolean,
   needs_english_skills boolean,needs_computer_skills boolean,weekly_gross_income numeric);
 create table scenarios(scenario_id uuid primary key,version_id uuid,persona_intent uuid,schedule_type text,default_day smallint);
 create table choices(choice_id uuid primary key,scenario_id uuid,version_id uuid,balance_change numeric,response_text text);
 create table cac_support_effects(choice_id uuid);
 create table player_responses(response_id uuid primary key,playthrough_id uuid,choice_id uuid,
   balance_change_applied numeric,balance_after numeric,answered_at timestamptz,version_id uuid);
 create table playthroughs(playthrough_id uuid primary key default gen_random_uuid(),persona_id uuid references personas,
   version_id uuid references content_versions,owner_user_id uuid,current_balance numeric,current_day smallint,status text,
   started_at timestamptz,session_id uuid,current_scenario_id uuid,current_job_id uuid,employment_state jsonb,cac_support_enabledabled boolean);
 create table persona_expenses(expense_id uuid primary key default gen_random_uuid(),
   persona_id uuid not null default gen_random_uuid() references personas,
   name text,amount numeric,first_due_day smallint,repeat_interval_days smallint,
   version_id uuid default gen_random_uuid() references content_versions);
 create table playthrough_expenses(playthrough_expense_id uuid primary key default gen_random_uuid(),
   playthrough_id uuid not null default gen_random_uuid() references playthroughs on delete cascade,
   expense_id uuid default gen_random_uuid(),due_day smallint,amount_due numeric,paid_at timestamptz,
   version_id uuid default gen_random_uuid() references content_versions);
 alter table playthroughs enable row level security;
 alter table persona_expenses enable row level security;
 alter table playthrough_expenses enable row level security;
 grant select,insert on playthroughs to authenticated;
 grant select on persona_expenses,playthrough_expenses,personas,content_versions to authenticated;
 create policy own_read on playthroughs for select to authenticated using(owner_user_id=auth.uid());
 create policy own_insert on playthroughs for insert to authenticated with check(
   owner_user_id=auth.uid() and current_day=1 and status='active' and employment_state is null
   and session_id is null and current_scenario_id is null and current_job_id is null
   and cac_support_enabledabled is null and current_balance=(select general_starting_balance from personas where persona_id=playthroughs.persona_id));
 create policy published on persona_expenses for select to authenticated using(version_id in (
   select version_id from content_versions where status='published' and published_at is not null));
 create policy own_expenses on playthrough_expenses for select to authenticated using(exists(
   select 1 from playthroughs p where p.playthrough_id=playthrough_expenses.playthrough_id and p.owner_user_id=auth.uid()));
 set test.uid='${owner}';
 insert into content_versions values('${version}','published',now());
 insert into personas values('${persona}','${version}',100,false,false);
`);
await db.exec(migration('20261027064542_create_anon_individual_playthrough_rpc'));
await db.exec('set cac.employment_security_reviewed=on');
await db.exec(migration('20261103000000_employment_gameplay'));
await db.exec(migration('20261107010000_scenario_decisions_and_scheduling'));
const start = async (p = persona) => (await db.query('select start_individual_playthrough($1) id', [p])).rows[0].id;
const state = async id => (await db.query('select * from playthroughs where playthrough_id=$1', [id])).rows[0];
const bills = async id => (await db.query('select * from playthrough_expenses where playthrough_id=$1 order by due_day,expense_id', [id])).rows;
const legacy = await start();
const legacyBefore = await state(legacy);
const gameplayDefinitions = async () => (await db.query(`select proname,pg_get_functiondef(oid) definition from pg_proc
 where pronamespace='public'::regnamespace and proname in ('submit_employment_action','submit_scenario_decision',
 'restore_scenario_decision','manage_scheduled_scenario_progression','mark_fresh_employment_run','start_individual_playthrough') order by proname`)).rows;
const gameplayBefore = await gameplayDefinitions();
const sql = migration('20261108010000_bill_schedule_foundation');
// A deployment into nonempty expense tables fails before altering their meaning.
await db.query('insert into persona_expenses(persona_id,version_id) values($1,$2)', [persona,version]);
await assert.rejects(() => db.exec(sql), /requires empty expense tables/);
await db.exec('rollback; delete from persona_expenses');
await db.exec(sql);
assert.deepEqual(await gameplayDefinitions(),gameplayBefore);
assert.deepEqual(await state(legacy), {...legacyBefore, expenses_initialized_at:null});
assert.deepEqual(await bills(legacy), []);
const empty = await start();
assert.ok((await state(empty)).expenses_initialized_at);
assert.equal((await state(empty)).employment_state.stage, 'uninitialized');
assert.deepEqual(await bills(empty), []);

const v = uuid(20), p = uuid(21), one = uuid(22), recurring = uuid(23), simultaneous = uuid(24);
await db.query(`insert into content_versions values($1,'draft',null);`, [v]);
await db.query('insert into personas values($1,$2,100,false,false)', [p,v]);
async function definition(id, name, amount, first, interval, fee, household=p, edition=v) {
 return db.query(`insert into persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,repeat_interval_days,late_fee_amount)
 values($1,$2,$3,$4,$5,$6,$7,$8)`, [id,household,edition,name,amount,first,interval,fee]);
}
await definition(one,'Fixture one-time','10.00',3,null,'2.00');
await definition(recurring,'Fixture recurring','20.00',2,7,'3.00');
await definition(simultaneous,'Fixture simultaneous','0.00',3,null,'0.00');
await definition(uuid(25),'Fixture outside month','1.00',31,null,'1.00');
await definition(uuid(26),'Fixture final day','1.00',30,null,'1.00');
await assert.rejects(() => definition(uuid(27),'Bad interval',1,1,0,1), /bill_schedule/);
await assert.rejects(() => definition(uuid(27),'Bad date',1,0,null,1), /bill_schedule/);
await assert.rejects(() => definition(uuid(27),'Bad precision','1.001',1,null,1), /bill_money/);
await assert.rejects(() => definition(uuid(27),'Bad fee',1,1,null,-1), /bill_money/);
await assert.rejects(() => definition(uuid(27),'Bad fee precision',1,1,null,'0.001'), /bill_money/);
await assert.rejects(() => definition(uuid(27),'Bad infinity','Infinity',1,null,1), /bill_money/);
await assert.rejects(() => definition(uuid(27),'Bad NaN','NaN',1,null,1), /bill_money/);
await assert.rejects(() => definition(uuid(27),'Wrong persona',1,1,null,1,persona), /persona edition mismatch/);
await assert.rejects(() => definition(uuid(27),'',1,1,null,1), /bill_name/);
await db.query("update content_versions set status='published',published_at=now() where version_id=$1", [v]);
await db.exec('set role authenticated');
const run = await start(p);
const rows = await bills(run);
assert.equal(rows.length,8);
assert.deepEqual(rows.filter(b => b.expense_id===recurring).map(b => b.due_day), [2,9,16,23,30]);
assert.deepEqual(rows.filter(b => b.expense_id===one).map(b => b.due_day), [3]);
assert.equal(rows.filter(b => b.due_day===3).length,2);
assert.equal(rows.filter(b => b.due_day===30).length,2);
assert.ok(rows.every(b => b.paid_at===null && b.ignored_at===null && b.paid_day===null && b.payment_balance_after===null));
assert.equal(Number((await state(run)).current_balance),100);
assert.equal(rows.find(b => b.expense_id===one).name_snapshot,'Fixture one-time');
assert.equal(Number(rows.find(b => b.expense_id===one).late_fee_amount),2);
await assert.rejects(() => db.query('update playthrough_expenses set paid_at=now() where playthrough_id=$1',[run]), /permission denied/);
await assert.rejects(() => definition(uuid(27),'Unauthorized',1,1,null,1), /permission denied/);
await db.exec(`set test.uid='${uuid(99)}'`);
assert.deepEqual(await bills(run), []);
assert.equal(await state(run),undefined);
await db.exec(`reset role;set test.uid='${owner}'`);
await assert.rejects(() => db.query('update persona_expenses set amount=11 where expense_id=$1',[one]), /immutable/);
await assert.rejects(() => db.query('delete from persona_expenses where expense_id=$1',[one]), /immutable/);
await assert.rejects(() => definition(uuid(27),'Late content',1,1,null,1), /draft edition/);
for (const assignment of ['amount_due=11',"name_snapshot='Changed'",'late_fee_amount=99','due_day=4',`expense_id='${simultaneous}'`]) {
 await assert.rejects(() => db.query(`update playthrough_expenses set ${assignment} where playthrough_expense_id=$1`,[rows[0].playthrough_expense_id]), /snapshots are immutable/);
}
await assert.rejects(() => db.query('update playthroughs set expenses_initialized_at=null where playthrough_id=$1',[run]), /identity is immutable/);
await assert.rejects(() => db.query('update playthroughs set expenses_initialized_at=now() where playthrough_id=$1',[legacy]), /only during run creation/);
await assert.rejects(() => db.query('update playthrough_expenses set paid_at=now() where playthrough_expense_id=$1',[rows[0].playthrough_expense_id]), /bill_payment/);
// Trusted test-only transitions exercise the immutable history guards; Stage 1
// deliberately exposes no participant operation that performs these updates.
await db.query('update playthrough_expenses set ignored_at=now() where playthrough_expense_id=$1',[rows[0].playthrough_expense_id]);
await assert.rejects(() => db.query('update playthrough_expenses set ignored_at=null where playthrough_expense_id=$1',[rows[0].playthrough_expense_id]), /Ignore history is immutable/);
await db.query('update playthrough_expenses set paid_at=clock_timestamp(),paid_day=2,payment_balance_after=77 where playthrough_expense_id=$1',[rows[0].playthrough_expense_id]);
await assert.rejects(() => db.query('update playthrough_expenses set payment_balance_after=78 where playthrough_expense_id=$1',[rows[0].playthrough_expense_id]), /payment history is immutable/);
// Composite FKs and occurrence uniqueness enforce relationships even for trusted writers.
const copy = rows[0];
const copySql = `insert into playthrough_expenses(playthrough_id,expense_id,version_id,due_day,amount_due,name_snapshot,late_fee_amount) values($1,$2,$3,$4,$5,$6,$7)`;
await assert.rejects(() => db.query(copySql,[run,copy.expense_id,v,copy.due_day,20,copy.name_snapshot,3]), /occurrence_key/);
await assert.rejects(() => db.query(copySql,[empty,copy.expense_id,v,2,20,copy.name_snapshot,3]), /run_edition_fk/);
await assert.rejects(() => db.query(copySql,[empty,copy.expense_id,version,2,20,copy.name_snapshot,3]), /definition_edition_fk/);
// No API roles or leaked default grants can call internal trigger functions.
for (const name of ['guard_bill_definition','guard_bill_occurrence_snapshot','guard_bill_run_marker','initialize_fresh_bill_schedule']) {
 const security = (await db.query(`select p.proowner=c.relowner correct_owner,
   has_function_privilege('authenticated',p.oid,'EXECUTE') auth,
   has_function_privilege('anon',p.oid,'EXECUTE') anon,
   has_function_privilege('leaked_default',p.oid,'EXECUTE') leaked
   from pg_proc p cross join pg_class c where p.oid=$1::regprocedure and c.oid='public.playthroughs'::regclass`,[`public.${name}()`])).rows[0];
 assert.deepEqual(security,{correct_owner:true,auth:false,anon:false,leaked:false});
}
// Both AFTER INSERT orderings work: employment sees its original insert tuple.
await db.exec('alter trigger initialize_fresh_bill_schedule on playthroughs rename to z_initialize_fresh_bill_schedule');
const reordered = await start(p);
assert.equal((await state(reordered)).employment_state.stage,'uninitialized');
assert.ok((await state(reordered)).expenses_initialized_at);
assert.equal((await bills(reordered)).length,8);
// A collision rolls back the run AND all generated rows/markers.
await db.query(`insert into scenarios values($1,$2,$3,'scheduled',9)`,[uuid(40),v,p]);
const beforeRuns = (await db.query('select count(*) n from playthroughs')).rows[0].n;
const beforeBills = (await db.query('select count(*) n from playthrough_expenses')).rows[0].n;
await assert.rejects(() => start(p), /schedule collision/);
assert.equal((await db.query('select count(*) n from playthroughs')).rows[0].n,beforeRuns);
assert.equal((await db.query('select count(*) n from playthrough_expenses')).rows[0].n,beforeBills);
// Invalid privileged/nonparticipant insert paths never gain a bills marker.
await db.exec('set test.anonymous=false');
const registered = await start();
assert.equal((await state(registered)).expenses_initialized_at,null);
await db.exec('set test.anonymous=true');
await assert.rejects(() => db.query(`insert into playthroughs(persona_id,version_id,owner_user_id,current_balance,current_day,status,started_at,expenses_initialized_at)
 values($1,$2,$3,100,1,'active',now(),now())`,[persona,version,owner]), /server controlled/);
// A later trigger failure must roll back successful occurrence initialization too.
await db.exec(`create function test_fail_insert() returns trigger language plpgsql as $$begin raise exception 'Injected failure';end$$;
 create trigger zz_test_fail after insert on playthroughs for each row execute function test_fail_insert();`);
await assert.rejects(() => start(), /Injected failure/);
assert.equal(Number((await db.query('select count(*) n from playthroughs')).rows[0].n),Number(beforeRuns)+1);
console.log('PASS: Stage 1 schedules, empty/legacy runs, Days 2/3, Day 30, snapshots, edition constraints, RLS/ACLs, trigger ordering and creation rollback');
await db.exec('drop trigger zz_test_fail on playthroughs');
await db.query('delete from scenarios where scenario_id=$1',[uuid(40)]);
await db.exec(migration('20261108020000_bill_gameplay'));
assert.deepEqual(await gameplayDefinitions(),gameplayBefore);
await db.exec(`grant select on player_responses to authenticated;
 alter table player_responses enable row level security;
 create policy own_responses on player_responses for select to authenticated using(exists(
   select 1 from playthroughs p where p.playthrough_id=player_responses.playthrough_id and p.owner_user_id=auth.uid()));`);
await db.query(`insert into jobs values($1,$2,'Fixture first',true,true,false,false,40),($3,$2,'Fixture second',true,true,false,false,40)`,[uuid(50),v,uuid(51)]);
let request=100;
async function act(id,action) {
 const r=await state(id);
 return (await db.query('select submit_employment_action($1,$2,$3,$4) result',[id,uuid(request++),r.employment_state.revision,action])).rows[0].result;
}
const pay=async(id,bill)=>(await db.query('select pay_bill($1,$2) result',[id,bill])).rows[0].result;
const ignore=async(id,bill)=>(await db.query('select ignore_bill($1,$2) result',[id,bill])).rows[0].result;
const game=await start(p);
const gameBills=await bills(game);
const recurringBill=gameBills.find(b=>b.due_day===2);
await assert.rejects(()=>pay(game,recurringBill.playthrough_expense_id),/unavailable/);
await act(game,{type:'initialize'});
await act(game,{type:'apply',jobId:uuid(50)});
await act(game,{type:'continue'});
await assert.rejects(()=>pay(game,recurringBill.playthrough_expense_id),/unavailable/);
await act(game,{type:'continue'}); // Day 2 interview
await assert.rejects(()=>ignore(game,recurringBill.playthrough_expense_id),/unavailable/);
await act(game,{type:'interview',choice:'current'});
await act(game,{type:'continue'}); // same-day reapply
assert.equal((await state(game)).current_day,2);
await act(game,{type:'apply',jobId:uuid(51)});
await act(game,{type:'continue'}); // same-day day stage, bills now available
await assert.rejects(()=>act(game,{type:'continue'}),/every due bill/);
const payResults=await Promise.all([pay(game,recurringBill.playthrough_expense_id),pay(game,recurringBill.playthrough_expense_id)]);
assert.equal(Number(payResults[0].run.current_balance),80);
assert.equal(Number(payResults[1].run.current_balance),80);
await ignore(game,recurringBill.playthrough_expense_id); // paid is terminal, no fee
assert.equal((await bills(game)).find(b=>b.due_day===2).ignored_at,null);
await act(game,{type:'continue'});
await act(game,{type:'interview',choice:'current'});
await act(game,{type:'continue'}); // Day 3 day stage
assert.equal((await state(game)).current_day,3);
const day3=(await bills(game)).filter(b=>b.due_day===3);
const deferred=day3.find(b=>Number(b.amount_due)===10);
const free=day3.find(b=>Number(b.amount_due)===0);
const ignored=await ignore(game,deferred.playthrough_expense_id);
const ignoredAgain=await ignore(game,deferred.playthrough_expense_id);
assert.equal(ignored.bill.ignored_at,ignoredAgain.bill.ignored_at);
assert.equal(Number((await state(game)).current_balance),80);
await assert.rejects(()=>act(game,{type:'continue'}),/every due bill/);
await pay(game,free.playthrough_expense_id);
await act(game,{type:'continue'});
await pay(game,deferred.playthrough_expense_id);
assert.equal(Number((await state(game)).current_balance),68);
// Inadequate cash leaves Ignore available, without an ending or deduction.
await db.query('update playthroughs set current_balance=0 where playthrough_id=$1',[game]);
while((await state(game)).current_day<9) await act(game,{type:'continue'});
const day9=(await bills(game)).find(b=>b.due_day===9);
await assert.rejects(()=>pay(game,day9.playthrough_expense_id),/Insufficient funds/);
assert.equal((await state(game)).status,'active');
await ignore(game,day9.playthrough_expense_id);
await act(game,{type:'continue'}); // Day 10 payday
assert.equal((await state(game)).employment_state.stage,'income');
assert.equal(Number((await state(game)).current_balance),40);
await assert.rejects(()=>pay(game,day9.playthrough_expense_id),/unavailable/);
await act(game,{type:'continue'});
await pay(game,day9.playthrough_expense_id);
assert.equal(Number((await state(game)).current_balance),17);
await db.exec('set role authenticated');
await pay(game,day9.playthrough_expense_id);
await db.exec(`set test.uid='${uuid(99)}'`);
await assert.rejects(()=>pay(game,day9.playthrough_expense_id),/unavailable/);
await assert.rejects(()=>ignore(game,day9.playthrough_expense_id),/unavailable/);
await db.exec(`reset role;set test.uid='${owner}'`);
await db.exec('set test.anonymous=false');
await assert.rejects(()=>pay(game,day9.playthrough_expense_id),/Anonymous/);
await db.exec('set test.anonymous=true');
// Collision protection includes edits introduced after schedules were initialized.
await assert.rejects(()=>db.query(`insert into scenarios values($1,$2,$3,'scheduled',16)`,[uuid(60),v,p]),/schedule collision/);
while((await state(game)).employment_state.stage!=='complete') {
 const r=await state(game);
 if(r.employment_state.stage==='day') {
   for(const b of await bills(game)) if(b.due_day<=r.current_day && !b.paid_at && !b.ignored_at) {
     if(r.current_day===30) await assert.rejects(()=>act(game,{type:'continue'}),/every due bill/);
     await ignore(game,b.playthrough_expense_id);
   }
 }
 await act(game,{type:'continue'});
}
assert.equal((await state(game)).status,'completed');
await assert.rejects(async()=>pay(game,(await bills(game)).find(b=>b.due_day===16).playthrough_expense_id),/unavailable/);
await ignore(game,deferred.playthrough_expense_id); // immutable historical retry after completion
console.log('PASS: Stage 2 Pay/Ignore, affordability, queued duplicate retries, employment Day 2/3 sequence, payday order, guard coverage, collision denial and Day 30 debt');
await db.exec(migration('20261108030000_bill_financial_snapshot'));
await db.exec('set role authenticated');
const snapshot=(await db.query('select get_bill_snapshot($1) result',[game])).rows[0].result;
assert.equal(Number(snapshot.paid_total),55); // 20 + 0 + 12 + 23
assert.equal(Number(snapshot.overdue_total),71); // 3 × (20 + 3), plus 1 + 1
assert.equal(Number(snapshot.outstanding_total),71);
assert.equal(Number(snapshot.upcoming_total),0);
assert.equal(Number(snapshot.run.current_balance),97); // three wages, less the Day 9 settlement, after injected zero cash
assert.equal(snapshot.bills.length,8);
await db.exec(`set test.uid='${uuid(99)}'`);
assert.equal((await db.query('select get_bill_snapshot($1) result',[game])).rows[0].result,null);
await db.exec(`reset role;set test.uid='${owner}'`);
assert.deepEqual(await gameplayDefinitions(),gameplayBefore);
console.log('PASS: Stage 3 consistent completed-run snapshot, paid/outstanding totals, owner denial and unchanged scenario/employment functions');
// The Day 2 hiring branch returns to day before bills, and pays on 9/16/23/30.
const firstHire=await start(p);
await act(firstHire,{type:'initialize',replayOf:game});
await act(firstHire,{type:'prepare'});
await act(firstHire,{type:'continue'});
await act(firstHire,{type:'apply',jobId:uuid(50)});
await act(firstHire,{type:'continue'});
await act(firstHire,{type:'continue'});
await act(firstHire,{type:'interview',choice:'cac'});
await act(firstHire,{type:'continue'});
assert.equal((await state(firstHire)).current_day,2);
assert.equal((await state(firstHire)).employment_state.hiredDay,2);
const firstBill=(await bills(firstHire)).find(b=>b.due_day===2);
// A failure after the payment-row update must roll back the payment AND cash.
await db.exec(`create function test_reject_cash() returns trigger language plpgsql as $$begin
 if new.current_balance<old.current_balance then raise exception 'Injected payment failure';end if;return new;end$$;
 create trigger zz_test_reject_cash before update on playthroughs for each row execute function test_reject_cash();`);
await assert.rejects(()=>pay(firstHire,firstBill.playthrough_expense_id),/Injected payment failure/);
assert.equal((await bills(firstHire)).find(b=>b.due_day===2).paid_at,null);
assert.equal(Number((await state(firstHire)).current_balance),100);
await db.exec('drop trigger zz_test_reject_cash on playthroughs');
await pay(firstHire,firstBill.playthrough_expense_id);
await act(firstHire,{type:'continue'});
assert.equal((await state(firstHire)).employment_state.stage,'day');
for(const b of await bills(firstHire)) if(b.due_day===3) await pay(firstHire,b.playthrough_expense_id);
while((await state(firstHire)).employment_state.stage!=='complete') {
 const r=await state(firstHire);
 if(r.employment_state.stage==='income') {
   assert.equal(Number(r.current_balance),70+40*r.employment_state.creditedDays.length);
   const due=(await bills(firstHire)).find(b=>b.due_day===r.current_day);
   if(due) await assert.rejects(()=>pay(firstHire,due.playthrough_expense_id),/unavailable/);
 }
 if(r.employment_state.stage==='day') for(const b of await bills(firstHire)) {
   if(b.due_day<=r.current_day && !b.paid_at && !b.ignored_at) await ignore(firstHire,b.playthrough_expense_id);
 }
 await act(firstHire,{type:'continue'});
}
assert.deepEqual((await state(firstHire)).employment_state.creditedDays,[9,16,23,30]);
// Snapshot succeeds inside a READ ONLY transaction and preserves final state.
await db.exec('begin read only');
const finalSnapshot=(await db.query('select get_bill_snapshot($1) result',[firstHire])).rows[0].result;
await db.exec('rollback');
assert.equal(Number(finalSnapshot.paid_total),30);
assert.equal(Number(finalSnapshot.overdue_total),94);
assert.equal(Number(finalSnapshot.run.current_balance),230);
for(const signature of ['pay_bill(uuid,uuid)','ignore_bill(uuid,uuid)','get_bill_snapshot(uuid)']) {
 const access=(await db.query(`select has_function_privilege('authenticated',$1,'EXECUTE') allowed,
 has_function_privilege('anon',$1,'EXECUTE') anonymous,
 has_function_privilege('leaked_default',$1,'EXECUTE') leaked`,[`public.${signature}`])).rows[0];
 assert.deepEqual(access,{allowed:true,anonymous:false,leaked:false});
}
console.log('PASS: Day 2 hiring with Day 2/3 bills, wages before bill controls, atomic payment rollback, read-only final snapshot and RPC ACLs');
await db.close();
