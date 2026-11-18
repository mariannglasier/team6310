// Uses fixed provider endpoints. Credentials are supplied only by the server.
import { fetchCensusFacts, applyCensusFacts } from "./census-facts.mjs";
const endpoints = {
  bls: "https://api.bls.gov/publicAPI/v2/timeseries/data/",
  rentcast: "https://api.rentcast.io/v1/markets",
  eia: "https://api.eia.gov/v2/electricity/retail-sales/data/",
};
export function positive(value, label) {
  const parsed =
    typeof value === "string" && value.trim()
      ? Number(value.replaceAll(",", ""))
      : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed <= 0)
    throw new Error(`Invalid ${label}`);
  return parsed;
}
export function money(value) {
  if (!Number.isFinite(value) || value < 0 || value >= 10000000)
    throw new Error("Invalid monetary result");
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function monthlyCpi(rows) {
  return rows
    .filter((row) => /^M(0[1-9]|1[0-2])$/.test(row.period))
    .map((row) => ({
      period: `${row.year}-${row.period.slice(1)}`,
      value: Number(
        typeof row.value === "string"
          ? row.value.replaceAll(",", "")
          : row.value,
      ),
    }))
    .filter((row) => Number.isFinite(row.value) && row.value > 0)
    .sort((a, b) => b.period.localeCompare(a.period));
}
export function cpiPrice(amount, observations, baseline) {
  const base = observations.find((row) => row.period === baseline);
  if (!base || !observations.length)
    throw new Error(`Missing CPI baseline ${baseline}`);
  return money((amount * observations[0].value) / base.value);
}
export function cpiFact(fact, observations) {
  const latest = observations.find((candidate) =>
    observations.some(
      (row) =>
        row.period ===
        `${Number(candidate.period.slice(0, 4)) - 1}${candidate.period.slice(4)}`,
    ),
  );
  const prior = observations.find(
    (row) =>
      row.period ===
      `${Number(latest?.period.slice(0, 4)) - 1}${latest?.period.slice(4)}`,
  );
  if (!latest || !prior)
    throw new Error("Missing same-month prior-year CPI observation");
  const percent = 100 * (latest.value / prior.value - 1);
  return fact.template
    .replaceAll("{base observation period}", prior.period)
    .replaceAll("{latest observation period}", latest.period)
    .replaceAll("{pct}", Math.abs(percent).toFixed(1))
    .replaceAll("{change}", percent < 0 ? "decreased" : "increased")
    .replace(
      /(?:increased|decreased) by 0\.0%\./,
      percent === 0 ? "did not change." : "$&",
    )
    .replaceAll("{direction}", percent < 0 ? "lower" : "higher")
    .replace(
      /the U\.S\. price index for (.+?) changed by ([\d.]+)%\./,
      `U.S. prices for $1 were $2% ${percent < 0 ? "lower" : "higher"}.`,
    )
    .replace(
      /U\.S\. wireless telephone service prices changed by ([\d.]+)%\./,
      `U.S. wireless telephone service prices were $1% ${percent < 0 ? "lower" : "higher"}.`,
    );
}
export function electricityBill(row) {
  if (
    row.stateid !== "GA" ||
    row.sectorid !== "RES" ||
    !/^\d{4}-\d{2}$/.test(row.period)
  )
    throw new Error("Wrong electricity population or period");
  if (row["revenue-units"] !== "million dollars")
    throw new Error("Unexpected EIA revenue units");
  if (!/customers/i.test(row["customers-units"] ?? ""))
    throw new Error("Unexpected EIA customer units");
  return money(
    (positive(row.revenue, "electricity revenue") * 1000000) /
      positive(row.customers, "electricity customers"),
  );
}
export function rentcastMarket(body, expectedZip) {
  if (body.zipCode !== expectedZip)
    throw new Error("RentCast returned another ZIP");
  const period = body.rentalData?.lastUpdatedDate;
  if (!period || !Number.isFinite(Date.parse(period)))
    throw new Error("Missing rent observation date");
  if (!Array.isArray(body.rentalData.dataByBedrooms))
    throw new Error("Missing bedroom statistics");
  const dataByBedrooms = body.rentalData.dataByBedrooms
    .filter((row) => [1, 2].includes(row.bedrooms))
    .map((row) => {
      if (!Number.isInteger(row.totalListings) || row.totalListings < 0)
        throw new Error("Missing bedroom listing count");
      return {
        bedrooms: row.bedrooms,
        totalListings: row.totalListings,
        averageRent: row.totalListings
          ? positive(row.averageRent, "bedroom rent")
          : 0,
      };
    });
  if (
    new Set(dataByBedrooms.map((row) => row.bedrooms)).size !==
    dataByBedrooms.length
  )
    throw new Error("Duplicate bedroom statistics");
  return { zipCode: expectedZip, lastUpdatedDate: period, dataByBedrooms };
}

export function weightedRents(markets, households) {
  const bedroomAverages = {};
  for (const bedrooms of [1, 2]) {
    const rows = markets.flatMap((market) =>
      market.dataByBedrooms.filter((row) => row.bedrooms === bedrooms),
    );
    const listings = rows.reduce((total, row) => total + row.totalListings, 0);
    if (!listings) throw new Error("No listings for bedroom count " + bedrooms);
    bedroomAverages[bedrooms] = {
      averageRent:
        rows.reduce(
          (total, row) => total + row.averageRent * row.totalListings,
          0,
        ) / listings,
      totalListings: listings,
    };
  }
  const rents = Object.fromEntries(
    Object.entries(households).map(([name, profile]) => [
      name,
      money(bedroomAverages[profile.bedrooms].averageRent * profile.share),
    ]),
  );
  return {
    rents,
    bedroomAverages,
    zipCodes: markets.map((market) => market.zipCode),
    observationDates: Object.fromEntries(
      markets.map((market) => [market.zipCode, market.lastUpdatedDate]),
    ),
    method: "Bedroom-specific average rent weighted by totalListings",
  };
}

function previousPrice(catalog, key) {
  if (!catalog) throw new Error("No published value");
  let value;
  if (key === "clothing") value = catalog.clothing;
  else if (key === "tax-fee") value = catalog.taxFee;
  else if (key.startsWith("tax:"))
    value = catalog.refunds?.[key.slice(4)] ?? catalog.taxRefund;
  else if (key.includes(":")) {
    const [cardKey, field] = key.split(":");
    value = catalog.cards.find((card) => card.key === cardKey)?.bill?.[
      field === "bill" ? "amount" : "fee"
    ];
  } else
    value = Math.abs(
      catalog.cards
        .flatMap((card) => card.choices)
        .find((choice) => choice.key === key)?.amount,
    );
  if (!Number.isFinite(value) || value < 0)
    throw new Error("Missing published price");
  return value;
}

function priceLabel(catalog, key) {
  if (key === "clothing") return "Interview clothing";
  if (key === "tax-fee") return "Tax preparation fee";
  if (key.startsWith("tax:")) return "Tax credit — " + key.slice(4);
  const card = catalog.cards.find((card) => key.startsWith(card.key));
  if (key.endsWith(":fee")) return card.title + " late fee";
  if (key.endsWith(":bill")) return card.title;
  const choice = card?.choices.find((choice) => choice.key === key);
  return choice ? `${card.title} — ${choice.text}` : "Scenario price";
}

export async function refreshWages(request, jobs, env, now) {
  const wages = [];
  const freshness = {};
  const warnings = [];
  let series = [];
  const seriesId = (job, type) =>
    "OEUM" +
    job.area_code.padStart(7, "0") +
    "000000" +
    job.soc_code.replaceAll("-", "") +
    type;
  try {
    if (jobs.length) {
      const body = await request(endpoints.bls, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesid: jobs.flatMap((job) => [
            seriesId(job, "08"),
            seriesId(job, "13"),
          ]),
          startyear: String(now.getUTCFullYear() - 4),
          endyear: String(now.getUTCFullYear()),
          ...(env.BLS_API_KEY ? { registrationkey: env.BLS_API_KEY } : {}),
        }),
      });
      if (body.status !== "REQUEST_SUCCEEDED")
        throw new Error("Wage API unavailable");
      series = body.Results?.series ?? [];
    }
  } catch {
    warnings.push({
      source: "wages",
      message: "Wage API unavailable; retaining published wages",
    });
  }
  for (const job of jobs) {
    const key = "wage:" + job.soc_code;
    const old = {
      socCode: job.soc_code,
      hourly: Number(job.median_hourly_wage),
      year: job.wage_year,
      sourceUrl: job.wage_source_url,
      lastSyncedAt: job.last_synced_at,
    };
    try {
      const hourly =
        series.find((row) => row.seriesID === seriesId(job, "08"))?.data ?? [];
      const annual =
        series.find((row) => row.seriesID === seriesId(job, "13"))?.data ?? [];
      const years = [
        ...new Set(
          series.flatMap((row) =>
            (row.data ?? [])
              .filter((point) => point.period === "A01")
              .map((point) => Number(point.year)),
          ),
        ),
      ];
      const year = Math.max(...years);
      const value = (rows) =>
        Number(
          rows
            .find(
              (point) => Number(point.year) === year && point.period === "A01",
            )
            ?.value?.replaceAll(",", ""),
        );
      let amount = value(hourly);
      if (!Number.isFinite(amount) || amount <= 0)
        amount = value(annual) / 2080;
      if (
        !Number.isInteger(year) ||
        year > now.getUTCFullYear() ||
        year < job.wage_year ||
        amount < 5 ||
        amount > 200 ||
        !Number.isFinite(amount)
      )
        throw new Error("Invalid wage observation");
      wages.push({
        ...old,
        hourly: money(amount),
        year,
        sourceUrl: "https://data.bls.gov/timeseries/" + seriesId(job, "08"),
        lastSyncedAt: now.toISOString(),
      });
      freshness[key] = {
        label: job.title + " wage",
        status: "current",
        checkedAt: now.toISOString(),
        lastSuccessfulAt: now.toISOString(),
        observationPeriod: String(year),
      };
    } catch {
      wages.push(old);
      freshness[key] = {
        label: job.title + " wage",
        status: "carried_forward",
        checkedAt: now.toISOString(),
        lastSuccessfulAt: job.last_synced_at,
        observationPeriod: String(job.wage_year),
      };
      warnings.push({ source: key, message: "Retained published wage" });
    }
  }
  return { wages, freshness, warnings };
}

