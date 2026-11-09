import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compileLibrary } from './scenario-library.mjs'

const draft = readFileSync(new URL('../docs/scenario-draft-library.md', import.meta.url), 'utf8')
const sourcing = readFileSync(new URL('../docs/scenario-data-sourcing.md', import.meta.url), 'utf8')
const library = compileLibrary(draft, sourcing)
test('extracts all authored cards and preserves the three existing gameplay engines', () => {
  assert.equal(library.cards.length, 60)
  assert.equal(library.cards.filter((c) => c.engine === 'employment').length, 4)
  assert.equal(library.cards.filter((c) => c.engine === 'bill').length, 15)
  assert.equal(library.cards.filter((c) => c.engine === 'ordinary').length, 41)
  assert.equal(library.cards.find((c) => c.key === 'D005').mandatory, true)
})
test('does not convert unresolved tax fee/refund or conditional CAC coverage into a guessed balance', () => {
  const tax = library.cards.find((c) => c.key === 'D005')
  assert.equal(tax.choices.find((c) => c.key === 'PAID').draftCents, null)
  assert.match(tax.choices.find((c) => c.key === 'PAID').draftExpression, /fee F/)
  const rent = library.cards.find((c) => c.key === 'D006')
  assert.equal(rent.choices.find((c) => c.requiresCac).draftCents, null)
})
test('distinguishes a missing CAC observation from authored fact copy and unresolved numerical templates', () => {
  assert.equal(library.cards.filter((c) => c.cacFact.text === null).length, 30)
  assert.equal(library.cards.find((c) => c.key === 'D009').cacFact.text, null)
  assert.equal(library.cards.find((c) => c.key === 'D001').generalFact.hasUnresolvedTokens, true)
  assert.equal(library.cards.find((c) => c.key === 'D010').generalFact.hasUnresolvedTokens, false)
})
test('fails rather than silently importing incomplete source documents', () => {
  assert.throws(() => compileLibrary(draft.replace('## D060 ', '## Removed '), sourcing), /Missing D060/)
})
