import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCatalog } from "./catalog.mjs";
import {
  monthlyCpi,
  cpiPrice,
  cpiFact,
  electricityBill,
  rentcastMarket,
  weightedRents,
  refreshWages,
  refreshCatalog,
} from "../../supabase/functions/_shared/game-data.mjs";

const library = JSON.parse(
  fs.readFileSync(
    new URL("../../docs/data/scenario-library-draft.json", import.meta.url),
  ),
);
const catalog = buildCatalog(library);

test("applies all requested removals, car access, prices, and CAC alternatives", () => {
  assert.equal(catalog.cards.length, 51);
  assert.ok(catalog.cards.every((c) => c.intent !== "CAR"));
  assert.ok(
    !catalog.cards.some((c) =>
      [
        "D016",
        "D017",
        "D023",
        "D031",
        "D037",
        "D038",
        "D041",
        "D057",
        "D060",
      ].includes(c.key),
    ),
  );
  const card = (key) => catalog.cards.find((c) => c.key === key);
  assert.equal(card("D009").bill.amount, 100);
  assert.equal(card("D018").bill.amount, 75);
  assert.equal(card("D014").bill.amount, 62);
  assert.equal(catalog.taxFee, 250);
  assert.equal(
    card("D030").choices.find((c) => c.key === "D030-REPLACE").amount,
    -600,
  );
  assert.equal(card("D027").title, "Broken work shoes");
  for (const key of ["D027", "D033", "D040", "D043", "D046", "D051"])
    assert.ok(card(key).choices.some((c) => c.requires_cac && c.amount === 0));
  assert.ok(
    catalog.cards.every((c) =>
      ["ALL", "JORDAN", "SOFIA", "EMPLOYED"].includes(c.intent),
    ),
  );
  assert.equal(card("D033").intent, "ALL");
  assert.deepEqual(
    card("D033").choices.map((c) => c.amount),
    [-80, -50, 0],
  );
  assert.deepEqual(
    card("D039").choices.map((c) => c.amount),
    [-150, 0],
  );
  assert.deepEqual(
    card("D040").choices.map((c) => c.amount),
    [-60, -25, 0],
  );
  assert.equal(catalog.bindings["D033-REPLACE"].series, "CUUR0000SEHK");
  assert.equal(catalog.bindings["D039-PAY"].series, "CUUR0000SA0");
  assert.equal(catalog.bindings["D040-BUY"].series, "CUUR0000SAA");
  for (const card of catalog.cards)
    for (const choice of card.choices) {
      if (choice.amount !== 0 && card.key !== "D005")
        assert.ok(catalog.bindings[choice.key], choice.key);
    }
  for (const card of catalog.cards.filter((c) => c.bill)) {
    assert.ok(catalog.bindings[`${card.key}:bill`]);
    assert.ok(catalog.bindings[`${card.key}:fee`]);
  }
});
test("uses a fixed CPI baseline without compounding and an exact 12-month fact interval", () => {
  const rows = monthlyCpi([
    { year: "2026", period: "M09", value: "-" },
    { year: "2026", period: "M08", value: "" },
    { year: "2026", period: "M13", value: "999" },
    { year: "2026", period: "M10", value: "120" },
    { year: "2025", period: "M10", value: "100" },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(cpiPrice(60, rows, "2025-10"), 72);
  assert.equal(cpiPrice(60, rows, "2025-10"), 72);
  const fact = cpiFact(
    {
      template:
        "Between {base observation period} and {latest observation period}, the U.S. price index for apparel changed by {pct}%.",
    },
    rows,
  );
  assert.match(fact, /2025-10 and 2026-10/);
  assert.match(fact, /prices for apparel were 20.0% higher/);
  for (const card of library.cards.filter((card) =>
    card.generalFact.semanticKey.startsWith("cpi:"),
  )) {
    const copy = cpiFact({ template: card.generalFact.text }, rows);
    assert.doesNotMatch(copy, /\b(?:index|indices)\b|[{}]/i);
    assert.match(copy, /higher/);
    const falling = cpiFact({ template: card.generalFact.text }, [
      { period: "2026-10", value: 80 },
      { period: "2025-10", value: 100 },
    ]);
    assert.match(falling, /20.0% lower/);
  }
  assert.throws(() => cpiPrice(60, rows, "2024-10"), /baseline/);
});
test("rejects mismatched energy units", () => {
  const row = {
    period: "2026-08",
    stateid: "GA",
    sectorid: "RES",
    revenue: "600",
    customers: "4000000",
    "revenue-units": "million dollars",
    "customers-units": "number of customers",
  };
  assert.equal(electricityBill(row), 150);
  assert.throws(
    () => electricityBill({ ...row, "revenue-units": "thousand dollars" }),
    /units/,
  );
});
test("fetches providers, applies source results, and keeps API credentials out of output", async () => {
  let rentCalls = 0;
  const savedMarkets = {};

  const fetcher = async (url, init = {}) => {
    const target = String(url);
    assert.ok(
      [
        "api.bls.gov",
        "api.rentcast.io",
        "api.eia.gov",
        "api.census.gov",
      ].includes(new URL(target).hostname),
      "Refresh requested a non-API URL",
    );
    let body;
    if (target.includes("api.bls.gov")) {
      const ids = JSON.parse(init.body).seriesid;
      body = {
        status: "REQUEST_SUCCEEDED",
        Results: {
          series: ids.map((seriesID) => ({
            seriesID,
            data:
              seriesID === "CUUR0000SEHK"
                ? [{ year: "2026", period: "M10", value: "-" }]
                : [
                    { year: "2026", period: "M10", value: "110" },
                    { year: "2026", period: "M09", value: "100" },
                    { year: "2025", period: "M10", value: "100" },
                  ],
          })),
        },
      };
    } else if (target.includes("api.rentcast.io")) {
      rentCalls++;
      body = {
        zipCode: new URL(target).searchParams.get("zipCode"),
        rentalData: {
          lastUpdatedDate: "2026-10-31",
          dataByBedrooms: [
            { bedrooms: 1, averageRent: 1600, totalListings: 10 },
            { bedrooms: 2, averageRent: 2000, totalListings: 20 },
          ],
        },
      };
    } else if (target.includes("api.eia.gov"))
      body = {
        response: {
          data: [
            {
              period: "2026-08",
              stateid: "GA",
              sectorid: "RES",
              revenue: 600,
              customers: 4000000,
              "revenue-units": "million dollars",
              "customers-units": "number of customers",
            },
          ],
        },
      };
    else if (target.includes("census.gov"))
      body = [
        ["NAME", "B23025_003E", "B23025_005E"],
        ["Sandy Springs city, Georgia", "100", "5"],
      ];
    else throw new Error("Unexpected source");
    return new Response(
      typeof body === "string" ? body : JSON.stringify(body),
      { status: 200 },
    );
  };
  const env = {
    BLS_API_KEY: "secret-bls",
    EIA_API_KEY: "secret-eia",
    RENTCAST_API_KEY: "secret-rent",
  };
  const input = structuredClone(catalog);
  for (const key of ["D014:bill", "D021-TRANSIT", "D044-TRANSIT"]) {
    assert.equal(input.bindings[key].source, "cpi");
    assert.equal(input.bindings[key].series, "CUUR0000SA0");
    input.bindings[key].baselinePeriod = "2026-09";
  }
  const result = await refreshCatalog(input, env, {
    saveRentcast: async (zip, market) => {
      savedMarkets[zip] = market;
    },
    fetcher,
    now: new Date("2026-11-15"),
  });
  assert.equal(result.ready, true, JSON.stringify(result.errors));
  assert.equal(
    result.catalog.cards.find((c) => c.key === "D033").choices[0].amount,
    -80,
  );
  assert.ok(
    result.warnings.some(
      (w) =>
        w.source === "D033-REPLACE" &&
        w.message.includes("general all-items CPI"),
    ),
  );
  assert.equal(rentCalls, 6);

  assert.equal(result.catalog.rents.Alex, 800);
  assert.equal(
    result.catalog.cards.find((c) => c.key === "D007").bill.amount,
    150,
  );
  assert.match(
    result.catalog.cards.find((c) => c.key === "D003").facts[0].text,
    /5.0%/,
  );
  assert.deepEqual(result.catalog.refunds, {
    Alex: 989,
    Jordan: 1989,
    Patricia: 989,
    Sofia: 989,
  });
  assert.equal(
    result.catalog.cards.find((c) => c.key === "D014").bill.amount,
    68.2,
  );
  assert.equal(
    result.catalog.cards
      .find((c) => c.key === "D044")
      .choices.find((c) => c.key === "D044-TRANSIT").amount,
    -5.5,
  );
  assert.ok(
    Object.values(catalog.bindings).every((b) =>
      ["cpi", "rentcast", "eia"].includes(b.source),
    ),
  );
  assert.deepEqual(
    result.catalog.cards.find((c) => c.key === "D024").facts,
    catalog.cards.find((c) => c.key === "D024").facts,
  );
  assert.equal(
    result.catalog.cards
      .find((c) => c.key === "D021")
      .choices.find((c) => c.key === "D021-TRANSIT").amount,
    -104.5,
  );
  assert.ok(!JSON.stringify(result).includes("secret-"));
  assert.ok(!JSON.stringify(result).includes("fake-provider-token"));
  await refreshCatalog(catalog, env, {
    fetcher,
    rentcastZipCache: savedMarkets,
    now: new Date("2026-11-15"),
  });
  assert.equal(rentCalls, 6);
});

test("combines bedroom rents by listing count and validates cached market data", () => {
  const market = (zip, one, two, count) =>
    rentcastMarket(
      {
        zipCode: zip,
        rentalData: {
          lastUpdatedDate: "2026-11-17",
          dataByBedrooms: [
            { bedrooms: 1, averageRent: one, totalListings: count },
            { bedrooms: 2, averageRent: two, totalListings: 10 },
          ],
        },
      },
      zip,
    );
  const result = weightedRents(
    [market("30327", 1000, 2000, 10), market("30328", 2000, 3000, 30)],
    catalog.rentHouseholds,
  );
  assert.deepEqual(result.rents, {
    Alex: 875,
    Sofia: 1250,
    Jordan: 2500,
    Patricia: 1750,
  });
  assert.throws(
    () => rentcastMarket({ zipCode: "30327", rentalData: {} }, "30328"),
    /another ZIP/,
  );
  assert.throws(
    () =>
      rentcastMarket(
        {
          zipCode: "30327",
          rentalData: {
            lastUpdatedDate: "2026-11-17",
            dataByBedrooms: [{ bedrooms: 1, averageRent: 1000 }],
          },
        },
        "30327",
      ),
    /listing count/,
  );
});
test("failed sources prevent publication and cannot overwrite a working baseline with invalid values", async () => {
  const result = await refreshCatalog(
    catalog,
    {},
    { fetcher: async () => new Response("{}", { status: 503 }) },
  );
  assert.equal(result.ready, false);
  assert.ok(result.errors.length > 0);
  assert.equal(result.catalog.clothing, 60);
  assert.equal(
    result.catalog.cards.find((c) => c.key === "D009").bill.amount,
    100,
  );
});

test("an exhausted monthly allowance prevents the RentCast network request", async () => {
  let rentCalls = 0;
  const result = await refreshCatalog(
    catalog,
    { RENTCAST_API_KEY: "test-rent-key" },
    {
      beforeRentcast: async () => false,
      fetcher: async (url) => {
        if (new URL(url).hostname === "api.rentcast.io") rentCalls++;
        return new Response("{}", { status: 503 });
      },
    },
  );
  assert.equal(rentCalls, 0);
  assert.ok(
    result.errors.some(
      (error) =>
        error.source === "rentcast" && error.message.includes("allowance"),
    ),
  );
});

test("retains the previous dated fact and redacts network errors containing credentials", async () => {
  const previousCatalog = structuredClone(catalog);
  const prior = previousCatalog.cards.find((card) => card.key === "D003")
    .facts[0];
  prior.text =
    "In 2020–2024, 4.5% of Sandy Springs civilian labor-force participants were unemployed.";
  prior.copy_kind = "fact";
  const result = await refreshCatalog(
    catalog,
    { EIA_API_KEY: "private-test-key" },
    {
      previousCatalog,
      fetcher: async () => {
        throw new Error("request failed?api_key=private-test-key");
      },
    },
  );
  assert.equal(
    result.catalog.cards.find((card) => card.key === "D003").facts[0].text,
    prior.text,
  );
  assert.ok(!JSON.stringify(result).includes("private-test-key"));
});

const priorJob = {
  soc_code: "41-2011",
  area_code: "12060",
  title: "Cashier",
  median_hourly_wage: "15.50",
  wage_year: 2025,
  wage_source_url: "https://data.bls.gov/",
  last_synced_at: "2026-10-27T00:00:00Z",
};

test("an API outage publishes prior prices and wages without resetting verification dates", async () => {
  const previous = structuredClone(catalog);
  previous.clothing = 73.5;
  previous.taxFee = 282;
  previous.refunds = { Alex: 1100, Jordan: 2200, Patricia: 1100, Sofia: 1100 };
  previous.rents = { Alex: 800, Jordan: 1900, Patricia: 1600, Sofia: 950 };
  previous.cards.find((c) => c.key === "D007").bill.amount = 199.99;
  previous.cards.find((c) => c.key === "D033").choices[0].amount = -83.45;
  previous.freshness = {
    "D033-REPLACE": {
      lastSuccessfulAt: "2026-11-01T00:00:00Z",
      observationPeriod: "2026-10",
    },
  };
  const result = await refreshCatalog(
    catalog,
    {},
    {
      previousCatalog: previous,
      previousPublishedAt: "2026-11-02T00:00:00Z",
      jobs: [priorJob],
      now: new Date("2026-12-26"),
      fetcher: async () => new Response("{}", { status: 503 }),
    },
  );
  assert.equal(result.ready, true);
  assert.equal(result.catalog.clothing, 73.5);
  assert.equal(result.catalog.taxFee, 282);
  assert.equal(result.catalog.refunds.Jordan, 2200);
  assert.deepEqual(result.catalog.rents, previous.rents);
  assert.equal(
    result.catalog.cards.find((c) => c.key === "D007").bill.amount,
    199.99,
  );
  assert.equal(
    result.catalog.cards.find((c) => c.key === "D033").choices[0].amount,
    -83.45,
  );
  assert.equal(
    result.catalog.freshness["D033-REPLACE"].status,
    "carried_forward",
  );
  assert.equal(
    result.catalog.freshness["D033-REPLACE"].lastSuccessfulAt,
    "2026-11-01T00:00:00Z",
  );
  assert.equal(result.catalog.wages[0].hourly, 15.5);
  assert.equal(
    result.catalog.freshness["wage:41-2011"].lastSuccessfulAt,
    priorJob.last_synced_at,
  );
});

test("tax credits follow general CPI and failed electricity retains its published amount", async () => {
  const previous = structuredClone(catalog);
  previous.cards.find((c) => c.key === "D007").bill.amount = 199.99;
  const caches = Object.fromEntries(
    catalog.rentZipCodes.map((zip) => [
      zip,
      {
        zipCode: zip,
        lastUpdatedDate: "2026-12-26",
        dataByBedrooms: [
          { bedrooms: 1, averageRent: 1600, totalListings: 10 },
          { bedrooms: 2, averageRent: 2000, totalListings: 10 },
        ],
      },
    ]),
  );
  const result = await refreshCatalog(
    catalog,
    { EIA_API_KEY: "test" },
    {
      previousCatalog: previous,
      rentcastZipCache: caches,
      now: new Date("2026-12-26"),
      fetcher: async (url, init) => {
        if (new URL(url).hostname !== "api.bls.gov")
          return new Response("{}", { status: 503 });
        return Response.json({
          status: "REQUEST_SUCCEEDED",
          Results: {
            series: JSON.parse(init.body).seriesid.map((seriesID) => ({
              seriesID,
              data: [
                { year: "2026", period: "M10", value: "100" },
                { year: "2026", period: "M11", value: "110" },
                { year: "2025", period: "M11", value: "100" },
              ],
            })),
          },
        });
      },
    },
  );
  assert.equal(result.ready, true);
  assert.equal(result.catalog.refunds.Alex, 1087.9);
  assert.equal(result.catalog.refunds.Jordan, 2187.9);
  assert.equal(result.catalog.freshness["tax:Jordan"].status, "current");
  assert.equal(
    result.catalog.cards.find((c) => c.key === "D007").bill.amount,
    199.99,
  );
  assert.equal(result.catalog.freshness["D007:bill"].status, "carried_forward");
});

test("wages use OEWS annual observations and keep unavailable occupations", async () => {
  const result = await refreshWages(
    async (url, init) => ({
      status: "REQUEST_SUCCEEDED",
      Results: {
        series: JSON.parse(init.body).seriesid.map((seriesID) => ({
          seriesID,
          data: [
            {
              year: "2026",
              period: "A01",
              value: seriesID.endsWith("08") ? "18.50" : "38480",
            },
          ],
        })),
      },
    }),
    [priorJob],
    {},
    new Date("2026-12-26"),
  );
  assert.equal(result.wages[0].hourly, 18.5);
  assert.equal(result.wages[0].year, 2026);
  assert.equal(result.freshness["wage:41-2011"].status, "current");
});
