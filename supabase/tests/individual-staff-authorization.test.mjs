// Disposable real PostgreSQL only. Auth claims are simulated SQL settings, NOT Supabase API tests.
// STAFF_TEST_MODULE_ROOT=/tmp/team6310-staff-db-tests/node_modules node supabase/tests/individual-staff-authorization.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const root = process.env.STAFF_TEST_MODULE_ROOT;
if (!root)
  throw Error(
    "Set STAFF_TEST_MODULE_ROOT to external pg and embedded-postgres modules",
  );
const { default: EmbeddedPostgres } = await import(
  pathToFileURL(join(root, "embedded-postgres/dist/index.js"))
);
const { default: pg } = await import(
  pathToFileURL(join(root, "pg/lib/index.js"))
);
const baseline = JSON.parse(
  readFileSync(
    new URL("./fixtures/staff-authorization-baseline.json", import.meta.url),
  ),
);
const migration = readFileSync(
  new URL(
    "../migrations/20261113204615_staff_individual_authorization.sql",
    import.meta.url,
  ),
  "utf8",
);
const directory = await mkdtemp(join(tmpdir(), "team6310-staff-pg-"));
const server = new EmbeddedPostgres({
  onLog: () => {},
  onError: () => {},
  databaseDir: directory,
  user: "postgres",
  password: "local-test-only",
  port: 55441,
  persistent: false,
  postgresFlags: ["-h", "127.0.0.1", "-k", directory],
});
const clients = [];
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let serial = 1000;
let staffRun;
async function connection() {
  const c = new pg.Client({
    host: "127.0.0.1",
    port: 55441,
    user: "postgres",
    password: "local-test-only",
    database: "staff_test",
  });
  await c.connect();
  clients.push(c);
  return c;
}
try {
  await server.initialise();
  await server.start();
  await server.createDatabase("staff_test");
  const db = await connection();
  await db.query(`
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE leaked_default;
 ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO leaked_default;
 CREATE SCHEMA auth; CREATE SCHEMA group_private;
 GRANT USAGE ON SCHEMA auth TO authenticated;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('test.anonymous',true),''),'false')::boolean)$$;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean);
 CREATE TABLE cac_staff(user_id uuid PRIMARY KEY REFERENCES auth.users,active boolean);
 ALTER TABLE cac_staff ENABLE ROW LEVEL SECURITY; REVOKE ALL ON cac_staff FROM PUBLIC,anon,authenticated;
 CREATE TABLE content_versions(version_id uuid PRIMARY KEY,status text,published_at timestamptz);
 CREATE TABLE personas(persona_id uuid PRIMARY KEY,version_id uuid,general_starting_balance numeric,has_english_skills boolean,has_computer_skills boolean);
 CREATE TABLE jobs(job_id uuid PRIMARY KEY,version_id uuid,title text,is_active boolean,is_approved boolean,needs_english_skills boolean,needs_computer_skills boolean,weekly_gross_income numeric);
 CREATE TABLE playthroughs(playthrough_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),persona_id uuid,version_id uuid,owner_user_id uuid REFERENCES auth.users ON DELETE SET NULL,current_balance numeric,current_day smallint,status text,started_at timestamptz,session_id uuid,current_scenario_id uuid,current_job_id uuid,employment_state jsonb,cac_support_enabledabled boolean);
 CREATE TABLE scenarios(scenario_id uuid PRIMARY KEY,version_id uuid,persona_intent uuid,schedule_type text,default_day smallint,title text);
 CREATE TABLE choices(choice_id uuid PRIMARY KEY,scenario_id uuid,version_id uuid,balance_change numeric,response_text text,requires_cac boolean DEFAULT false,upfront_cost numeric DEFAULT 0);
 CREATE TABLE cac_support_effects(choice_id uuid);
 CREATE TABLE player_responses(response_id uuid PRIMARY KEY,playthrough_id uuid,choice_id uuid,balance_change_applied numeric,balance_after numeric,answered_at timestamptz,version_id uuid);
 CREATE TABLE persona_expenses(expense_id uuid PRIMARY KEY,persona_id uuid,version_id uuid,name text,amount numeric,first_due_day smallint,repeat_interval_days smallint,late_fee_amount numeric);
 CREATE TABLE playthrough_expenses(playthrough_expense_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),playthrough_id uuid,expense_id uuid,version_id uuid,name_snapshot text,due_day smallint,amount_due numeric,late_fee_amount numeric,ignored_at timestamptz,paid_at timestamptz,paid_day smallint,payment_balance_after numeric);
 CREATE TABLE scenario_library_metadata(scenario_id uuid,version_id uuid,library_key text,engine text,requires_employment boolean,enabled boolean);
 CREATE TABLE scenario_fact_copy(scenario_id uuid,version_id uuid,fact_role text,semantic_key text,display_text text,source_url text,copy_kind text,verified boolean);
 CREATE TABLE scenario_bill_links(scenario_id uuid,version_id uuid,expense_id uuid);
 CREATE TABLE group_sessions(session_id uuid); CREATE TABLE group_participants(session_id uuid,user_id uuid);
 ALTER TABLE playthroughs ENABLE ROW LEVEL SECURITY;
 ALTER TABLE player_responses ENABLE ROW LEVEL SECURITY;
 ALTER TABLE playthrough_expenses ENABLE ROW LEVEL SECURITY;
 GRANT SELECT,INSERT ON playthroughs TO authenticated;
 GRANT SELECT ON player_responses,playthrough_expenses,personas,jobs,content_versions,scenarios,choices TO authenticated;
 SET check_function_bodies=off;
 `);
  for (const f of baseline.functions) await db.query(f.ddl);
  for (const p of baseline.policies)
    await db.query(
      `CREATE POLICY ${p.policyname} ON public.${p.tablename} FOR ${p.cmd} TO authenticated ${p.qual ? `USING (${p.qual})` : ""} ${p.with_check ? `WITH CHECK (${p.with_check})` : ""}`,
    );
  for (const name of [
    "initialize_fresh_bill_schedule",
    "mark_fresh_employment_run",
  ])
    await db.query(
      `CREATE TRIGGER ${name} AFTER INSERT ON playthroughs FOR EACH ROW EXECUTE FUNCTION ${name}()`,
    );
  await db.query(
    "CREATE TRIGGER playthroughs_manage_scheduled_scenario_progression BEFORE UPDATE ON playthroughs FOR EACH ROW EXECUTE FUNCTION manage_scheduled_scenario_progression(); CREATE TRIGGER z_bill_advancement BEFORE UPDATE ON playthroughs FOR EACH ROW EXECUTE FUNCTION guard_bill_advancement()",
  );
  // Fixture ACLs reflect existing API boundaries; migration must preserve these.
  for (const f of baseline.functions)
    if (!f.ddl.includes("RETURNS trigger"))
      await db.query(
        `REVOKE ALL ON FUNCTION ${f.ddl.match(/FUNCTION ([^(]+\([^\n]*\))/)[1]} FROM PUBLIC,anon,leaked_default`,
      );
  await db.query(
    `GRANT EXECUTE ON FUNCTION is_cac_staff(),start_individual_playthrough(uuid),submit_employment_action(uuid,uuid,integer,jsonb),submit_scenario_decision(uuid,uuid,uuid),restore_scenario_decision(uuid,uuid),pay_bill(uuid,uuid),ignore_bill(uuid,uuid),get_bill_snapshot(uuid),get_scenario_recap_facts(uuid,uuid),get_event_recap_facts(uuid,text) TO authenticated`,
  );
  const defs = async () =>
    (
      await db.query(
        "SELECT n.nspname,p.proname,p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) ddl,p.proowner,p.proacl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','group_private') ORDER BY 1,2",
      )
    ).rows;
  const before = await defs();
  // Drift must abort atomically. Restore original reviewed definition before actual application.
  const original = baseline.functions.find(
    (f) => f.name === "start_individual_playthrough",
  ).ddl;
  await db.query(
    original.replace("Sign in anonymously first", "Unexpected drift"),
  );
  await assert.rejects(db.query(migration), /Definition drift/);
  await db.query("ROLLBACK");
  await db.query(original);
  await db.query(migration);
  const after = await defs();
  for (const old of before) {
    const next = after.find((x) => x.signature === old.signature);
    assert.equal(next.proowner, old.proowner);
    assert.deepEqual(next.proacl, old.proacl);
    if (
      old.nspname === "group_private" ||
      [
        "valid_employment_document",
        "manage_scheduled_scenario_progression",
        "guard_bill_advancement",
        "is_cac_staff",
      ].includes(old.proname)
    )
      assert.equal(next.ddl, old.ddl);
    else
      assert.equal(
        next.ddl,
        old.proname === "start_individual_playthrough"
          ? old.ddl.replace(
              "IF auth.uid() IS NULL THEN",
              "IF public.is_individual_player() IS NOT TRUE THEN",
            )
          : old.ddl.replace(
              /coalesce\(\(auth.jwt\(\)->>'is_anonymous'\)::boolean,\s*false\)/gi,
              "public.is_individual_player()",
            ),
      );
  }
  assert.deepEqual(
    (
      await db.query(
        "SELECT has_function_privilege('leaked_default','is_individual_player()','EXECUTE') leaked,has_function_privilege('anon','is_individual_player()','EXECUTE') anon",
      )
    ).rows[0],
    { leaked: false, anon: false },
  );
  for (const [id, anonymous] of [
    [1, true],
    [2, false],
    [3, false],
    [4, false],
  ])
    await db.query("INSERT INTO auth.users VALUES($1,$2)", [
      uuid(id),
      anonymous,
    ]);
  await db.query("INSERT INTO cac_staff VALUES($1,true),($2,true)", [
    uuid(2),
    uuid(4),
  ]);
  await db.query(`INSERT INTO content_versions VALUES($1,'published',now());`, [
    uuid(10),
  ]);
  await db.query("INSERT INTO personas VALUES($1,$2,100,false,false)", [
    uuid(11),
    uuid(10),
  ]);
  for (const n of [12, 13])
    await db.query(
      "INSERT INTO jobs VALUES($1,$2,'Fixture job',true,true,false,false,40)",
      [uuid(n), uuid(10)],
    );
  await db.query(
    "INSERT INTO persona_expenses VALUES($1,$2,$3,'Fixture bill',10,1,null,2)",
    [uuid(14), uuid(11), uuid(10)],
  );
  const actor = async (c, id, anonymous) => {
    await c.query("RESET ROLE");
    await c.query(
      "SELECT set_config('test.uid',$1,false),set_config('test.anonymous',$2,false)",
      [id ? uuid(id) : "", String(anonymous)],
    );
    await c.query("SET ROLE authenticated");
  };
  const start = async () =>
    (await db.query("SELECT start_individual_playthrough($1) id", [uuid(11)]))
      .rows[0].id;
  const run = async (id) =>
    (await db.query("SELECT * FROM playthroughs WHERE playthrough_id=$1", [id]))
      .rows[0];
  const action = async (id, type, extra = {}) => {
    const r = await run(id);
    return (
      await db.query("SELECT submit_employment_action($1,$2,$3,$4) value", [
        id,
        uuid(serial++),
        r.employment_state.revision,
        { type, ...extra },
      ])
    ).rows[0].value;
  };
  const rejectOperations = async (id) => {
    assert.equal(await run(id), undefined);
    assert.equal(
      (
        await db.query(
          "SELECT * FROM playthrough_expenses WHERE playthrough_id=$1",
          [id],
        )
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await db.query(
          "SELECT * FROM player_responses WHERE playthrough_id=$1",
          [id],
        )
      ).rowCount,
      0,
    );
    for (const [sql, args] of [
      [
        'SELECT submit_employment_action($1,$2,0,\'{"type":"end"}\')',
        [id, uuid(serial++)],
      ],
      ["SELECT pay_bill($1,$2)", [id, uuid(14)]],
      ["SELECT ignore_bill($1,$2)", [id, uuid(14)]],
      ["SELECT submit_scenario_decision($1,$2,$3)", [id, uuid(20), uuid(21)]],
    ])
      await assert.rejects(db.query(sql, args));
    for (const sql of [
      "SELECT get_bill_snapshot($1) value",
      "SELECT restore_scenario_decision($1,$2) value",
    ])
      assert.equal(
        (await db.query(sql, sql.includes("$2") ? [id, uuid(20)] : [id]))
          .rows[0].value,
        null,
      );
    for (const sql of [
      "SELECT * FROM get_scenario_recap_facts($1,$2)",
      "SELECT * FROM get_event_recap_facts($1,$2)",
    ])
      assert.equal(
        (await db.query(sql, [id, sql.includes("event") ? "D001" : uuid(20)]))
          .rowCount,
        0,
      );
  };
  for (const [id, anonymous] of [
    [1, true],
    [2, false],
  ]) {
    await actor(db, id, anonymous);
    assert.equal(
      (await db.query("SELECT is_individual_player() ok")).rows[0].ok,
      true,
    );
    const fresh = await start();
    assert.equal((await run(fresh)).employment_state.stage, "uninitialized");
    const request = uuid(serial++);
    const endSql =
      'SELECT submit_employment_action($1,$2,0,\'{"type":"end"}\') result';
    const ended = await db.query(endSql, [fresh, request]);
    assert.deepEqual(
      (await db.query(endSql, [fresh, request])).rows,
      ended.rows,
    );
    await assert.rejects(
      db.query(
        'SELECT submit_employment_action($1,$2,1,\'{"type":"continue"}\')',
        [fresh, uuid(serial++)],
      ),
    );
    const game = await start();
    await action(game, "initialize");
    await action(game, "apply", { jobId: uuid(12) });
    await action(game, "continue");
    const bill = (
      await db.query(
        "SELECT * FROM playthrough_expenses WHERE playthrough_id=$1",
        [game],
      )
    ).rows[0];
    await db.query("SELECT ignore_bill($1,$2)", [
      game,
      bill.playthrough_expense_id,
    ]);
    await db.query("SELECT ignore_bill($1,$2)", [
      game,
      bill.playthrough_expense_id,
    ]);
    await db.query("SELECT pay_bill($1,$2)", [
      game,
      bill.playthrough_expense_id,
    ]);
    await db.query("SELECT pay_bill($1,$2)", [
      game,
      bill.playthrough_expense_id,
    ]);
    assert.equal(Number((await run(game)).current_balance), 88);
    await action(game, "continue");
    await action(game, "interview", { choice: "current" });
    await action(game, "continue");
    await action(game, "apply", { jobId: uuid(13) });
    await action(game, "continue");
    await action(game, "continue");
    await action(game, "interview", { choice: "current" });
    await action(game, "continue");
    await action(game, "continue"); // Day 4: ordinary and employment events stay separate.
    // Exercise ordinary commitment, restoration and recap under each eligible identity.
    await db.query("RESET ROLE");
    const scenario = uuid(serial++),
      choice = uuid(serial++);
    await db.query(
      "INSERT INTO scenarios VALUES($1,$2,null,'non-scheduled',null,'Fixture decision')",
      [scenario, uuid(10)],
    );
    await db.query(
      "INSERT INTO choices VALUES($1,$2,$3,-5,'Fixture outcome',false,0)",
      [choice, scenario, uuid(10)],
    );
    await db.query(
      "INSERT INTO scenario_fact_copy VALUES($1,$2,'general','fixture','Fixture fact','https://example.org','fact',true)",
      [scenario, uuid(10)],
    );
    await db.query(
      "UPDATE playthroughs SET current_scenario_id=$1 WHERE playthrough_id=$2",
      [scenario, game],
    );
    await actor(db, id, anonymous);
    const decision = (
      await db.query("SELECT submit_scenario_decision($1,$2,$3) value", [
        game,
        scenario,
        choice,
      ])
    ).rows[0].value;
    assert.deepEqual(
      (
        await db.query("SELECT submit_scenario_decision($1,$2,$3) value", [
          game,
          scenario,
          choice,
        ])
      ).rows[0].value,
      decision,
    );
    assert.equal(
      (
        await db.query("SELECT restore_scenario_decision($1,$2) value", [
          game,
          scenario,
        ])
      ).rows[0].value.response_count,
      1,
    );
    assert.equal(
      (
        await db.query("SELECT * FROM get_event_recap_facts($1,$2)", [
          game,
          scenario,
        ])
      ).rowCount,
      1,
    );
    while ((await run(game)).status === "active")
      await action(game, "continue");
    assert.equal((await run(game)).current_day, 30);
    assert.equal(Number((await run(game)).current_balance), 203);
    const replay = await start();
    await action(replay, "initialize", { replayOf: game });
    assert.equal((await run(replay)).cac_support_enabledabled, true);
    await actor(db, id === 1 ? 2 : 4, false);
    await rejectOperations(game);
    await actor(db, id, anonymous);
    if (!anonymous) {
      staffRun = game;
      await db.query("RESET ROLE");
      await db.query("UPDATE cac_staff SET active=false WHERE user_id=$1", [
        uuid(id),
      ]);
      await actor(db, id, false);
      await rejectOperations(game);
      await assert.rejects(start());
    }
  }
  // Real overlapping payments and revision races on distinct PostgreSQL connections.
  await actor(db, 4, false);
  const concurrent = await start();
  await action(concurrent, "initialize");
  await action(concurrent, "apply", { jobId: uuid(12) });
  await action(concurrent, "continue");
  const bill = (
    await db.query(
      "SELECT * FROM playthrough_expenses WHERE playthrough_id=$1",
      [concurrent],
    )
  ).rows[0];
  const a = await connection(),
    b = await connection();
  await actor(a, 4, false);
  await actor(b, 4, false);
  await db.query("RESET ROLE");
  await db.query("BEGIN");
  await db.query(
    "SELECT 1 FROM playthroughs WHERE playthrough_id=$1 FOR UPDATE",
    [concurrent],
  );
  const pa = a.query("SELECT pay_bill($1,$2)", [
    concurrent,
    bill.playthrough_expense_id,
  ]);
  const pb = b.query("SELECT pay_bill($1,$2)", [
    concurrent,
    bill.playthrough_expense_id,
  ]);
  let waiting = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    const r = await db.query(
      "SELECT count(*)::int n FROM pg_stat_activity WHERE pid=ANY($1::int[]) AND wait_event_type='Lock'",
      [[a.processID, b.processID]],
    );
    if (r.rows[0].n === 2) {
      waiting = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  await db.query("COMMIT");
  await Promise.all([pa, pb]);
  assert.equal(waiting, true);
  await actor(db, 4, false);
  assert.equal(Number((await run(concurrent)).current_balance), 90);
  const revision = (await run(concurrent)).employment_state.revision;
  const races = await Promise.allSettled(
    [a, b].map((c) =>
      c.query("SELECT submit_employment_action($1,$2,$3,$4)", [
        concurrent,
        uuid(serial++),
        revision,
        { type: "continue" },
      ]),
    ),
  );
  assert.equal(races.filter((r) => r.status === "fulfilled").length, 1);
  assert.match(
    races.find((r) => r.status === "rejected").reason.message,
    /Stale revision/,
  );
  for (const [sql, args] of [
    ["SELECT group_private.submit_job_vote($1,$2)", [uuid(100), uuid(12)]],
    ["SELECT group_private.submit_vote($1,$2)", [uuid(100), uuid(20)]],
    ["SELECT group_private.configure_host_session(true,30)", []],
  ]) {
    await db.query("RESET ROLE"); // grant only the unchanged private entry for isolated guard testing
    const signature = sql.includes("submit_job")
      ? "group_private.submit_job_vote(uuid,uuid)"
      : sql.includes("submit_vote")
        ? "group_private.submit_vote(uuid,uuid)"
        : "group_private.configure_host_session(boolean,integer)";
    await db.query("GRANT USAGE ON SCHEMA group_private TO authenticated");
    await db.query(`GRANT EXECUTE ON FUNCTION ${signature} TO authenticated`);
    await actor(db, 4, false);
    await assert.rejects(db.query(sql, args), /Anonymous session required/);
  }
  // A non-staff owner must not bypass eligibility through owner-only RLS.
  await db.query("RESET ROLE");
  await db.query(
    "UPDATE playthroughs SET owner_user_id=$1 WHERE playthrough_id=$2",
    [uuid(3), staffRun],
  );
  await actor(db, 3, false);
  await rejectOperations(staffRun);
  await assert.rejects(
    db.query(
      "INSERT INTO playthroughs(persona_id,version_id,owner_user_id,current_balance,current_day,status,started_at) VALUES($1,$2,$3,100,1,'active',now())",
      [uuid(11), uuid(10), uuid(3)],
    ),
  );
  await assert.rejects(
    db.query(
      "UPDATE playthroughs SET current_balance=999 WHERE playthrough_id=$1",
      [staffRun],
    ),
    /permission denied/,
  );
  await actor(db, 3, false);
  assert.equal(
    (await db.query("SELECT is_individual_player() ok")).rows[0].ok,
    false,
  );
  await assert.rejects(start());
  await actor(db, null, false);
  assert.equal(
    (await db.query("SELECT is_individual_player() ok")).rows[0].ok,
    false,
  );
  console.log(
    "PASS: reviewed-definition guard, exact body/ACL preservation, anonymous/staff employment, bills, ordinary decisions/recaps, completion/replay, cross-owner/non-staff/revocation read and mutation denial, direct-write denial, overlapping bill payments/revision race, group guard rejection and unchanged group definitions.",
  );
} finally {
  for (const c of clients) await c.end();
  await server.stop();
}
