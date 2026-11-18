// ACS detailed-table cells verified against the Census 2024 ACS five-year catalogue.
const cells = (table, numbers) =>
  numbers.map((n) => `${table}_${String(n).padStart(3, "0")}E`);
const binding = (table, numerator, denominator, subtract = []) => ({
  table,
  numerator: cells(table, numerator),
  denominator: cells(table, denominator),
  subtract: cells(table, subtract),
});
export const censusBindings = {
  D001: binding("B23025", [5], [3]),
  D003: binding("B23025", [7], [1]),
  D004: binding("B08303", [12, 13], [1]),
  D006: binding("B25070", [7, 8, 9, 10], [1], [11]),
  D020: binding(
    "B27001",
    [5, 8, 11, 14, 17, 20, 23, 26, 29, 33, 36, 39, 42, 45, 48, 51, 54, 57],
    [1],
  ),
  D028: binding("B25048", [3], [1]),
  D032: { ...binding("B25010", [3], []), average: true },
  D044: binding("B08201", [2], [1]),
  D055: binding("B17010", [2], [1]),
};
export const censusVariables = [
  ...new Set(
    Object.values(censusBindings)
      .flatMap((b) => [...b.numerator, ...b.denominator, ...b.subtract])
      .flatMap((v) => [v, v.replace(/E$/, "M")]),
  ),
];

function numeric(value, variable) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  )
    throw new Error(`Missing Census cell ${variable}`);
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number < 0 ||
    (!variable.startsWith("B25010_") && !Number.isInteger(number))
  )
    throw new Error(`Invalid Census cell ${variable}`);
  return number;
}

export function parseCensusFacts(values, year, checkedAt) {
  if (
    values.NAME !== "Sandy Springs city, Georgia" ||
    values.state !== "13" ||
    values.place !== "68516"
  )
    throw new Error("Census geography mismatch");
  if (!Number.isInteger(year) || year < 2020)
    throw new Error("Invalid Census release");
  const raw = Object.fromEntries(
    censusVariables.map((v) => [v, numeric(values[v], v)]),
  );
  const sum = (variables) => variables.reduce((total, v) => total + raw[v], 0);
  const metrics = {};
  for (const [key, b] of Object.entries(censusBindings)) {
    const numerator = sum(b.numerator);
    const denominator = b.average ? null : sum(b.denominator) - sum(b.subtract);
    if (
      b.average
        ? numerator <= 0 || numerator > 20
        : denominator <= 0 || numerator > denominator
    )
      throw new Error(`Invalid Census calculation ${key}`);
    metrics[key] = {
      value: b.average ? numerator : (100 * numerator) / denominator,
      numerator,
      denominator,
      table: b.table,
      variables: [...b.numerator, ...b.denominator, ...b.subtract],
    };
  }
  return {
    year,
    period: `${year - 4}–${year}`,
    checkedAt,
    sourceUrl: `https://api.census.gov/data/${year}/acs/acs5`,
    geography: { name: values.NAME, state: values.state, place: values.place },
    raw,
    metrics,
  };
}

