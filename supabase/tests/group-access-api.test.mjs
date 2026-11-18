import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

const endpoint = new URL(
  process.env.GROUP_TEST_API_URL ?? "http://127.0.0.1:55321",
);
assert.equal(endpoint.protocol, "http:");
assert(
  ["127.0.0.1", "localhost"].includes(endpoint.hostname),
  "Use a disposable local API",
);
const restPath = (process.env.GROUP_TEST_REST_PATH ?? "/rest/v1").replace(
  /\/$/,
  "",
);
assert(
  ["", "/rest/v1"].includes(restPath),
  "Use a local PostgREST or Supabase API",
);
const key = process.env.GROUP_TEST_PUBLISHABLE_KEY;
const signingSecret = process.env.GROUP_TEST_FIXTURE_SIGNING_SECRET;

function fixtureToken(number) {
  const claims = {
    sub: `63100000-0000-4000-8000-${String(number).padStart(12, "0")}`,
    role: "authenticated",
    is_anonymous: true,
    exp: Math.floor(Date.now() / 1000) + 300,
  };
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode(claims)}`;
  return `${unsigned}.${createHmac("sha256", signingSecret).update(unsigned).digest("base64url")}`;
}

async function request(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (key) headers.apikey = key;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(new URL(path, endpoint), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    redirect: "error",
  });
  return { status: response.status, body: await response.json() };
}

async function identity(number) {
  if (signingSecret) return fixtureToken(number);
  assert(key, "Set GROUP_TEST_PUBLISHABLE_KEY for local anonymous Auth");
  const response = await request("/auth/v1/signup", { data: {} });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.user.is_anonymous, true);
  return response.body.access_token;
}

const rpc = (token, name, args) =>
  request(`${restPath}/rpc/${name}`, args, token);

async function allowed(token, name, args) {
  const result = await rpc(token, name, args);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert(!result.body?.error, result.body?.error);
  return result.body;
}

async function denied(token, name, args) {
  const result = await rpc(token, name, args);
  assert.equal(result.status, 403, JSON.stringify(result.body));
  assert.equal(result.body.code, "42501");
}

const hostSession = (token, create = true) =>
  allowed(token, "configure_host_group_session", {
    p_create: create,
    p_decision_duration_seconds: 30,
    p_cac_support_enabled: false,
  });
const join = (code) => ({ p_code: code });
const target = (sessionId) => ({ p_session_id: sessionId });
const control = (sessionId, action) => ({
  ...target(sessionId),
  p_action: action,
});

test("group API scopes codes, enrollment, reads and host controls across concurrent sessions", async () => {
  const [hostA, hostB, participantA, participantB, outsider] =
    await Promise.all([301, 302, 303, 304, 305].map(identity));
  const opened = [];
  try {
    const [a, b, duplicateA] = await Promise.all([
      hostSession(hostA).then(
        (session) => (opened.push([hostA, session]), session),
      ),
      hostSession(hostB).then(
        (session) => (opened.push([hostB, session]), session),
      ),
      hostSession(hostA),
    ]);
    assert.match(a.joinCode, /^[A-HJ-NP-Z2-9]{4}$/);
    assert.match(b.joinCode, /^[A-HJ-NP-Z2-9]{4}$/);
    assert.notEqual(a.joinCode, b.joinCode);
    assert.notEqual(a.sessionId, b.sessionId);
    assert.equal(a.isHost, true);
    assert.equal(b.isHost, true);
    assert.equal(duplicateA.sessionId, a.sessionId);
    assert.equal(duplicateA.joinCode, a.joinCode);
    assert.equal((await hostSession(hostA, false)).joinCode, a.joinCode);

    const [joinedA, joinedB] = await Promise.all([
      allowed(
        participantA,
        "join_group_session",
        join(a.joinCode.toLowerCase()),
      ),
      allowed(participantB, "join_group_session", join(b.joinCode)),
    ]);
    assert.equal(joinedA.sessionId, a.sessionId);
    assert.equal(joinedB.sessionId, b.sessionId);
    assert.equal(joinedA.isHost, false);
    assert(joinedA.participantId);
    assert.equal(
      (await allowed(participantA, "join_group_session", join(a.joinCode)))
        .participantId,
      joinedA.participantId,
    );

    for (const [token, session] of [
      [participantA, a],
      [participantB, b],
    ]) {
      const state = await allowed(
        token,
        "get_group_session_state",
        target(session.sessionId),
      );
      assert.equal(state.sessionId, session.sessionId);
      assert.equal(state.participantCount, 1);
      assert.equal(state.isHost, false);
      for (const action of ["start", "end_voting", "next", "close"]) {
        await denied(
          token,
          "control_group_session",
          control(session.sessionId, action),
        );
      }
    }
    for (const token of [hostB, participantB, outsider]) {
      await denied(token, "get_group_session_state", target(a.sessionId));
      await denied(
        token,
        "control_group_session",
        control(a.sessionId, "close"),
      );
    }
    const anonymous = await rpc(
      undefined,
      "get_group_session_state",
      target(a.sessionId),
    );
    assert.equal(anonymous.status, 401);
    const invalid = await rpc(outsider, "join_group_session", join("INVALID!"));
    assert.equal(invalid.status, 200);
    assert.match(invalid.body.error, /Session unavailable/i);

    const wrongIdentifier = await rpc(participantA, "join_group_session", {
      p_session_id: b.sessionId,
    });
    assert.equal(wrongIdentifier.status, 404);
    const reconnectPersona = process.env.GROUP_TEST_RECONNECT_PERSONA_ID;
    if (reconnectPersona) {
      await allowed(participantB, "join_group_session", join(a.joinCode));
      await Promise.all(
        [participantA, participantB].map((token) =>
          allowed(token, "update_group_participant_setup", {
            ...target(a.sessionId),
            p_persona_id: reconnectPersona,
            p_ready: true,
          }),
        ),
      );
      const active = await allowed(
        hostA,
        "control_group_session",
        control(a.sessionId, "start"),
      );
      assert.equal(active.roundState, "voting");
      const [job, alternate] = active.jobs;
      assert(
        job && alternate,
        "The voting fixture requires two eligible published jobs",
      );
      const vote = (token, jobId) =>
        allowed(token, "submit_group_job_vote", {
          ...target(a.sessionId),
          p_job_id: jobId,
        });
      const [viewA, viewB] = await Promise.all(
        [participantA, participantB].map((token) =>
          allowed(token, "get_group_session_state", target(a.sessionId)),
        ),
      );
      assert.equal(viewA.roundDeadline, viewB.roundDeadline);
      assert.deepEqual(viewA.jobs, viewB.jobs);
      await Promise.all([
        vote(participantA, job.jobId),
        vote(participantA, alternate.jobId),
        vote(participantB, alternate.jobId),
      ]);
      assert.equal((await vote(participantA, job.jobId)).voteCount, 2);
      assert.equal((await vote(participantA, job.jobId)).voteCount, 2);
      const restored = await allowed(
        participantA,
        "get_group_session_state",
        target(a.sessionId),
      );
      assert.equal(restored.roundState, "voting");
      assert.equal(restored.participantId, joinedA.participantId);
      assert.equal(restored.selectedJobId, job.jobId);
      const rejoined = await allowed(
        participantA,
        "join_group_session",
        join(a.joinCode),
      );
      assert.equal(rejoined.participantId, joinedA.participantId);
      const lateJoin = await rpc(
        outsider,
        "join_group_session",
        join(a.joinCode),
      );
      assert.equal(lateJoin.status, 200);
      assert.match(lateJoin.body.error, /already started/i);
      assert.equal(
        (
          await allowed(
            participantA,
            "get_group_session_state",
            target(a.sessionId),
          )
        ).selectedJobId,
        job.jobId,
      );
      await denied(
        participantA,
        "get_group_session_state",
        target(b.sessionId),
      );
      if (process.env.GROUP_TEST_WAIT_FOR_DEADLINE === "1") {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.max(0, Date.parse(active.roundDeadline) - Date.now()) + 100,
          ),
        );
        const expired = await allowed(
          participantA,
          "get_group_session_state",
          target(a.sessionId),
        );
        assert.equal(expired.acceptingVotes, false);
        assert.equal(expired.roundState, "voting");
        assert(expired.jobs.every(({ voteCount }) => voteCount === null));
        const late = await rpc(participantA, "submit_group_job_vote", {
          ...target(a.sessionId),
          p_job_id: alternate.jobId,
        });
        assert.match(late.body.error, /voting has ended/i);
        const revealed = await allowed(
          hostA,
          "control_group_session",
          control(a.sessionId, "end_voting"),
        );
        assert.equal(revealed.roundState, "results");
        assert.equal(
          revealed.jobs.find(({ jobId }) => jobId === job.jobId).voteCount,
          1,
        );
        assert.equal(
          revealed.jobs.find(({ jobId }) => jobId === alternate.jobId)
            .voteCount,
          1,
        );
      }
    }

    const closed = await allowed(
      hostA,
      "control_group_session",
      control(a.sessionId, "close"),
    );
    assert.equal(closed.status, "closed");
    assert.equal(
      (
        await allowed(
          participantA,
          "get_group_session_state",
          target(a.sessionId),
        )
      ).status,
      "closed",
    );
    const rejected = await rpc(
      outsider,
      "join_group_session",
      join(a.joinCode),
    );
    assert.equal(rejected.status, 200);
    assert.match(rejected.body.error, /Session unavailable/i);
    assert.equal((await hostSession(hostB, false)).status, "open");
    assert.equal(
      (
        await allowed(
          participantB,
          "get_group_session_state",
          target(b.sessionId),
        )
      ).status,
      "open",
    );
    const fresh = await hostSession(hostA);
    opened.push([hostA, fresh]);
    assert.notEqual(fresh.sessionId, a.sessionId);
    assert.notEqual(fresh.joinCode, a.joinCode);
    assert.equal(fresh.participantCount, 0);
  } finally {
    await Promise.all(
      opened.map(([token, session]) =>
        allowed(
          token,
          "control_group_session",
          control(session.sessionId, "close"),
        ),
      ),
    );
  }
});
