// Shared source definitions for the edition builder and scheduled refresh.
export const taxCreditBaselines = {
  Alex: 989,
  Jordan: 1989,
  Patricia: 989,
  Sofia: 989,
};
export const baselinePeriod = "2026-10";

const categorySeries = {
  "Housing & Utilities": "SAH",
  "Food & Nutrition": "SAF11",
  "Employment & Adult Education": "SA0",
  "Essential Goods & Clothing": "SAA",
  "Childcare & Youth": "SEEB03",
  "Financial Literacy & Taxes": "SA0",
};
const priceSeries = {
  D002: "SAA",
  D004: "SAA",
  D005: "SS68023",
  D008: "SEHG01",
  D009: "SEED03",
  D010: "SEEE03",
  D011: "SETE",
  D012: "SEMC01",
  D013: "SEEB03",
  D014: "SA0",
  D015: "SETD03",
  D018: "SEHF02",
  D020: "SEMC01",
  D021: "SETD",
  D022: "SEMC02",
  D024: "SETG",
  D025: "SEEB03",
  D026: "SETC01",
  D027: "SEAE",
  D028: "SEHP",
  D029: "SEMC04",
  D030: "SEEE01",
  D031: "SETD02",
  D032: "SEHA",
  D033: "SEHK",
  D034: "SEHJ01",
  D035: "SAF11",
  D036: "SAF11",
  D037: "SETG",
  D038: "SEGD03",
  D039: "SA0",
  D040: "SAA",
  D041: "SEFV",
  D042: "SEEA",
  D043: "SS33032",
  D044: "SETG",
  D045: "SEAD",
  D046: "SAF11",
  D047: "SEGE",
  D048: "SEFV03",
  D049: "SS68021",
  D050: "SEGB",
  D051: "SERF03",
  D052: "SS02041",
  D053: "SEFF02",
  D054: "SA311",
  D055: "SA0",
  D056: "SERE01",
  D058: "SEHN01",
  D059: "SEFV",
  D060: "SAF11",
};
const revisedCents = {
  "D025-AGENCY": -12996,
  "D025-SHORT": -6498,
  "D034-FULL": -27999,
  "D037-TRANSIT": -500,
  "D044-TRANSIT": -500,
  "D038-FULL": -400,
  "D038-SMALL": -250,
  "D057-PASS": -2375,
  "D057-FARES": -1000,
};
const bills = {
  D006: { day: 6, amount: 1387, fee: 35, source: "rentcast" },
  D007: { day: 12, amount: 145, fee: 10, source: "eia" },
  D008: { day: 27, amount: 68, fee: 8 },
  D009: { day: 16, amount: 100, fee: 5 },
  D010: { day: 23, amount: 65, fee: 7 },
  D011: { day: 4, amount: 130, fee: 0 },
  D012: { day: 7, amount: 190, fee: 0 },
  D013: { day: 8, amount: 260, fee: 25 },
  D014: { day: 14, amount: 62, fee: 0 },
  D015: { day: 11, amount: 240, fee: 0 },
  D018: { day: 29, amount: 75, fee: 9 },
  D020: { day: 21, amount: 320, fee: 0 },
};

export function buildCatalog(library) {
  const bindings = {};
  const bind = (key, amount, series, source = "cpi") => {
    bindings[key] = {
      amount,
      series: `CUUR0000${series}`,
      source,
      baselinePeriod,
    };
    return amount;
  };
  const cards = library.cards.map((card) => {
    const series = priceSeries[card.key] ?? categorySeries[card.category];
    const bill = bills[card.key];
    const compiled = {
      key: card.key,
      title: card.title,
      category: card.category,
      engine: card.engine,
      intent: card.personaIntent === "CAR" ? "ALL" : card.personaIntent,
      description: card.situation,
      choices:
        card.engine === "ordinary"
          ? card.choices.map((choice) => {
              let amount =
                (revisedCents[choice.key] ?? choice.draftCents ?? 0) / 100;
              if (card.key === "D005")
                amount =
                  choice.key === "PAID"
                    ? taxCreditBaselines.Alex - 250
                    : choice.key === "CAC"
                      ? taxCreditBaselines.Alex
                      : 0;
              if (amount && card.key !== "D005")
                bind(
                  choice.key,
                  Math.abs(amount),
                  ["D021-TRANSIT", "D044-TRANSIT"].includes(choice.key)
                    ? "SA0"
                    : series,
                );
              return {
                key: choice.key,
                text: choice.text,
                response: choice.responseText,
                requires_cac: choice.requiresCac,
                amount,
                upfront_cost:
                  card.key === "D005" && choice.key === "PAID" ? 250 : 0,
              };
            })
          : [],
      facts: ["general", "cac"].flatMap((role) => {
        const fact = card[role === "general" ? "generalFact" : "cacFact"];
        if (!fact.text) return [];
        return [
          {
            role,
            text: fact.hasUnresolvedTokens
              ? fact.text.split(/(?<=[.!?])\s+/)[0]
              : fact.text,
            template: fact.text,
            semantic_key: fact.semanticKey,
            copy_kind: fact.hasUnresolvedTokens ? "context" : "fact",
            source_url: fact.sourceUrls[0] ?? "https://ourcac.org/",
            evidence: fact.evidenceNotes,
          },
        ];
      }),
    };
    if (bill) {
      compiled.bill = { ...bill };
      bind(`${card.key}:bill`, bill.amount, series, bill.source ?? "cpi");
      bind(`${card.key}:fee`, bill.fee, "SA0");
    }
    return compiled;
  });
  bind("clothing", 60, "SAA");
  bind("tax-fee", 250, "SS68023");
  for (const [name, amount] of Object.entries(taxCreditBaselines))
    bind(`tax:${name}`, amount, "SA0");
  return {
    schemaVersion: 1,
    startingBalances: { Alex: 1500 },
    refreshPolicy: "monthly-carry-forward-v4",
    rentZipCodes: ["30327", "30328", "30338", "30342", "30346", "30350"],
    revision: "facts-fixes-20261116",
    baselinePeriod,
    sourceHash: library.sourceHash,
    cards,
    bindings,
    rentHouseholds: {
      Alex: { bedrooms: 1, share: 0.5 },
      Sofia: { bedrooms: 2, share: 0.5 },
      Jordan: { bedrooms: 2, share: 1 },
      Patricia: { bedrooms: 1, share: 1 },
    },
    provisionalRents: {
      Alex: 693.5,
      Sofia: 868.5,
      Jordan: 1737,
      Patricia: 1387,
    },
    clothing: 60,
    taxFee: 250,
    taxRefund: 989,
    refunds: taxCreditBaselines,
    taxPolicy:
      "CPI-adjusted simulation credit, with a $1000 baseline child-household supplement for Jordan",
  };
}
