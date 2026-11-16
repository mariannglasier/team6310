// Decorative artwork: the adjacent persona name carries the meaning.
import { personaIllustrations, avatarKey } from './avatars'

export function PersonaAvatar({
  name,
  variant = 'household',
}: {
  name: string
  variant?: 'household' | 'profile'
}) {
  const key = avatarKey(name)
  return (
    <img
      className={`persona-avatar persona-avatar--${key}`}
      src={`${personaIllustrations[key].src}${variant === 'profile' ? '#profile' : ''}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}
