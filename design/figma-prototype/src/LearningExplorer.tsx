import { createElement, useState } from "react"
import { GameButton, GameHeading, GameInput } from "./GamePrimitives"
import SimulationHeader from "./SimulationHeader"
import SimulationFooter from "./SimulationFooter"
import SetupIcon from "./SetupIcon"
import {
  calculateLearningBudget,
  cacPrograms,
  learningSources,
  learningTopics,
} from "./learningData"
import "./learning.css"

const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)

function SourceLink({
  index,
  children,
}: {
  index: number
  children?: React.ReactNode
}) {
  const source = learningSources[index]
  return createElement(
    "a",
    {
      href: source.url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "learn-source-link",
    },
    children ?? `${source.name} ↗`,
  )
}

export default function LearningExplorer({ onBack }: { onBack: () => void }) {
  const [topicIndex, setTopicIndex] = useState(0)
  const [income, setIncome] = useState(3000)
  const [rent, setRent] = useState(1200)
  const [emergency, setEmergency] = useState(0)
  const [support, setSupport] = useState(false)
  const [programIndex, setProgramIndex] = useState(0)
  const topic = learningTopics[topicIndex]
  const program = cacPrograms[programIndex]
  const budget = calculateLearningBudget(income, rent, emergency, support)
  const scale = Math.max(income, budget.total)

  function resetBudget() {
    setIncome(3000)
    setRent(1200)
    setEmergency(0)
    setSupport(false)
  }

  return (
    <div className="cac-site learning-site">
      <SimulationHeader contentId="community-learning" />
      <main id="community-learning" className="learn-main">
        <div className="learn-breadcrumb">
          THE SIMULATION, IN CONTEXT <span> / </span> COMMUNITY LEARNING
        </div>
        <section className="learn-hero" aria-labelledby="learn-title">
          <div>
            <span className="learn-eyebrow">
              <span className="learn-live-dot" /> Behind the choices
            </span>
            <GameHeading level={1} id="learn-title">
              A simulated month.
              <br />
              <span>Real-life pressures.</span>
            </GameHeading>
            <p>
              Every choice has a bigger story. Explore the realities that shape
              a household’s month—and how a community safety net can make a
              difference.
            </p>
          </div>
          <div className="learn-hero-note">
            <SetupIcon kind="support" />
            <p>
              <strong>Our neighbors. Our community.</strong>Grounded in the
              experience of supporting neighbors in Sandy Springs and Dunwoody.
            </p>
            <span>Learn · Explore · Reflect</span>
          </div>
        </section>

        <div className="learn-section-heading">
          <div>
            <span className="learn-eyebrow">01 / The bigger picture</span>
            <GameHeading>Small margins. Real consequences.</GameHeading>
          </div>
          <span className="learn-meta">
            U.S. data · 2023 <span className="learn-meta-dot" /> Sources below
          </span>
        </div>
        <div
          className="learn-topic-tabs"
          role="group"
          aria-label="Choose a fact to explore"
        >
          {learningTopics.map((item, index) => (
            <GameButton
              key={item.id}
              variant="text"
              className={`learn-topic ${
                topicIndex === index ? "is-selected" : ""
              }`}
              aria-pressed={topicIndex === index}
              onClick={() => setTopicIndex(index)}
            >
              <span className="learn-topic-number">0{index + 1}</span>
              {item.label}
              <span className="learn-topic-value">{item.display}</span>
            </GameButton>
          ))}
        </div>

        <section className="learn-fact-panel" aria-label={topic.label}>
          <div className="learn-fact-visual">
            <div className="learn-stat-line">
              <strong>{topic.display}</strong>
              <span>
                {topic.unit}
                <br />
                in 2023
              </span>
            </div>
            <svg
              className="learn-waffle"
              viewBox="0 0 316 156"
              role="img"
              aria-label={topic.chartLabel}
            >
              {Array.from({ length: 100 }, (_, index) => {
                const fraction =
                  index === Math.floor(topic.value) && topic.value % 1 !== 0
                return (
                  <g
                    key={index}
                    transform={`translate(${(index % 20) * 16}, ${Math.floor(index / 20) * 32})`}
                  >
                    <rect
                      width="12"
                      height="24"
                      rx="4"
                      className={
                        index < Math.floor(topic.value)
                          ? "learn-cell-active"
                          : "learn-cell"
                      }
                    />
                    {fraction && (
                      <rect
                        width={12 * (topic.value % 1)}
                        height="24"
                        rx="2"
                        className="learn-cell-active"
                      />
                    )}
                  </g>
                )
              })}
            </svg>
            <div className="learn-chart-legend">
              <span>
                <i className="learn-legend-dot is-active" />
                {topic.legend}
              </span>
              <span>
                <i className="learn-legend-dot" />
                {topic.remainder}
              </span>
            </div>
            <p className="learn-chart-caption">
              Each mark represents 1%. Partial marks show fractions.
            </p>
          </div>
          <div className="learn-fact-copy" aria-live="polite">
            <span className="learn-eyebrow">More than a number</span>
            <GameHeading level={3}>{topic.headline}</GameHeading>
            <p>{topic.description}</p>
            <div className="learn-connection">
              <SetupIcon kind="calendar" />
              <div>
                <strong>Where you see it in the simulation</strong>
                <p>{topic.connection}</p>
              </div>
            </div>
            <p className="learn-fineprint">{topic.qualifier}</p>
            <SourceLink index={topic.source} />
          </div>
        </section>
        <p className="learn-data-note">
          National context, not a local estimate. These findings describe
          different populations and should not be added together.
        </p>

        <section
          className="learn-budget-section"
          aria-labelledby="budget-title"
        >
          <div className="learn-section-heading">
            <div>
              <span className="learn-eyebrow">02 / Try the trade-offs</span>
              <GameHeading id="budget-title">
                How much room is left?
              </GameHeading>
            </div>
            <span className="learn-badge">
              Interactive · Illustrative budget
            </span>
          </div>
          <p className="learn-section-intro">
            Move the sliders. Add a surprise. See how quickly a month’s
            breathing room can change.
          </p>
          <div className="learn-budget-grid">
            <div className="learn-budget-controls">
              <div className="learn-slider-heading">
                <label htmlFor="learn-income">Monthly take-home income</label>
                <output htmlFor="learn-income">{dollars(income)}</output>
              </div>
              <GameInput
                id="learn-income"
                type="range"
                min={1800}
                max={5000}
                step={100}
                value={income}
                onChange={(event) => setIncome(Number(event.target.value))}
                aria-valuetext={`${dollars(income)} per month`}
              />
              <div className="learn-range-labels">
                <span>$1,800</span>
                <span>$5,000</span>
              </div>
              <div className="learn-slider-heading">
                <label htmlFor="learn-rent">Monthly housing cost</label>
                <output htmlFor="learn-rent">{dollars(rent)}</output>
              </div>
              <GameInput
                id="learn-rent"
                type="range"
                min={600}
                max={2400}
                step={50}
                value={rent}
                onChange={(event) => setRent(Number(event.target.value))}
                aria-valuetext={`${dollars(rent)} per month`}
              />
              <div className="learn-range-labels">
                <span>$600</span>
                <span>$2,400</span>
              </div>
              <fieldset className="learn-emergency">
                <legend>Add an unexpected expense</legend>
                <div>
                  {[0, 200, 400].map((amount) => (
                    <GameButton
                      key={amount}
                      variant="text"
                      className={emergency === amount ? "is-selected" : ""}
                      aria-pressed={emergency === amount}
                      onClick={() => setEmergency(amount)}
                    >
                      {amount === 0 ? "None" : `+${dollars(amount)}`}
                    </GameButton>
                  ))}
                </div>
              </fieldset>
              <label className="learn-support-toggle">
                <GameInput
                  type="checkbox"
                  checked={support}
                  onChange={(event) => setSupport(event.target.checked)}
                />
                <span>
                  <strong>Explore food support</strong>
                  <small>Model $150 less in out-of-pocket food costs</small>
                </span>
              </label>
              <GameButton
                variant="text"
                className="learn-reset"
                onClick={resetBudget}
              >
                Reset example
              </GameButton>
            </div>
            <div className="learn-budget-result">
              <div
                className="learn-balance"
                aria-live="polite"
                aria-atomic="true"
              >
                <span>
                  {budget.remaining >= 0
                    ? "LEFT AFTER ESSENTIALS"
                    : "MONTHLY SHORTFALL"}
                </span>
                <strong className={budget.remaining < 0 ? "is-negative" : ""}>
                  {dollars(budget.remaining)}
                </strong>
                <p>
                  {budget.remaining < 0
                    ? "The planned expenses exceed this month’s income."
                    : budget.remaining === 0
                      ? "Every dollar is committed. There is no cushion left."
                      : "For savings, another need, or the next unexpected cost."}
                </p>
              </div>
              <svg
                className="learn-budget-chart"
                viewBox="0 0 600 40"
                role="img"
                aria-label={`Monthly expenses ${dollars(budget.total)} out of ${dollars(income)} income. ${
                  budget.remaining >= 0 ? "Remaining" : "Shortfall"
                } ${dollars(Math.abs(budget.remaining))}.`}
              >
                {budget.expenses.map((expense, index) => (
                  <rect
                    key={expense.label}
                    x={
                      (budget.expenses
                        .slice(0, index)
                        .reduce((sum, item) => sum + item.amount, 0) /
                        scale) *
                      600
                    }
                    y="0"
                    width={(expense.amount / scale) * 600}
                    height="40"
                    className={`learn-fill-${expense.tone}`}
                  />
                ))}
                {budget.remaining > 0 && (
                  <rect
                    x={(budget.total / scale) * 600}
                    y="0"
                    width={(budget.remaining / scale) * 600}
                    height="40"
                    className="learn-fill-remaining"
                  />
                )}
              </svg>
              <div className="learn-expense-list">
                {budget.expenses
                  .filter((expense) => expense.amount > 0)
                  .map((expense) => (
                    <div key={expense.label}>
                      <span>
                        <i
                          className={`learn-expense-dot learn-fill-${expense.tone}`}
                        />
                        {expense.label}
                      </span>
                      <strong>{dollars(expense.amount)}</strong>
                    </div>
                  ))}
                <div className="learn-expense-total">
                  <span>Total expenses</span>
                  <strong>{dollars(budget.total)}</strong>
                </div>
              </div>
              <p className="learn-budget-insight">
                <SetupIcon kind="wallet" />
                <span>
                  Housing alone uses{" "}
                  <strong>{Math.round((rent / income) * 100)}%</strong> of this
                  example’s take-home income.
                  {support
                    ? " Food support frees up $150 for other priorities."
                    : " Try food support to see how one resource changes the margin."}
                </span>
              </p>
            </div>
          </div>
          <p className="learn-data-note">
            Teaching example only—not local cost-of-living data, a living-wage
            estimate, or your saved game. All amounts are illustrative. The $150
            food-support example is not a CAC benefit amount or a guarantee of
            assistance.
          </p>
        </section>

        <section className="learn-cac-section" aria-labelledby="cac-title">
          <div className="learn-section-heading">
            <div>
              <span className="learn-eyebrow">
                03 / A community alongside you
              </span>
              <GameHeading id="cac-title">Where CAC comes in.</GameHeading>
            </div>
            <SourceLink index={2}>Explore CAC’s website ↗</SourceLink>
          </div>
          <p className="learn-section-intro">
            Community Assistance Center helps neighbors meet basic needs while
            building greater stability.
          </p>
          <div className="learn-program-grid">
            <div
              className="learn-program-options"
              role="group"
              aria-label="Explore CAC services"
            >
              {cacPrograms.map((item, index) => (
                <GameButton
                  key={item.label}
                  variant="text"
                  className={`learn-program-button ${
                    programIndex === index ? "is-selected" : ""
                  }`}
                  aria-pressed={programIndex === index}
                  onClick={() => setProgramIndex(index)}
                >
                  <SetupIcon kind={item.icon} />
                  {item.label}
                  <span>→</span>
                </GameButton>
              ))}
            </div>
            <div className="learn-program-detail" aria-live="polite">
              <span className="learn-eyebrow">Neighbors helping neighbors</span>
              <GameHeading level={3}>{program.title}</GameHeading>
              <p>{program.description}</p>
              <p className="learn-program-connection">{program.connection}</p>
              <SourceLink index={2}>
                Find current services & eligibility ↗
              </SourceLink>
            </div>
          </div>
        </section>

        <section className="learn-reflection">
          <SetupIcon kind="independent" />
          <div>
            <span className="learn-eyebrow">Take a thought with you</span>
            <GameHeading>
              What changes when there’s a little more room?
            </GameHeading>
            <p>
              Consider which decisions felt different with support—and which
              barriers money alone could not solve.
            </p>
          </div>
          <GameButton className="learn-return" onClick={onBack}>
            Return to your experience <span aria-hidden="true">→</span>
          </GameButton>
        </section>
        <details className="learn-sources">
          <summary>
            Sources & how to read this page{" "}
            <span>Research, context, and limitations</span>
          </summary>
          <div>
            <p>
              The simulation uses fictional households and illustrative
              expenses, not observed household records. National research helps
              explain the pressures it explores; it does not validate the game’s
              exact dollar amounts or predict any individual’s experience.
            </p>
            {learningSources.map((source, index) => (
              <div className="learn-source-entry" key={source.url}>
                <span>0{index + 1}</span>
                <div>
                  <SourceLink index={index}>{source.title} ↗</SourceLink>
                  <p>{source.detail}</p>
                </div>
              </div>
            ))}
            <p>
              Statistics are dated snapshots, not live data. CAC services,
              hours, eligibility, and funding may change. Contact CAC directly
              for current information. External source links open in a new tab.
            </p>
          </div>
        </details>
      </main>
      <SimulationFooter />
    </div>
  )
}