export async function refreshCatalog(input, env, options = {}) {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? new Date();
  const result = structuredClone(input);
  const errors = [];
  const warnings = [];
  const observations = {};
  const sources = {};
  const prior = options.previousCatalog;
  const freshness = {};
  const fatal = [];
  const request = async (url, init = {}) => {
    let response;
    try {
      response = await fetcher(url, {
        ...init,
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new Error("Provider network request failed");
    }
    if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
    try {
      return await response.json();
    } catch {
      throw new Error("Provider returned an unreadable response");
    }
  };
  const attempt = async (source, callback, required = true) => {
    try {
      sources[source] = await callback();
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Source unavailable";
      const messages = required ? errors : warnings;
      messages.push({ source, message: reason });
    }
  };
  const cpiIds = [
    ...new Set([
      "CUUR0000SA0",
      ...Object.values(result.bindings)
        .filter((b) => b.source === "cpi" && b.amount > 0)
        .map((b) => b.series),
      ...result.cards.flatMap((c) =>
        c.facts
          .filter(
            (f) => f.role === "general" && f.semantic_key.startsWith("cpi:"),
          )
          .map((f) => "CUUR0000" + f.semantic_key.split(":")[1]),
      ),
    ]),
  ];
  const blsRequest = attempt("bls", async () => {
    for (let offset = 0; offset < cpiIds.length; offset += 20) {
      const body = await request(endpoints.bls, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesid: cpiIds.slice(offset, offset + 20),
          startyear: String(
            Math.min(
              Number(input.baselinePeriod.slice(0, 4)),
              now.getUTCFullYear() - 2,
            ),
          ),
          endyear: String(now.getUTCFullYear()),
          ...(env.BLS_API_KEY ? { registrationkey: env.BLS_API_KEY } : {}),
        }),
      });
      if (body.status !== "REQUEST_SUCCEEDED")
        throw new Error("BLS rejected request");
      for (const series of body.Results?.series ?? [])
        observations[series.seriesID] = monthlyCpi(series.data);
    }
    return { series: cpiIds.length, source: endpoints.bls };
  });
  const rentcastRequest = attempt("rentcast", async () => {
    const markets = [];
    const failures = [];
    for (const zipCode of input.rentZipCodes) {
      try {
        let market = options.rentcastZipCache?.[zipCode];
        if (!market) {
          if (!env.RENTCAST_API_KEY) throw new Error("Set RENTCAST_API_KEY");
          if (options.rentcastAttemptedZips?.includes(zipCode))
            throw new Error(
              "Monthly request already used and no cached response available",
            );
          if ((await options.beforeRentcast?.(zipCode)) === false)
            throw new Error("Monthly request allowance is already used");
          const url = new URL(endpoints.rentcast);
          url.searchParams.set("zipCode", zipCode);
          url.searchParams.set("dataType", "Rental");
          const body = await request(url, {
            headers: { "X-Api-Key": env.RENTCAST_API_KEY },
          });
          market = rentcastMarket(body, zipCode);
          await options.saveRentcast?.(zipCode, market);
        }
        markets.push(
          rentcastMarket(
            { zipCode: market.zipCode, rentalData: market },
            zipCode,
          ),
        );
      } catch (error) {
        failures.push(zipCode + ": " + error.message);
      }
    }
    if (failures.length) throw new Error(failures.join("; "));
    return weightedRents(markets, input.rentHouseholds);
  });
  const electricityRequest = attempt("electricity", async () => {
    if (!env.EIA_API_KEY) throw new Error("Set EIA_API_KEY");
    const url = new URL(endpoints.eia);
    for (const [key, value] of Object.entries({
      api_key: env.EIA_API_KEY,
      frequency: "monthly",
      "data[0]": "revenue",
      "data[1]": "customers",
      "facets[stateid][]": "GA",
      "facets[sectorid][]": "RES",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      length: "1",
    }))
      url.searchParams.set(key, value);
    const body = await request(url);
    const row = body.response?.data?.[0];
    return { amount: electricityBill(row ?? {}), period: row.period };
  });
  const censusRequest = attempt(
    "census",
    () => fetchCensusFacts(env, { now, fetcher }),
    false,
  );
  const wageRequest = refreshWages(request, options.jobs ?? [], env, now);
  await Promise.all([
    blsRequest,
    rentcastRequest,
    electricityRequest,
    censusRequest,
  ]);
  const wageResult = await wageRequest;
  result.wages = wageResult.wages;
  Object.assign(freshness, wageResult.freshness);
  warnings.push(...wageResult.warnings);
  const values = {};
  for (const [key, binding] of Object.entries(result.bindings)) {
    let resolvedSeries = binding.series;
    try {
      let amount = binding.amount;
      if (binding.source === "cpi" && amount > 0) {
        try {
          amount = cpiPrice(
            amount,
            observations[binding.series] ?? [],
            binding.baselinePeriod,
          );
        } catch {
          resolvedSeries = "CUUR0000SA0";
          amount = cpiPrice(
            amount,
            observations.CUUR0000SA0 ?? [],
            binding.baselinePeriod,
          );
          warnings.push({
            source: key,
            message:
              "Used general all-items CPI because the category observation was unavailable",
          });
        }
      }
      if (binding.source === "eia")
        amount = positive(sources.electricity?.amount, "electricity bill");
      if (binding.source === "rentcast") {
        if (!sources.rentcast) throw new Error("RentCast rents unavailable");
        result.rents = sources.rentcast.rents;
      }
      values[key] = money(amount);
      const observationPeriod =
        binding.source === "cpi"
          ? (observations[resolvedSeries]?.[0]?.period ??
            observations.CUUR0000SA0?.[0]?.period)
          : binding.source === "eia"
            ? sources.electricity?.period
            : Object.values(sources.rentcast?.observationDates ?? {}).sort()[0];
      freshness[key] = {
        label: priceLabel(input, key),
        status: binding.amount === 0 ? "fixed" : "current",
        checkedAt: now.toISOString(),
        lastSuccessfulAt: binding.amount === 0 ? null : now.toISOString(),
        observationPeriod,
      };
    } catch (error) {
      errors.push({ source: key, message: error.message });
      try {
        values[key] = previousPrice(prior, key);
        if (binding.source === "rentcast") {
          const rents = prior?.rents ?? prior?.provisionalRents;
          if (
            !rents ||
            Object.values(rents).some(
              (value) => !Number.isFinite(value) || value <= 0,
            )
          )
            throw new Error("No published rent allocation");
          result.rents = structuredClone(rents);
        }
        freshness[key] = {
          label: priceLabel(input, key),
          status: "carried_forward",
          checkedAt: now.toISOString(),
          lastSuccessfulAt:
            prior?.freshness?.[key]?.lastSuccessfulAt ??
            options.previousPublishedAt ??
            null,
          observationPeriod: prior?.freshness?.[key]?.observationPeriod ?? null,
        };
      } catch {
        fatal.push(key);
      }
    }
  }
  result.clothing = values.clothing ?? input.clothing;
  result.taxFee = values["tax-fee"] ?? input.taxFee;
  result.refunds = Object.fromEntries(
    Object.keys(input.refunds).map((name) => [
      name,
      values[`tax:${name}`] ?? input.refunds[name],
    ]),
  );
  for (const card of result.cards) {
    if (card.bill) {
      card.bill.amount = values[`${card.key}:bill`] ?? card.bill.amount;
      card.bill.fee = values[`${card.key}:fee`] ?? card.bill.fee;
    }
    for (const choice of card.choices) {
      if (card.key === "D005") {
        choice.upfront_cost = choice.key === "PAID" ? result.taxFee : 0;
        choice.refunds = result.refunds ?? null;
        // The publisher resolves the fixed simulation credit for each household.
      } else if (values[choice.key] !== undefined)
        choice.amount = -values[choice.key];
    }
    for (const fact of card.facts) {
      if (fact.role !== "general") continue;
      const priorFact = options.previousCatalog?.cards
        ?.find((previous) => previous.key === card.key)
        ?.facts.find(
          (previous) =>
            previous.role === fact.role &&
            previous.semantic_key === fact.semantic_key,
        );
      if (fact.template.includes("{") && priorFact?.copy_kind === "fact") {
        fact.text = priorFact.text;
        fact.copy_kind = priorFact.copy_kind;
      }
      if (fact.semantic_key.startsWith("cpi:")) {
        try {
          fact.text = cpiFact(
            fact,
            observations["CUUR0000" + fact.semantic_key.split(":")[1]] ?? [],
          );
          fact.copy_kind = "fact";
        } catch {
          warnings.push({
            source: card.key,
            message: "CPI fact retained as context",
          });
        }
      }
      if (card.key === "D007" && sources.electricity) {
        fact.text = fact.template
          .replaceAll("{period}", sources.electricity.period)
          .replaceAll("{monthly_bill}", sources.electricity.amount.toFixed(2));
        fact.copy_kind = "fact";
      }
    }
  }
  result.freshness = freshness;
  applyCensusFacts(
    result,
    sources.census,
    options.previousCatalog,
    now.toISOString(),
  );
  result.checkedAt = now.toISOString();
  return {
    catalog: result,
    errors,
    warnings,
    sources,
    observations,
    checkedAt: now.toISOString(),
    ready: fatal.length === 0 && (errors.length === 0 || Boolean(prior)),
  };
}
