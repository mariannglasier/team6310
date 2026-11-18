import type { GroupSession } from '../../services/groupSessionService'

const prompts = {
  bill: 'What would paying or putting off this bill mean for the household’s next decision?',
  job: 'Which job offered the best fit for this household, and what trade-offs mattered?',
  preparation: 'What shaped the group’s decision about preparing for work?',
  clothing:
    'How did the cost of getting ready for the interview affect your choice?',
  scenario: 'What trade-offs in this situation shaped your choice?',
}

export function GroupRoundDebrief({ session }: { session: GroupSession }) {
  if (
    session.roundState !== 'results' ||
    (session.isBillDay && !session.activeBill)
  )
    return null
  const answered = session.activeBill?.voteCount ?? session.voteCount
  const unanswered = Math.max(0, session.participantCount - answered)
  const facts = session.roundFacts ?? []
  const kind =
    session.activeBill || session.isBillDay ? 'bill' : session.roundType

  return (
    <section
      aria-label="Round results and discussion"
      className="group-round-debrief"
    >
      <h2>Round results</h2>
      <p>
        {answered} of {session.participantCount} answered · {unanswered}{' '}
        unanswered
      </p>
      <p>
        {answered === 0
          ? 'No votes were cast.'
          : `Percentages are based on ${answered} ${answered === 1 ? 'vote' : 'votes'} cast.`}
      </p>
      {facts.length > 0 ? (
        facts.map((fact) => (
          <div key={fact.role}>
            <h3>
              {fact.role === 'cac'
                ? 'CAC perspective'
                : fact.copyKind === 'context'
                  ? 'Local context'
                  : 'Community fact'}
            </h3>
            <p>{fact.text}</p>
            {fact.sourceUrl.startsWith('https://') && (
              <a href={fact.sourceUrl} target="_blank" rel="noreferrer">
                View source
              </a>
            )}
          </div>
        ))
      ) : (
        <div>
          <h3>Discuss this decision</h3>
          <p>{prompts[kind]}</p>
        </div>
      )}
    </section>
  )
}
