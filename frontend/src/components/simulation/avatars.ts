export type AvatarKey = 'alex' | 'jordan' | 'patricia' | 'sofia' | 'generic'
export type AvatarTone = 'blue' | 'rose' | 'green' | 'violet' | 'neutral'

const tones: Record<AvatarKey, AvatarTone> = {
  alex: 'blue',
  jordan: 'rose',
  patricia: 'green',
  sofia: 'violet',
  generic: 'neutral',
}

export function avatarKey(name: string): AvatarKey {
  const first = name
    .trim()
    .toLowerCase()
    .split(/[\s&,]+/)[0]
  return first === 'alex' ||
    first === 'jordan' ||
    first === 'patricia' ||
    first === 'sofia'
    ? first
    : 'generic'
}

export function avatarTone(name: string): AvatarTone {
  return tones[avatarKey(name)]
}
