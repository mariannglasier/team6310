import alex from '../../assets/personas/alex.svg'
import jordan from '../../assets/personas/jordan.svg'
import patricia from '../../assets/personas/patricia.svg'
import sofia from '../../assets/personas/sofia.svg'
import generic from '../../assets/personas/generic.svg'

export type AvatarTone = `#${string}`

// Add one import and one entry here. The key matches the persona's first word.
// Each SVG has a wide household canvas and a bottom-aligned square #profile view.
// See docs/persona-illustrations.md for the illustrated-asset procedure.
export const personaIllustrations = {
  alex: { src: alex, tone: '#dcebf9' },
  jordan: { src: jordan, tone: '#fbe5e3' },
  patricia: { src: patricia, tone: '#e4ead9' },
  sofia: { src: sofia, tone: '#ebe4f5' },
  generic: { src: generic, tone: '#e9e9e9' },
} satisfies Record<string, { src: string; tone: AvatarTone }>

export type AvatarKey = keyof typeof personaIllustrations

export function avatarKey(name: string): AvatarKey {
  const first = name
    .trim()
    .toLowerCase()
    .split(/[\s&,]+/)[0]
  return Object.hasOwn(personaIllustrations, first)
    ? (first as AvatarKey)
    : 'generic'
}

export function avatarTone(name: string): AvatarTone {
  return personaIllustrations[avatarKey(name)].tone
}
