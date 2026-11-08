// Standalone disposable PostgreSQL cluster; never accepts a hosted connection URL.
// BILLS_TEST_MODULE_ROOT=/tmp/test-dependencies/node_modules node supabase/tests/bills-postgres.test.mjs
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { appendFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.env.BILLS_TEST_MODULE_ROOT;
if(!root) throw new Error('Set BILLS_TEST_MODULE_ROOT to externally installed embedded-postgres and pg modules');
const {default:EmbeddedPostgres}=await import(pathToFileURL(join(root,'embedded-postgres/dist/index.js')));
const {default:pg}=await import(pathToFileURL(join(root,'pg/lib/index.js')));
const directory=await mkdtemp(join(tmpdir(),'team6310-bills-pg-'));
const server=new EmbeddedPostgres({databaseDir:directory,user:'postgres',password:'local-test-only',port:55439,
  persistent:true,autoRehydrateSymlinks:true,postgresFlags:['-h','127.0.0.1','-k',directory],
  onLog:message=>appendFileSync(join(directory,'server.log'),String(message)),onError:console.error});
const connections=[];
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let serial=10000;
async function connection(name) {
 const client=new pg.Client({host:'127.0.0.1',port:55439,user:'postgres',password:'local-test-only',database:'team6310_bills_test',application_name:name});
 await client.connect();connections.push(client);
 await client.query(`set test.uid='${uuid(1)}';set test.anonymous=true;set statement_timeout='15s'`);
 return client;
}
try {
 await server.initialise();await server.start();await server.createDatabase('team6310_bills_test');
 const db=await connection('bills-controller');
 globalThis.__billsTestDb={query:(...args)=>db.query(...args),exec:sql=>db.query(sql),close:async()=>{}};
 await import('./bills-foundation.test.mjs');
 delete globalThis.__billsTestDb;
 const state=async id=>(await db.query('select * from playthroughs where playthrough_id=$1',[id])).rows[0];
 const act=async(id,action)=>{
   const row=await state(id);
   return db.query('select submit_employment_action($1,$2,$3,$4)',[id,uuid(serial++),row.employment_state.revision,action]);
 };
 const prior=(await db.query("select playthrough_id from playthroughs where status='completed' and cac_support_enabledabled=false limit 1")).rows[0].playthrough_id;
 async function readyForPayday() {
   const id=(await db.query('select start_individual_playthrough($1) id',[uuid(21)])).rows[0].id;
   await act(id,{type:'initialize',replayOf:prior});await act(id,{type:'prepare'});await act(id,{type:'continue'});
   await act(id,{type:'apply',jobId:uuid(50)});await act(id,{type:'continue'});await act(id,{type:'continue'});
   await act(id,{type:'interview',choice:'cac'});await act(id,{type:'continue'});
   const bills=(await db.query('select * from playthrough_expenses where playthrough_id=$1 order by due_day',[id])).rows;
   for(const b of bills.filter(b=>b.due_day===2)) await db.query('select ignore_bill($1,$2)',[id,b.playthrough_expense_id]);
   await act(id,{type:'continue'});
   for(const b of bills.filter(b=>b.due_day===3)) await db.query('select ignore_bill($1,$2)',[id,b.playthrough_expense_id]);
   while((await state(id)).current_day<8) await act(id,{type:'continue'});
   return {id,bill:bills.find(b=>b.due_day===2).playthrough_expense_id};
 }
 const a=await connection('bills-race-a'),b=await connection('bills-race-b'),blocker=await connection('bills-lock-holder');
 // Exercise actual API roles on separate PostgreSQL sessions.
 await a.query('set role authenticated');await b.query('set role authenticated');
 const pidA=(await a.query('select pg_backend_pid() pid')).rows[0].pid;
 const pidB=(await b.query('select pg_backend_pid() pid')).rows[0].pid;
 async function waitForLock(pid) {
   const deadline=Date.now()+5000;
   while(Date.now()<deadline) {
     const r=(await db.query("select wait_event_type='Lock' waiting from pg_stat_activity where pid=$1",[pid])).rows[0];
     if(r?.waiting) return;
     await new Promise(resolve=>setTimeout(resolve,20));
   }
   throw new Error('Expected a real blocked PostgreSQL row lock');
 }
 async function lock(id) {await blocker.query('begin');await blocker.query('select 1 from playthroughs where playthrough_id=$1 for update',[id]);}
 const execute=(client,sql,args)=>client.query(sql,args).then(value=>({value}),error=>({error}));
 const paySql='select pay_bill($1,$2) result';
 // Two genuinely overlapping payments of one bill deduct exactly once.
 const duplicate=await readyForPayday();await lock(duplicate.id);
 const first=execute(a,paySql,[duplicate.id,duplicate.bill]);await waitForLock(pidA);
 const second=execute(b,paySql,[duplicate.id,duplicate.bill]);await waitForLock(pidB);
 await blocker.query('commit');
 const paid=await Promise.all([first,second]);assert.ok(paid.every(r=>!r.error));
 assert.equal(Number((await state(duplicate.id)).current_balance),77);
 assert.equal(paid[0].value.rows[0].result.bill.paid_at,paid[1].value.rows[0].result.bill.paid_at);
 // Force each payment/payday lock ordering, rather than relying on timing luck.
 for(const paydayFirst of [false,true]) {
   const game=await readyForPayday();const before=await state(game.id);await lock(game.id);
   const wageArgs=[game.id,uuid(serial++),before.employment_state.revision,{type:'continue'}];
   const wageSql='select submit_employment_action($1,$2,$3,$4) result';
   const first=paydayFirst?execute(b,wageSql,wageArgs):execute(a,paySql,[game.id,game.bill]);
   await waitForLock(paydayFirst?pidB:pidA);
   const second=paydayFirst?execute(a,paySql,[game.id,game.bill]):execute(b,wageSql,wageArgs);
   await waitForLock(paydayFirst?pidA:pidB);await blocker.query('commit');
   const results=await Promise.all([first,second]);assert.equal(results[0].error,undefined);
   const wage=await state(game.id);assert.equal(wage.current_day,9);assert.deepEqual(wage.employment_state.creditedDays,[9]);
   if(paydayFirst) {
     assert.match(results[1].error?.message??'',/payment unavailable/);
     assert.equal(Number(wage.current_balance),140);
     await act(game.id,{type:'continue'});await a.query(paySql,[game.id,game.bill]);
   } else assert.equal(results[1].error,undefined);
   assert.equal(Number((await state(game.id)).current_balance),117);
 }
 // Ignore/Pay on an unresolved due bill serialize without a second fee.
 const race=await readyForPayday();await act(race.id,{type:'continue'});await act(race.id,{type:'continue'});
 const due=(await db.query('select playthrough_expense_id id from playthrough_expenses where playthrough_id=$1 and due_day=9',[race.id])).rows[0].id;
 await lock(race.id);
 const ignored=execute(a,'select ignore_bill($1,$2) result',[race.id,due]);await waitForLock(pidA);
 const settled=execute(b,paySql,[race.id,due]);await waitForLock(pidB);await blocker.query('commit');
 const both=await Promise.all([ignored,settled]);assert.ok(both.every(r=>!r.error));
 assert.equal(Number((await state(race.id)).current_balance),117);
 assert.ok(both[1].value.rows[0].result.bill.ignored_at);
 // Different simultaneous bills contend for the same cash, not separate purses.
 const fundsVersion=uuid(700),fundsPersona=uuid(701);
 await db.query("insert into content_versions values($1,'draft',null)",[fundsVersion]);
 await db.query('insert into personas values($1,$2,100,false,false)',[fundsPersona,fundsVersion]);
 await db.query(`insert into persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,late_fee_amount)
 values($1,$3,$4,'Fixture A',75,1,5),($2,$3,$4,'Fixture B',75,1,5)`,[uuid(702),uuid(703),fundsPersona,fundsVersion]);
 await db.query("update content_versions set status='published',published_at=now() where version_id=$1",[fundsVersion]);
 await db.query(`insert into jobs values($1,$3,'Fixture A',true,true,false,false,40),($2,$3,'Fixture B',true,true,false,false,40)`,[uuid(704),uuid(705),fundsVersion]);
 const funds=(await db.query('select start_individual_playthrough($1) id',[fundsPersona])).rows[0].id;
 await act(funds,{type:'initialize'});await act(funds,{type:'apply',jobId:uuid(704)});await act(funds,{type:'continue'});
 const dueBills=(await db.query('select playthrough_expense_id id from playthrough_expenses where playthrough_id=$1 order by expense_id',[funds])).rows;
 await lock(funds);
 const costA=execute(a,paySql,[funds,dueBills[0].id]);await waitForLock(pidA);
 const costB=execute(b,paySql,[funds,dueBills[1].id]);await waitForLock(pidB);await blocker.query('commit');
 const costs=await Promise.all([costA,costB]);
 assert.equal(costs[0].error,undefined);assert.match(costs[1].error?.message??'',/Insufficient funds/);
 assert.equal(Number((await state(funds)).current_balance),25);assert.equal((await state(funds)).status,'active');
 await b.query('select ignore_bill($1,$2)',[funds,dueBills[1].id]);
 console.log('PASS: real PostgreSQL overlapping duplicate payments, both payment/payday lock orders, Ignore/Pay race, exact balances and one wage credit');
 console.log(`Disposable fixture directory: ${directory}`);
} catch(error) {
 console.error(error?.message??'PostgreSQL startup failed',error?.detail??'');
 if(!connections.length) console.error(readFileSync(join(directory,'server.log'),'utf8').slice(-2000));
 process.exitCode=1;
} finally {
 await Promise.allSettled(connections.map(c=>c.end()));
 // embedded-postgres waits for an exit event even if startup already exited.
 if(server.process?.exitCode===null) await server.stop();
 else server.process=undefined;
}
