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

it('chooses artwork by household name and falls back for unknown names', () => {
  expect(avatarKey('Jordan & Maya')).toBe('jordan')
  expect(avatarKey('  Patricia ')).toBe('patricia')
  expect(avatarKey('Sofia')).toBe('sofia')
  expect(avatarKey('Alex')).toBe('alex')
  expect(avatarKey('Someone New')).toBe('generic')
  expect(avatarTone('Someone New')).toBe('neutral')
})
