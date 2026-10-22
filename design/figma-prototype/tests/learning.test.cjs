const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const ts = require("typescript")

for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    module._compile(
      ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    )
  }
}
require.extensions[".css"] = () => {}
require.extensions[".png"] = (module) => {
  module.exports = "cac-logo.png"
}

const {
  calculateLearningBudget,
  learningTopics,
  learningSources,
} = require("../src/learningData.ts")

test("budget starts with $450 available and accounts for emergency expenses", () => {
  assert.equal(calculateLearningBudget(3000, 1200, 0, false).remaining, 450)
  assert.equal(calculateLearningBudget(3000, 1200, 400, false).remaining, 50)
})

test("illustrative food support frees $150 without changing other expenses", () => {
  const without = calculateLearningBudget(3000, 1200, 400, false)
  const withSupport = calculateLearningBudget(3000, 1200, 400, true)
  assert.equal(withSupport.remaining - without.remaining, 150)
  assert.deepEqual(
    withSupport.expenses.filter((item) => item.label !== "Food"),
    without.expenses.filter((item) => item.label !== "Food"),
  )
})

test("budget handles shortfalls and balances all slider extremes", () => {
  for (const income of [1800, 5000])
    for (const rent of [600, 2400]) {
      const result = calculateLearningBudget(income, rent, 400, false)
      assert.equal(result.total + result.remaining, income)
      assert.equal(
        result.total,
        result.expenses.reduce((sum, expense) => sum + expense.amount, 0),
      )
    }
  assert.ok(calculateLearningBudget(1800, 2400, 400, false).remaining < 0)
})

test("each research visualization has a valid source and percentage", () => {
  for (const topic of learningTopics) {
    assert.ok(topic.value >= 0 && topic.value <= 100)
    assert.ok(learningSources[topic.source].url.startsWith("https://"))
    assert.ok(topic.qualifier && topic.connection && topic.chartLabel)
  }
})

test("learning page renders accessible charts, controls, sources, and model caveats", () => {
  const React = require("react")
  const { renderToStaticMarkup } = require("react-dom/server")
  const Page = require("../src/LearningExplorer.tsx").default
  const html = renderToStaticMarkup(
    React.createElement(Page, { onBack: () => {} }),
  )
  assert.match(html, /Real-life pressures/)
  assert.match(html, /aria-label="37 out of every 100 adults/)
  assert.match(html, /id="learn-income"/)
  assert.match(html, /id="learn-rent"/)
  assert.match(html, /Teaching example only/)
  assert.match(html, /Sources &amp; how to read this page/)
  assert.match(html, /aria-pressed="true"/)
  assert.doesNotMatch(html, />Play<\/button>/)
})
