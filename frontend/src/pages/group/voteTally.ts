const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export function countVotes(options: readonly { voteCount: number | null }[]) {
  return options.reduce((total, option) => total + (option.voteCount ?? 0), 0)
}

export function formatVoteTally(votes: number, total: number) {
  return `${votes} ${votes === 1 ? 'vote' : 'votes'} (${percent.format(total > 0 ? votes / total : 0)})`
}
