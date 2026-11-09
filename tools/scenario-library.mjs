import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const clean = (value) => value.trim().replace(/^[\u201c"]|[\u201d"]$/g, '')
function sections(text, depth) {
  const pattern = new RegExp(`^${'#'.repeat(depth)} (D\\d{3}) [^\\n]+`, 'gm')
  const matches = [...text.matchAll(pattern)]
  return new Map(matches.map((m, i) => [m[1], {
    title: m[0].replace(/^#+ D\d{3} . /, '').trim(),
    body: text.slice(m.index, matches[i + 1]?.index ?? text.length),
  }]))
}
function capture(text, pattern) {
  return clean(text.match(pattern)?.[1] ?? '')
}
function fact(text, role) {
  const raw = text.match(new RegExp(`\\*\\*Player-facing ${role} fact(?: template)?:\\*\\* ([^\\n]+)`))?.[1] ?? ''
  const copy = /^[\u201c"]/.test(raw) ? clean(raw) : ''
  const start = text.indexOf(`**Player-facing ${role} fact`)
  const evidence = start < 0 ? '' : text.slice(start).split(/\n###? |\n\*\*CAC fact \(separate/)[0]
  return {
    text: copy || null,
    semanticKey: role === 'general'
      ? capture(text, /\*\*General fact semantic key:\*\* `([^`]+)`/)
      : capture(evidence, /(?:fact ID|key) `([^`]+)`/),
    hasUnresolvedTokens: /[{}]/.test(copy),
    sourceUrls: [...new Set([...evidence.matchAll(/https:\/\/[^\s)]+/g)].map((m) => m[0]))],
    evidenceNotes: evidence,
    verified: false,
  }
}

export function compileLibrary(draft, sourcing) {
  draft = draft.replaceAll("\r\n", "\n")
  sourcing = sourcing.replaceAll("\r\n", "\n")
  const drafts = sections(draft, 2)
  const sources = sections(sourcing, 3)
  const cards = []
  for (let i = 1; i <= 60; i++) {
    const key = `D${String(i).padStart(3, '0')}`
    const item = drafts.get(key), source = sources.get(key)
    if (!item || !source) throw new Error(`Missing ${key}`)
    const lines = item.body.split(/\r?\n/)
    const header = lines.findIndex((line) => /^\| Key \|/.test(line))
    if (header < 0) throw new Error(`Missing choices: ${key}`)
    const choices = []
    for (const line of lines.slice(header + 2)) {
      if (!line.startsWith('|')) break
      const cells = line.split('|').slice(1, -1).map(clean)
      const expression = cells[2]
      // Only plain draft amounts are parsed. Fees/refunds and conditions are
      // never flattened to a guessed net amount.
      const amount = expression.match(/^(-?)\$([\d,]+)\.(\d{2})$/)
      const cents = amount
        ? (amount[1] ? -1 : 1) * (Number(amount[2].replaceAll(',', '')) * 100 + Number(amount[3]))
        : null
      choices.push({
        key: cells[0], text: cells[1], draftExpression: expression,
        draftCents: cents, outcome: cells.length === 5 ? cells[3] : null,
        responseText: cells.at(-1), requiresCac: /(?:^|-)CAC$/.test(cells[0]),
      })
    }
    const type = capture(item.body, /\*\*Type \/ category:\*\* ([^/]+)\//)
    cards.push({
      key, title: item.title,
      category: capture(item.body, /\*\*Type \/ category:\*\* [^/]+\/ ([^.]+)\./),
      type, personaIntent: capture(item.body, /\*\*Persona intent:\*\* ([^.]+)\./),
      situation: capture(item.body, /\*\*Situation:\*\* ([^\n]+)/),
      eligibility: capture(item.body, /\*\*Eligibility:\*\* ([^\n]+)/),
      timing: capture(item.body, /\*\*Timing:\*\* ([^\n]+)/),
      // Employment and independent bills keep their existing server engines.
      engine: i <= 4 ? 'employment' : i >= 6 && i <= 20 ? 'bill' : 'ordinary',
      mandatory: key === 'D005',
      choices,
      generalFact: fact(source.body, 'general'), cacFact: fact(source.body, 'CAC'),
      baselineNotes: capture(source.body, /\*\*Baseline evidence and disposition[^\n]*?:\*\* ([^\n]+)/),
      publicationBlockers: ['baseline_bindings', 'persona_and_route_mapping', 'fact_verification',
        ...(choices.some((c) => c.requiresCac) ? ['cac_eligibility_and_allocation'] : [])],
    })
  }
  if (new Set(cards.map((c) => c.generalFact.semanticKey)).size !== 60)
    throw new Error('General facts must have 60 distinct semantic keys')
  return { schemaVersion: 1, status: 'draft', sourceHash: createHash('sha256').update(draft + sourcing).digest('hex'), cards }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const draft = readFileSync(resolve(root, 'docs/scenario-draft-library.md'), 'utf8')
  const sourcing = readFileSync(resolve(root, 'docs/scenario-data-sourcing.md'), 'utf8')
  const compiled = compileLibrary(draft, sourcing)
  const output = resolve(root, 'docs/data/scenario-library-draft.json')
  const serialized = JSON.stringify(compiled, null, 2) + '\n'
  if (process.argv.includes('--check')) {
    if (readFileSync(output, 'utf8') !== serialized) throw new Error('Regenerate scenario library manifest')
  } else writeFileSync(output, serialized)
  console.log(`${compiled.cards.length} cards compiled; draft only, no database changed.`)
}
