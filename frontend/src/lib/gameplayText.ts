// Repair known UTF-8 text decoded as Windows-1252 in older content editions.
// Keep correctly encoded Unicode and the saved source records intact.
export function gameplayText(value: string): string {
  const punctuation: Record<string, string> = {
    'â€™': '’',
    'â€˜': '‘',
    'â€œ': '“',
    'â€\u009d': '”',
    'â€“': '–',
    'â€”': '—',
    'â€¦': '…',
    'Â·': '·',
    'Â ': ' ',
  }
  return Object.entries(punctuation)
    .reduce(
      (text, [broken, correct]) => text.replaceAll(broken, correct),
      value,
    )
    .replace(
      'You can prepare lunches ahead of time or get lunch out with your coworkers.',
      "You can prepare lunches ahead of time or get lunch out with your coworkers for this week's lunches.",
    )
    .replace(
      /Between \d{4}-\d{2} and \d{4}-\d{2}, (?=the average price of )/g,
      'In the past year, ',
    )
    .replace(
      /(average price of .+?) changed by (-?\d+(?:\.\d+)?)%\./g,
      (_match, subject: string, value: string) => {
        const percent = Number(value)
        return percent === 0
          ? `${subject} did not change.`
          : `${subject} ${percent < 0 ? 'decreased' : 'increased'} by ${Math.abs(percent).toFixed(1)}%.`
      },
    )
}

export function scenarioDescription(
  value: string,
  supportEnabled: boolean,
): string {
  const text = gameplayText(value)
  if (supportEnabled) return text
  return text
    .replace(
      ', repair it, or look for a secondhand coat through Canopy Thrift.',
      ' or repair it.',
    )
    .replace(
      ', give your time, or use Canopy Thrift credits to find a gift.',
      ', or give your time.',
    )
}
