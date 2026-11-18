import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCatalog } from "./catalog.mjs";
import { refreshCatalog } from "../../supabase/functions/_shared/game-data.mjs";
import { censusFixture, censusResponse } from "./census-fixture.mjs";
import {
  parseCensusFacts,
  fetchCensusFacts,
  applyCensusFacts,
  censusVariables,
} from "../../supabase/functions/_shared/census-facts.mjs";
const now = new Date("2026-11-17T12:00:00Z");
const catalog = () =>
  buildCatalog(
    JSON.parse(
      fs.readFileSync(
        new URL("../../docs/data/scenario-library-draft.json", import.meta.url),
      ),
    ),
  );
const observation = () =>
  parseCensusFacts(censusFixture(), 2024, now.toISOString());
test("returns safe credential diagnostics instead of exposing the requested URL", async () => {
  await assert.rejects(
    fetchCensusFacts(
      { CENSUS_API_KEY: "private-census-key" },
      {
        now,
        fetcher: async () => ({
          ok: true,
          url: "https://api.census.gov/data/invalid_key.html",
        }),
      },
    ),
    (error) => {
      assert.equal(error.diagnostics.length, 3);
      assert.ok(
        error.diagnostics.every((d) => d.reason === "Census key rejected"),
      );
      assert.ok(
        !JSON.stringify(error.diagnostics).includes("private-census-key"),
      );
      return true;
    },
  );
});
test("the real monthly pipeline preserves all nine complete facts when Census is unavailable", async () => {
  const previous = catalog();
  previous.rents = previous.provisionalRents;
  applyCensusFacts(previous, observation(), null, now.toISOString());
  const result = await refreshCatalog(
    catalog(),
    {},
    {
      previousCatalog: previous,
      now: new Date("2026-12-26T06:00:00Z"),
      fetcher: async () => {
        throw new Error("offline");
      },
    },
  );
  for (const key of Object.keys(observation().metrics)) {
    assert.equal(
      result.catalog.cards.find((c) => c.key === key).facts[0].text,
      previous.cards.find((c) => c.key === key).facts[0].text,
    );
    assert.equal(
      result.catalog.freshness["fact:" + key].status,
      "carried_forward",
    );
    assert.equal(
      result.catalog.freshness["fact:" + key].lastSuccessfulAt,
      now.toISOString(),
    );
  }
});
test("computes nine distinct measures with correct populations and retains estimate/MOE cells", () => {
  const data = observation();
  assert.equal(Object.keys(data.metrics).length, 9);
  assert.equal(data.metrics.D001.value, 5);
  assert.equal(data.metrics.D003.value, 25);
  assert.equal(data.metrics.D004.value, 5);
  assert.equal(data.metrics.D006.value, 50);
  assert.equal(data.metrics.D020.value, 18);
  assert.equal(data.metrics.D028.value, 0);
  assert.equal(data.metrics.D032.value, 2.35);
  assert.equal(data.metrics.D044.value, 10);
  assert.equal(data.metrics.D055.value, 12);
  assert.equal(data.metrics.D020.variables.length, 19);
  assert.equal(data.raw.B25048_003M, 2);
  assert.equal(data.metrics.D028.table, "B25048");
  assert.equal(data.period, "2020–2024");
});
test("rejects suppressed/missing/negative cells, wrong geography, impossible counts and zero denominators", () => {
  for (const change of [
    { B23025_005E: "-666666666" },
    { B23025_003E: "0" },
    { B23025_005E: "101" },
    { B25048_003E: null },
    { B25048_003E: "" },
    { B25010_003E: "0" },
    { B27001_057E: undefined },
    { B25070_011E: "101" },
    { B25048_003M: "-222222222" },
    { NAME: "Another city, Georgia" },
    { place: "00000" },
  ])
    assert.throws(() =>
      parseCensusFacts(
        { ...censusFixture(), ...change },
        2024,
        now.toISOString(),
      ),
    );
});
test("falls through malformed newest releases, validates reordered headers, batches below the Census field limit and keeps keys private", async () => {
  const calls = [];
  const data = await fetchCensusFacts(
    { CENSUS_API_KEY: " secret-key " },
    {
      now,
      fetcher: async (url) => {
        calls.push(String(url));
        const u = new URL(url);
        assert.equal(u.searchParams.get("key"), "secret-key");
        assert.ok(u.searchParams.get("get").split(",").length <= 50);
        if (u.pathname.includes("/2025/"))
          return new Response("<html>Unavailable</html>");
        return censusResponse(url);
      },
    },
  );
  assert.equal(data.year, 2024);
  assert.equal(
    calls.filter((x) => x.includes("/2024/")).length,
    Math.ceil(censusVariables.length / 40),
  );
  assert.ok(!JSON.stringify(data).includes("secret-key"));
  await assert.rejects(
    fetchCensusFacts(
      { CENSUS_API_KEY: "secret-key" },
      {
        now,
        fetcher: async () => {
          throw new Error("URL?key=secret-key");
        },
      },
    ),
    (e) => !e.message.includes("secret-key"),
  );
});
test("requires consistent geography across batches", async () => {
  let count = 0;
  await assert.rejects(
    fetchCensusFacts(
      {},
      {
        now,
        fetcher: async (url) =>
          censusResponse(url, {
            ...censusFixture(),
            place: ++count % 2 ? "68516" : "00000",
          }),
      },
    ),
  );
});
test("renders all nine facts and carries full dated passages forward across outages without price changes", () => {
  const current = catalog();
  const prices = JSON.stringify(current.bindings);
  assert.equal(
    applyCensusFacts(current, observation(), null, now.toISOString()),
    9,
  );
  assert.equal(
    current.cards.find((c) => c.key === "D028").facts[0].text.includes("0.0%"),
    true,
  );
  assert.match(
    current.cards.find((c) => c.key === "D032").facts[0].text,
    /2.35 people/,
  );
  const next = catalog();
  assert.equal(
    applyCensusFacts(next, null, current, "2026-12-26T06:00:00Z"),
    9,
  );
  for (const key of Object.keys(observation().metrics)) {
    const fact = next.cards.find((c) => c.key === key).facts[0];
    assert.equal(
      fact.text,
      current.cards.find((c) => c.key === key).facts[0].text,
    );
    assert.equal(fact.copy_kind, "fact");
    assert.doesNotMatch(fact.text, /[{}]/);
    assert.equal(next.freshness["fact:" + key].status, "carried_forward");
    assert.equal(
      next.freshness["fact:" + key].lastSuccessfulAt,
      now.toISOString(),
    );
  }
  assert.equal(JSON.stringify(next.bindings), prices);
  const regressed = { ...observation(), year: 2023 };
  applyCensusFacts(next, regressed, current);
  assert.equal(next.censusFacts.year, 2024);
});
