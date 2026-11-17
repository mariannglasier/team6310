import fs from "node:fs";
import path from "node:path";

const root = new URL("../", import.meta.url).pathname.replace(
  /^\/(?:([A-Za-z]:))/,
  "$1",
);
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const library = JSON.parse(read("docs/data/scenario-library-draft.json"));
const sql = read("supabase/content/scenario-library-facts-fixes.sql");
const edition = JSON.parse(sql.split("$library$")[1]);
const sourcing = read("docs/scenario-data-sourcing.md").replaceAll(
  "\r\n",
  "\n",
);
const snapshot = JSON.parse(read("docs/data/cac-service-facts-2025.json"));
const employmentSql = read(
  "supabase/migrations/20261103000000_employment_gameplay.sql",
);
const clothingPrice = Number(
  employmentSql.match(/cost:=case choice when 'purchase' then ([\d.]+)/)?.[1],
);
if (!Number.isFinite(clothingPrice))
  throw new Error("Clothing price not found");

const sourceSections = new Map();
const sections = [...sourcing.matchAll(/^### (D\d{3}) [^\n]+/gm)];
for (let i = 0; i < sections.length; i++) {
  const section = sourcing.slice(
    sections[i].index,
    sections[i + 1]?.index ?? sourcing.length,
  );
  sourceSections.set(sections[i][1], section.split(/\n## /)[0].trim());
}
const settings = JSON.parse(
  read("supabase/functions/_shared/game-data-catalog.json"),
);
const scheduled = settings.cards.filter((card) => card.bill);
const dueDays = new Map(scheduled.map((card) => [card.key, card.bill.day]));
const billAmounts = new Map(
  scheduled.map((card) => [card.key, card.bill.amount]),
);
const billFees = new Map(scheduled.map((card) => [card.key, card.bill.fee]));
const rents = Object.entries(settings.provisionalRents);
const dollars = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
const unique = (items) => [...new Set(items)];
const numbers = (text) =>
  unique(
    (text ?? "").match(
      /(?:[+-]?\$\s*)?\b\d[\d,]*(?:\.\d+)?(?:\s*(?:%|percent|million|billion))?|\b(?:half|third|quarter|one|two|three|four|five|six|seven|eight|nine|ten|first|second)\b/gi,
    ) ?? [],
  );
const tokens = (text) => unique((text ?? "").match(/\{[^}]+\}/g) ?? []);
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
const safeUrl = (url) => (/^https:\/\//.test(url) ? url : "");
const displayList = (items, empty) =>
  items.length ? items.join(" · ") : empty;

const records = library.cards.map((card) => {
  const compiled = edition.find((item) => item.key === card.key);
  if (!compiled) throw new Error(`Missing edition card ${card.key}`);
  const priceNotes = [];
  if (dueDays.has(card.key)) {
    const principal =
      card.key === "D006"
        ? rents
            .map(([household, amount]) => `${household} ${dollars(amount)}`)
            .join("; ")
        : dollars(billAmounts.get(card.key));
    priceNotes.push(
      `Development bill principal — ${principal}. Due Day ${dueDays.get(card.key)}. One-time Ignore late fee ${dollars(billFees.get(card.key))}.`,
    );
    priceNotes.push(
      "The development bill controls offer Pay and Ignore. Later settlement includes principal plus any incurred fee. CAC bill settlement remains unfinished. Monthly source bindings are listed in scenario-source-bindings.md.",
    );
  } else if (card.engine === "bill") {
    priceNotes.push(
      "No separate bill occurrence is created for this logical card by the development edition artifact. Read the draft choices and source notes below.",
    );
  }
  if (card.key === "D002" || card.key === "D004") {
    priceNotes.push(
      `Employment engine clothing purchase ${dollars(clothingPrice)}. Current clothes, CAC clothing, and reuse have ${dollars(0)} immediate cash cost when eligible. Owned professional clothes are reused without a second purchase.`,
    );
  }
  if (card.key === "D001" || card.key === "D003") {
    priceNotes.push(
      "Application has no immediate wage payment. Future weekly gross income comes from the selected edition’s approved job wage and configured weekly hours. Individual job amounts are loaded from the database and are not contained in this 60-card artifact.",
    );
  }
  if (card.key === "D005") {
    priceNotes.push(
      "Tax preparation starts at $250.00 upfront and follows CPI. PolicyEngine will supply the household EITC after credentials and the refresh are installed. This baseline artifact still uses the provisional $1,000.00 credit. The IRS recipient-average fact is a separate measure.",
    );
  }
  const facts = ["general", "cac"].map((role) => {
    const authored = card[role === "general" ? "generalFact" : "cacFact"];
    const current = compiled.facts.find((fact) => fact.role === role);
    const stored = snapshot.facts.find(
      (fact) =>
        current &&
        (fact.fact_id === current.semantic_key ||
          `cac:${fact.service_key}:${fact.fact_key}` === current.semantic_key),
    );
    return { role, authored, current, stored };
  });
  return { card, compiled, priceNotes, facts };
});

function factMarkdown(fact) {
  const title = fact.role === "general" ? "General fact" : "CAC fact";
  const { authored, current, stored } = fact;
  return [
    `#### ${title}`,
    "",
    `**Development edition text** (${current?.copy_kind ?? "unavailable"})`,
    "",
    current?.text ??
      "No topic-matched fact is included in this development edition.",
    "",
    `Numbers in that text — ${displayList(numbers(current?.text), "No explicit numeric value.")}`,
    ...(stored
      ? [
          `Snapshot value — ${stored.value} ${stored.unit}. Reporting year ${stored.reporting_year}. Measure — ${stored.fact_title}.`,
        ]
      : []),
    "",
    "**Authored full fact or template**",
    "",
    authored.text ?? "Awaiting a supported topic-matched observation.",
    "",
    `Numbers in authored text — ${displayList(numbers(authored.text), "No explicit numeric value.")}`,
    `Unresolved fields — ${displayList(tokens(authored.text), "None.")}`,
    `Data binding — ${authored.semanticKey || "Not assigned."}`,
    `Sources — ${displayList(unique([...(authored.sourceUrls ?? []), ...(current ? [current.source_url] : [])]), "See evidence notes.")}`,
    "",
    "<details><summary>Source evidence and update method</summary>",
    "",
    authored.evidenceNotes,
    "",
    "</details>",
    "",
  ].join("\n");
}
const md = [
  "# Scenario prices and fact numbers",
  "",
  "Prepared November 16, 2026. All 51 logical scenario cards are included.",
  "",
  "This inventory compares the authored draft with the checked-in development SQL artifact. Development amounts are provisional where documented. The full fact templates retain unresolved fields. The development edition uses shorter context copy where observations remain pending. The source fact-verification flags remain historical review flags. These changes are prepared for deployment. Runtime database values were not queried.",
  "",
  "Numbers listed under facts include years, counts, percentages, currency, and written numeric terms. Read the full sentence to identify the measure and population. Source URLs and binding identifiers are shown separately.",
  "",
  "Use Find to search a scenario ID, subject, dollar amount, fact number, or source. The accompanying HTML provides search and filters.",
  "",
  "## Scenario index",
  "",
  ...records.map(
    ({ card }) => `- [${card.key} ${card.title}](#${card.key.toLowerCase()})`,
  ),
  "",
  ...records.map(({ card, compiled, priceNotes, facts }) =>
    [
      `<a id="${card.key.toLowerCase()}"></a>`,
      `## ${card.key} ${card.title}`,
      "",
      `Category — ${card.category}. Household scope — ${card.personaIntent}. Engine — ${card.engine}.`,
      "",
      card.situation,
      "",
      `Eligibility — ${card.eligibility}`,
      "",
      `Authored timing — ${card.timing}`,
      "",
      "### Prices fees and outcomes",
      "",
      ...priceNotes.flatMap((note) => [note, ""]),
      ...card.choices.map((choice) => {
        const actual = compiled.choices.find((item) => item.key === choice.key);
        return [
          `**${choice.key} — ${choice.text}**`,
          "",
          `Authored financial expression — ${choice.draftExpression}`,
          "",
          ...(actual
            ? [
                `Development balance change — ${actual.amount > 0 ? "+" : ""}${dollars(actual.amount)}. Upfront requirement — ${dollars(actual.upfront_cost)}. CAC-only — ${actual.requires_cac ? "Yes" : "No"}.`,
                "",
              ]
            : []),
          `Outcome — ${choice.outcome ?? "See response and engine rules."}`,
          "",
          `Response — ${choice.responseText}`,
          "",
        ].join("\n");
      }),
      `Baseline and price notes — ${card.baselineNotes}`,
      "",
      ...facts.map(factMarkdown),
      "<details><summary>Complete scenario sourcing section</summary>",
      "",
      sourceSections.get(card.key) ?? "No source section found.",
      "",
      "</details>",
      "",
    ].join("\n"),
  ),
  "## Source files",
  "",
  "- [Structured authored library](data/scenario-library-draft.json)",
  "- [Development SQL artifact](../supabase/content/scenario-library-development.sql)",
  "- [Scenario source research and financial components](scenario-data-sourcing.md)",
  "- [CAC 2025 fact snapshot](data/cac-service-facts-2025.json)",
  "- [Employment engine SQL](../supabase/migrations/20261103000000_employment_gameplay.sql)",
  "",
].join("\n");

function factHtml(fact) {
  const { authored, current, stored } = fact;
  const sourceUrls = unique([
    ...(authored.sourceUrls ?? []),
    ...(current ? [current.source_url] : []),
  ]);
  return `<section class="fact"><h3>${fact.role === "general" ? "General fact" : "CAC fact"}</h3>
    <p class="label">Development edition · ${escape(current?.copy_kind ?? "unavailable")}</p>
    <p>${escape(current?.text ?? "Awaiting a supported topic-matched fact.")}</p>
    <p class="numbers"><b>Numbers</b> ${escape(displayList(numbers(current?.text), "No explicit numeric value."))}</p>
    ${stored ? `<p><b>Snapshot measure</b> ${escape(stored.fact_title)}<br><b>Value</b> ${escape(stored.value)} ${escape(stored.unit)}<br><b>Reporting year</b> ${stored.reporting_year}</p>` : ""}
    <details ${authored.hasUnresolvedTokens || !current || authored.text !== current.text ? "open" : ""}><summary>Full authored fact or template</summary>
      <p>${escape(authored.text ?? "Awaiting a supported topic-matched observation.")}</p>
      <p class="numbers"><b>Numbers</b> ${escape(displayList(numbers(authored.text), "No explicit numeric value."))}</p>
      <p><b>Unresolved fields</b> ${escape(displayList(tokens(authored.text), "None."))}</p>
      <p><b>Data binding</b> <code>${escape(authored.semanticKey || "Not assigned")}</code></p>
    </details>
    ${sourceUrls.map((url) => `<p class="source"><a href="${escape(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${escape(url)}</a></p>`).join("")}
    <details><summary>Evidence and update method</summary><pre>${escape(authored.evidenceNotes)}</pre></details>
  </section>`;
}
const cardsHtml = records
  .map(({ card, compiled, priceNotes, facts }) => {
    const choices = card.choices
      .map((choice) => {
        const current = compiled.choices.find(
          (item) => item.key === choice.key,
        );
        return `<section class="choice"><h4>${escape(choice.key)} · ${escape(choice.text)}</h4>
      <p><b>Authored financial expression</b> ${escape(choice.draftExpression)}</p>
      ${current ? `<p class="amount"><b>Development balance change</b> ${current.amount > 0 ? "+" : ""}${dollars(current.amount)}<span>Upfront requirement ${dollars(current.upfront_cost)}${current.requires_cac ? " · CAC only" : ""}</span></p>` : ""}
      <p><b>Outcome</b> ${escape(choice.outcome ?? "See response and engine rules.")}</p>
      <p><b>Response</b> ${escape(choice.responseText)}</p></section>`;
      })
      .join("");
    const pending = facts.some(
      (fact) => !fact.current || fact.authored.hasUnresolvedTokens,
    );
    return `<article id="${card.key}" data-category="${escape(card.category)}" data-engine="${card.engine}" data-pending="${pending}" data-cac="${Boolean(facts[1].current)}">
    <header><p class="label">${escape(card.category)} · ${escape(card.personaIntent)} · ${card.engine}</p><h2>${card.key} ${escape(card.title)}</h2></header>
    <p class="situation">${escape(card.situation)}</p>
    <details><summary>Eligibility and timing</summary><p>${escape(card.eligibility)}</p><p>${escape(card.timing)}</p></details>
    <h3>Prices fees and outcomes</h3>
    ${priceNotes.map((note) => `<p class="note">${escape(note)}</p>`).join("")}
    ${choices}
    <details><summary>Price baseline and source notes</summary><p>${escape(card.baselineNotes)}</p></details>
    <div class="facts">${facts.map(factHtml).join("")}</div>
    <details><summary>Complete scenario sourcing section</summary><pre>${escape(sourceSections.get(card.key))}</pre></details>
    <p class="back"><a href="#top">Back to search</a></p></article>`;
  })
  .join("\n");
const categories = unique(records.map(({ card }) => card.category));
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scenario prices and fact numbers</title>
<style>
*{box-sizing:border-box}body{overflow-wrap:anywhere;margin:0;background:#f3f5f7;color:#17212e;font:16px/1.6 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:36px 24px}h1{font-size:36px;line-height:1.2;margin:0 0 18px}h2{font-size:27px;margin:4px 0 18px}h3{font-size:20px;margin:22px 0 10px}h4{font-size:17px;margin:0 0 10px}p{margin:10px 0}a{color:#165a94}a:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #b42318;outline-offset:3px}.intro{max-width:920px}.filters{background:white;padding:20px;border:1px solid #ccd5dd;border-radius:10px;margin:26px 0 16px;display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px}label{font-weight:650;display:block;font-size:14px}input,select,button{width:100%;font:inherit;padding:10px;border:1px solid #7a8998;border-radius:5px;background:white;color:inherit;margin-top:5px}.tools{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.tools button{width:auto;cursor:pointer;margin:0}.index{display:flex;flex-wrap:wrap;gap:6px;margin:18px 0 26px}.index a{padding:4px 9px;border:1px solid #ccd5dd;border-radius:4px;background:white;text-decoration:none;font-size:14px}article{background:white;padding:28px;border:1px solid #ccd5dd;border-radius:10px;margin:24px 0;scroll-margin-top:20px}.label{text-transform:uppercase;letter-spacing:.04em;font-size:12px;font-weight:700;color:#536478}.situation{font-size:18px}.choice{border-left:4px solid #38779a;background:#f7fafc;padding:18px;margin:14px 0}.amount{font-size:18px}.amount span{display:block;font-size:14px;color:#435568}.facts{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:24px 0}.fact{border:1px solid #cfdae4;padding:20px;border-radius:7px;min-width:0}.fact h3{margin-top:0}.numbers{background:#edf3f7;padding:9px 12px;border-radius:4px}.note{background:#fff7e8;padding:12px 16px;border-left:3px solid #aa6b13}summary{cursor:pointer;font-weight:650;padding:8px 0}details{margin:10px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.65 system-ui,sans-serif;background:#f5f7f9;padding:16px}code{overflow-wrap:anywhere}.source{font-size:13px;overflow-wrap:anywhere}.back{font-size:14px;text-align:right}[hidden]{display:none!important}footer{padding:30px 0;font-size:14px;color:#536478}@media(max-width:750px){main{padding:24px 14px}h1{font-size:29px}article{padding:18px}.facts,.filters{grid-template-columns:1fr}}@media print{body{background:white;font-size:10pt}main{max-width:none;padding:0}.filters,.tools,.index,.back{display:none}article{border:0;border-radius:0;padding:0;margin:20px 0;break-before:page}article:first-of-type{break-before:auto}.facts{display:block}.fact{margin:12px 0;break-inside:avoid}details:not([open]){display:none}.choice{break-inside:avoid}a{color:inherit}}
</style></head><body><main id="top"><h1>Scenario prices and fact numbers</h1>
<div class="intro"><p>All 51 logical scenarios, prepared November 16, 2026. Read each situation, its prices and outcomes, and both available fact passages together.</p>
<p>The authored draft and checked-in development edition contain different amounts and fact copy. Both are included here. Development amounts are provisional where documented. Unresolved template fields remain visible for API planning. Fact numbers include dates and written quantities, with their full sentences for context.</p>
<p>This inventory reads local source artifacts. Runtime database wages and household starting balances require a database export. The source fact-verification flags remain false.</p></div>
<form class="filters" onsubmit="return false"><label>Search scenarios prices facts or sources<input id="search" type="search" placeholder="Try rent, $60, 610, D014, or census"></label><label>Category<select id="category"><option value="">All categories</option>${categories.map((category) => `<option>${escape(category)}</option>`).join("")}</select></label><label>Show<select id="status"><option value="">All scenarios</option><option value="pending">Unresolved or missing fact</option><option value="cac">CAC fact available</option><option value="no-cac">CAC fact missing</option><option value="bill">Bill cards</option><option value="employment">Employment cards</option><option value="ordinary">Ordinary cards</option></select></label></form>
<div class="tools"><p id="count" role="status" aria-live="polite">51 of 51 scenarios</p><button id="expand" type="button">Expand all source notes</button><button id="collapse" type="button">Collapse all source notes</button><button type="button" onclick="window.print()">Print or save as PDF</button></div>
<nav class="index" aria-label="Jump to scenario">${records.map(({ card }) => `<a href="#${card.key}" title="${escape(card.title)}">${card.key}</a>`).join("")}</nav>
${cardsHtml}
<footer><p>Sources include the structured scenario draft, development SQL content artifact, full scenario sourcing document, CAC 2025 fact snapshot, and employment-engine SQL.</p><p>Source hash ${escape(library.sourceHash)}</p></footer></main>
<script>
const cards = [...document.querySelectorAll('article')];
const search = document.querySelector('#search');
const category = document.querySelector('#category');
const status = document.querySelector('#status');
const text = cards.map(card => card.textContent.toLowerCase());
function filter() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  cards.forEach((card, index) => {
    const state = status.value;
    const matchesStatus = !state || (state === 'pending' ? card.dataset.pending === 'true' : state === 'cac' ? card.dataset.cac === 'true' : state === 'no-cac' ? card.dataset.cac === 'false' : card.dataset.engine === state);
    const matchesQuery = /^d\\d{3}$/.test(query) ? card.id.toLowerCase() === query : !query || text[index].includes(query);
    const visible = matchesQuery && (!category.value || card.dataset.category === category.value) && matchesStatus;
    card.hidden = !visible;
    document.querySelector('.index a[href="#' + card.id + '"]').hidden = !visible;
    if (visible) count++;
  });
  document.querySelector('#count').textContent = count + ' of 51 scenarios';
}
search.addEventListener('input', filter);
category.addEventListener('change', filter);
status.addEventListener('change', filter);
document.querySelector('#expand').addEventListener('click', () => document.querySelectorAll('article:not([hidden]) details').forEach(item => item.open = true));
document.querySelector('#collapse').addEventListener('click', () => document.querySelectorAll('article details').forEach(item => item.open = false));
</script></body></html>`;

if (
  records.length !== 51 ||
  records.some(({ card }) => !sourceSections.has(card.key))
) {
  throw new Error("Incomplete scenario coverage");
}
for (const key of dueDays.keys()) {
  if (key !== "D006" && !billAmounts.has(key))
    throw new Error(`Missing principal ${key}`);
  if (!billFees.has(key)) throw new Error(`Missing fee ${key}`);
}
fs.writeFileSync(
  path.join(root, "docs/scenario-price-and-fact-inventory.md"),
  md,
);
fs.writeFileSync(
  path.join(root, "docs/scenario-price-and-fact-inventory.html"),
  html,
);
console.log(
  JSON.stringify(
    {
      cards: records.length,
      choices: records.reduce(
        (sum, record) => sum + record.card.choices.length,
        0,
      ),
      generalFacts: records.filter((record) => record.facts[0].current).length,
      cacFacts: records.filter((record) => record.facts[1].current).length,
      unresolvedGeneralTemplates: records.filter(
        (record) => record.card.generalFact.hasUnresolvedTokens,
      ).length,
      billSchedules: dueDays.size,
      outputs: [
        "docs/scenario-price-and-fact-inventory.md",
        "docs/scenario-price-and-fact-inventory.html",
      ],
    },
    null,
    2,
  ),
);
