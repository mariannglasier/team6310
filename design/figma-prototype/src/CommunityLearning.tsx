import SimulationHeader from "./SimulationHeader"
import SimulationFooter from "./SimulationFooter"
import { GameHeading } from "./GamePrimitives"
import { landingContent } from "./landingContent"
import LearningExplorer from "./LearningExplorer"
import "./setup.css"
import "./setup-flow.css"
import "./game-session.css"
import "./group-session.css"

export default function CommunityLearning({
  onBack,
  page = "learn",
}: {
  onBack: () => void
  page?: "learn" | "donate"
}) {
  if (page === "learn") return <LearningExplorer onBack={onBack} />

  return (
    <div className="setup-site setup-site--simulation gameplay-site group-site">
      <SimulationHeader contentId="community-learning" />
      <main id="community-learning" className="group-learning game-session">
        <section className="group-stage">
          <GameHeading level={1}>Support your neighbors</GameHeading>
          <p className="play-description">
            Help the Community Assistance Center support neighbors in Sandy
            Springs and Dunwoody.
          </p>
          <GameHeading>Make a donation to CAC</GameHeading>
          <p>
            Contact CAC to learn about current donation options and how your
            contribution can help meet community needs.
          </p>
          <section className="group-callout">
            <GameHeading level={3}>Contact CAC about giving</GameHeading>
            <p>
              {landingContent.contact.phone} · {landingContent.contact.email}
            </p>
            <p>https://ourcac.org/donate-online/</p>
          </section>
        </section>
      </main>
      <SimulationFooter />
    </div>
  )
}
