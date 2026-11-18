import { censusVariables } from "../../supabase/functions/_shared/census-facts.mjs";
export function censusFixture() {
  const values = Object.fromEntries(
    censusVariables.map((v) => [v, v.endsWith("M") ? "2" : "10"]),
  );
  Object.assign(values, {
    NAME: "Sandy Springs city, Georgia",
    state: "13",
    place: "68516",
    B23025_001E: "100",
    B23025_003E: "100",
    B23025_005E: "5",
    B23025_007E: "25",
    B08303_001E: "100",
    B08303_012E: "2",
    B08303_013E: "3",
    B25070_001E: "100",
    B25070_011E: "20",
    B27001_001E: "1000",
    B25048_001E: "200",
    B25048_003E: "0",
    B25010_003E: "2.35",
    B08201_001E: "100",
    B08201_002E: "10",
    B17010_001E: "100",
    B17010_002E: "12",
  });
  return values;
}
export function censusResponse(url, values = censusFixture()) {
  const columns = [
    ...new URL(url).searchParams.get("get").split(","),
    "state",
    "place",
  ].reverse();
  return new Response(JSON.stringify([columns, columns.map((c) => values[c])]));
}
