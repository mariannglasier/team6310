import catalog from "../_shared/game-data-catalog.json" with { type: "json" };
import { refreshCatalog } from "../_shared/game-data.mjs";

const headers = { "Content-Type": "application/json" };
const reply = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers });
async function authorized(request: Request) {
  const expected = Deno.env.get("GAME_DATA_REFRESH_TOKEN");
  const supplied = request.headers.get("x-refresh-token") ?? "";
  if (supplied.length < 32 || supplied.length > 1024) return false;
  if (!expected || expected.length < 32) return authorizedByVault(supplied);
  const encode = new TextEncoder();
  const left = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encode.encode(expected)),
  );
  const right = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encode.encode(supplied)),
  );
  const matches =
    left.reduce(
      (difference, byte, index) => difference | (byte ^ right[index]),
      0,
    ) === 0;
  return matches || authorizedByVault(supplied);
}

async function authorizedByVault(token: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return false;
  try {
    const response = await fetch(
      `${url}/rest/v1/rpc/verify_game_data_refresh_token`,
      {
        method: "POST",
        headers: { ...headers, apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ p_token: token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    return response.ok && (await response.json()) === true;
  } catch {
    return false;
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply({ error: "Use POST" }, 405);
  if (!(await authorized(request)))
    return reply({ error: "Maintenance authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key)
    return reply({ error: "Supabase runtime credentials unavailable" }, 503);
  const admin = async (resource: string, method = "GET", body?: unknown) => {
    const response = await fetch(`${url}/rest/v1/${resource}`, {
      method,
      headers: {
        ...headers,
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=representation",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("Unable to persist source refresh");
    return response.status === 204 ? null : response.json();
  };
  const period = new Date().toISOString().slice(0, 7);
  const row = `game_data_refresh_runs?period=eq.${period}`;
  let claimed = false;
  try {
    const raw = await request.text();
    if (raw.length > 1024) return reply({ error: "Request too large" }, 413);
    const body = raw ? JSON.parse(raw) : {};
    if (body.dryRun !== undefined && typeof body.dryRun !== "boolean")
      return reply({ error: "dryRun must be boolean" }, 400);
    const dryRun = body.dryRun !== false;
    const previous = (await admin(`${row}&select=*`))[0];
    if (
      previous?.status === "published" &&
      previous.result?.catalog?.refreshPolicy === catalog.refreshPolicy
    )
      return reply({
        status: "unchanged",
        versionId: previous.published_version,
      });
    claimed = await admin("rpc/claim_game_data_refresh_for_policy", "POST", {
      p_period: period,
      p_policy: catalog.refreshPolicy,
    });
    if (!claimed) return reply({ error: "Another refresh is running" }, 409);
    const latest = (
      await admin(
        "content_versions?status=eq.published&order=version_number.desc&limit=1&select=version_id,published_at",
      )
    )[0];
    const previousEdition = (
      await admin(
        `scenario_edition_prices?version_id=eq.${latest.version_id}&select=source_snapshot`,
      )
    )[0];
    const jobs = await admin(
      `jobs?version_id=eq.${latest.version_id}&select=soc_code,title,area_code,median_hourly_wage,wage_year,wage_source_url,last_synced_at`,
    );
    const env = Object.fromEntries(
      ["BLS_API_KEY", "EIA_API_KEY", "RENTCAST_API_KEY", "CENSUS_API_KEY"].map(
        (name) => [name, Deno.env.get(name)],
      ),
    );
    const zipCacheRows = await admin(
      `rentcast_monthly_zip_cache?period=eq.${period}&select=zip_code,cache`,
    );
    const result =
      previous?.status === "ready" &&
      previous.result?.ready &&
      previous.result.catalog?.refreshPolicy === catalog.refreshPolicy
        ? previous.result
        : await refreshCatalog(catalog, env, {
            previousCatalog: previousEdition?.source_snapshot,
            previousPublishedAt: latest.published_at,
            jobs,
            rentcastZipCache: Object.fromEntries(
              zipCacheRows
                .filter((entry: { cache: unknown }) => entry.cache)
                .map((entry: { zip_code: string; cache: unknown }) => [
                  entry.zip_code,
                  entry.cache,
                ]),
            ),
            rentcastAttemptedZips: zipCacheRows.map(
              (entry: { zip_code: string }) => entry.zip_code,
            ),
            beforeRentcast: (zipCode: string) =>
              admin("rpc/claim_rentcast_zip_request", "POST", {
                p_period: period,
                p_zip_code: zipCode,
              }),
            saveRentcast: (zipCode: string, value: unknown) =>
              admin(
                `rentcast_monthly_zip_cache?period=eq.${period}&zip_code=eq.${zipCode}`,
                "PATCH",
                { cache: value },
              ),
          });
    await admin(row, "PATCH", {
      status: result.ready ? "ready" : "blocked",
      result,
    });
    if (!result.ready)
      return reply(
        { status: "blocked", errors: result.errors, warnings: result.warnings },
        424,
      );
    if (dryRun)
      return reply({
        status: "ready",
        dryRun,
        cards: result.catalog.cards.length,
        warnings: result.warnings,
      });
    const versionId = await admin(
      "rpc/publish_scenario_source_edition",
      "POST",
      { p_catalog: result.catalog },
    );
    await admin(row, "PATCH", {
      status: "published",
      published_version: versionId,
    });
    return reply({ status: "published", versionId, warnings: result.warnings });
  } catch {
    if (claimed)
      await admin(row, "PATCH", { status: "blocked" }).catch(() => {});
    return reply(
      {
        error:
          "Source refresh could not complete. Check the private refresh record and function logs.",
      },
      500,
    );
  }
});
