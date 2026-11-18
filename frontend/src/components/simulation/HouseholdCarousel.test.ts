import { expect, it } from 'vitest'
import { avatarKey, avatarTone } from './avatars'
import { splitDescription } from './householdText'

it('splits the approved "Name — Tagline. Profile." description for display', () => {
  expect(
    splitDescription(
      'Alex',
      'Alex — Finding His Footing. Age 23; single, no dependents.',
    ),
  ).toEqual({
    tagline: 'Finding His Footing',
    body: 'Age 23; single, no dependents.',
  })
})

it('shows descriptions in other formats unchanged', () => {
  expect(splitDescription('Alex', 'A person who needs work.')).toEqual({
    tagline: null,
    body: 'A person who needs work.',
  })
  expect(splitDescription('A+B (x)', 'A+B (x) — Tag. Body')).toEqual({
    tagline: 'Tag',
    body: 'Body',
  })
})

it.each([
  ['Alex', 'alex', '#dcebf9'],
  [' ALEX Smith ', 'alex', '#dcebf9'],
  ['Jordan & Maya', 'jordan', '#fbe5e3'],
  ['Jordan,Maya', 'jordan', '#fbe5e3'],
  ['  Patricia ', 'patricia', '#e4ead9'],
  ['Sofia', 'sofia', '#ebe4f5'],
  ['Generic', 'generic', '#e9e9e9'],
  ['Someone New', 'generic', '#e9e9e9'],
  ['', 'generic', '#e9e9e9'],
  ['constructor', 'generic', '#e9e9e9'],
  ['__proto__', 'generic', '#e9e9e9'],
])('chooses the artwork and tone for %j', (name, key, tone) => {
  expect(avatarKey(name)).toBe(key)
  expect(avatarTone(name)).toBe(tone)
})