export async function fetchCensusFacts(env, options = {}) {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetch;
  const key = env.CENSUS_API_KEY?.trim();
  const failures = [];
  // No other provider is called by this adapter.
  for (
    let year = now.getUTCFullYear() - 1;
    year >= now.getUTCFullYear() - 3;
    year--
  ) {
    try {
      let values = {};
      for (let offset = 0; offset < censusVariables.length; offset += 40) {
        const variables = censusVariables.slice(offset, offset + 40);
        const url = new URL(`https://api.census.gov/data/${year}/acs/acs5`);
        url.searchParams.set("get", ["NAME", ...variables].join(","));
        url.searchParams.set("for", "place:68516");
        url.searchParams.set("in", "state:13");
        if (key) url.searchParams.set("key", key);
        const response = await fetcher(url, {
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error("Census release unavailable");
        if (/(?:missing|invalid)_key/.test(response.url ?? ""))
          throw new Error("Census key rejected");
        const body = await response.json();
        if (
          !Array.isArray(body) ||
          body.length !== 2 ||
          !Array.isArray(body[0]) ||
          !Array.isArray(body[1]) ||
          body[0].length !== body[1].length
        )
          throw new Error("Invalid Census response");
        const part = Object.fromEntries(
          body[0].map((name, i) => [name, body[1][i]]),
        );
        if (variables.some((v) => !(v in part)))
          throw new Error("Missing Census variables");
        if (
          offset &&
          ["NAME", "state", "place"].some((v) => part[v] !== values[v])
        )
          throw new Error("Census batch geography mismatch");
        values = { ...values, ...part };
      }
      return parseCensusFacts(values, year, now.toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const reason =
        /^(Census (key rejected|release unavailable|geography mismatch|batch geography mismatch)|Invalid Census (cell [A-Z0-9_]+|response|calculation D\d+|release)|Missing Census (cell [A-Z0-9_]+|variables))$/.test(
          message,
        )
          ? message
          : "Network or non-JSON response";
      failures.push({ year, reason });
      // Try older releases only after the complete release fails validation.
      // Never expose provider URLs containing credentials in errors.
    }
  }
  const error = new Error(
    "Census facts unavailable: check the Census key and annual release availability",
  );
  error.diagnostics = failures;
  throw error;
}

export function applyCensusFacts(
  catalog,
  census,
  previousCatalog,
  checkedAt = new Date().toISOString(),
) {
  const freshness = catalog.freshness ?? (catalog.freshness = {});
  const prior = previousCatalog?.censusFacts;
  const usable = census && (!prior || census.year >= prior.year);
  let complete = 0;
  for (const [key, binding] of Object.entries(censusBindings)) {
    const card = catalog.cards.find((c) => c.key === key);
    const fact = card?.facts.find((f) => f.role === "general");
    if (!fact) throw new Error(`Missing Census fact template ${key}`);
    const old = previousCatalog?.cards
      .find((c) => c.key === key)
      ?.facts.find(
        (f) => f.role === "general" && f.semantic_key === fact.semantic_key,
      );
    const statusKey = `fact:${key}`;
    if (usable) {
      const metric = census.metrics[key];
      if (!metric || !Number.isFinite(metric.value))
        throw new Error(`Missing Census metric ${key}`);
      fact.text = fact.template
        .replaceAll("{period}", census.period)
        .replaceAll("{pct}", metric.value.toFixed(1))
        .replaceAll("{persons}", metric.value.toFixed(2));
      if (/[{}]/.test(fact.text))
        throw new Error(`Unresolved Census fact ${key}`);
      fact.copy_kind = "fact";
      fact.source_url = census.sourceUrl;
      fact.observation = {
        year: census.year,
        period: census.period,
        checkedAt: census.checkedAt,
        ...metric,
      };
      freshness[statusKey] = {
        label: card.title + " fact",
        status: "current",
        checkedAt,
        lastSuccessfulAt: census.checkedAt,
        observationPeriod: census.period,
      };
    } else if (old?.copy_kind === "fact") {
      fact.text = old.text;
      fact.copy_kind = "fact";
      fact.source_url = old.source_url;
      if (old.observation) fact.observation = old.observation;
      const verified = previousCatalog?.freshness?.[statusKey];
      freshness[statusKey] = {
        label: card.title + " fact",
        status: "carried_forward",
        checkedAt,
        lastSuccessfulAt:
          verified?.lastSuccessfulAt ?? old.observation?.checkedAt ?? null,
        observationPeriod:
          verified?.observationPeriod ??
          old.observation?.period ??
          prior?.period ??
          null,
      };
    }
    if (fact.copy_kind === "fact" && !/[{}]/.test(fact.text)) complete++;
  }
  if (usable) catalog.censusFacts = census;
  else if (prior) catalog.censusFacts = prior;
  return complete;
}
