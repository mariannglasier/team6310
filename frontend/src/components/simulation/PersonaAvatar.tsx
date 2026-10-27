// Decorative profile illustrations drawn from each approved household's
// description (Alex, Jordan with daughter Maya, Patricia, Sofia). They are
// presentation only: the persona name beside them carries the meaning.
import { avatarKey } from './avatars'

export function PersonaAvatar({ name }: { name: string }) {
  const key = avatarKey(name)
  return (
    <svg
      className={`persona-avatar persona-avatar--${key}`}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 168"
      preserveAspectRatio="xMidYMax meet"
    >
      <path className="avatar-ground" d="M30 146c48-24 212-28 260 0v22H30Z" />
      {key === 'jordan' && <Jordan />}
      {key === 'alex' && <Alex />}
      {key === 'patricia' && <Patricia />}
      {key === 'sofia' && <Sofia />}
      {key === 'generic' && <Generic />}
    </svg>
  )
}

function Jordan() {
  return (
    <>
      <circle className="avatar-halo" cx="124" cy="70" r="53" />
      <circle
        className="avatar-halo avatar-halo--small"
        cx="211"
        cy="91"
        r="35"
      />
      <path
        className="avatar-shirt avatar-shirt--jordan"
        d="M72 167c3-43 23-61 52-61s50 18 53 61Z"
      />
      <circle
        className="avatar-skin avatar-skin--deep"
        cx="124"
        cy="75"
        r="31"
      />
      <path
        className="avatar-hair avatar-hair--dark"
        d="M93 73c-4-28 15-43 34-43 22 0 37 15 33 43-9-13-19-17-32-17-15 0-25 6-35 17Z"
      />
      <circle className="avatar-eye" cx="113" cy="78" r="2.4" />
      <circle className="avatar-eye" cx="136" cy="78" r="2.4" />
      <path className="avatar-line" d="M116 91c5 5 12 5 17 0" />
      <path
        className="avatar-shirt avatar-shirt--maya"
        d="M178 167c2-28 15-42 34-42s32 14 34 42Z"
      />
      <circle
        className="avatar-skin avatar-skin--warm"
        cx="212"
        cy="99"
        r="22"
      />
      <path
        className="avatar-hair avatar-hair--brown"
        d="M190 99c-3-20 9-32 22-32 16 0 27 12 23 32-5-9-13-13-23-13-9 0-16 4-22 13Zm42-16c14-6 18 4 15 15-6-4-10-8-15-15Z"
      />
      <circle className="avatar-eye" cx="204" cy="101" r="2" />
      <circle className="avatar-eye" cx="220" cy="101" r="2" />
      <path className="avatar-line" d="M205 111c3 3 8 3 11 0" />
    </>
  )
}

function Alex() {
  return (
    <>
      <circle className="avatar-halo" cx="160" cy="76" r="63" />
      <path
        className="avatar-shirt avatar-shirt--alex"
        d="M94 168c4-46 28-65 66-65s62 19 66 65Z"
      />
      <path
        className="avatar-hoodie"
        d="M128 112c8 16 20 22 32 22s24-6 32-22c-6-6-18-9-32-9s-26 3-32 9Z"
      />
      <path
        className="avatar-line avatar-line--light"
        d="M152 130v22M168 130v22"
      />
      <path className="avatar-neck avatar-skin--gold" d="M143 103h34v18h-34Z" />
      <circle
        className="avatar-skin avatar-skin--gold"
        cx="160"
        cy="71"
        r="37"
      />
      <path
        className="avatar-hair avatar-hair--curly"
        d="M123 68c-2-29 16-48 37-48 20 0 39 16 38 47-10-14-23-21-38-21-16 0-27 7-37 22Z"
      />
      <circle className="avatar-eye" cx="147" cy="76" r="2.6" />
      <circle className="avatar-eye" cx="173" cy="76" r="2.6" />
      <path className="avatar-line" d="M151 91c6 6 13 6 19 0" />
    </>
  )
}

function Patricia() {
  return (
    <>
      <circle className="avatar-halo" cx="160" cy="75" r="63" />
      <path
        className="avatar-shirt avatar-shirt--patricia"
        d="M91 168c6-48 29-65 69-65s63 18 69 65Z"
      />
      <path
        className="avatar-neck avatar-skin--light"
        d="M144 104h32v20h-32Z"
      />
      <circle
        className="avatar-skin avatar-skin--light"
        cx="160"
        cy="71"
        r="37"
      />
      <path
        className="avatar-hair avatar-hair--silver"
        d="M123 71c-4-28 13-50 37-50 27 0 42 22 37 50-10-15-22-21-37-21-17 0-28 7-37 21Z"
      />
      <path
        className="avatar-line avatar-line--thin"
        d="M132 77h19c0 9-19 9-19 0Zm37 0h19c0 9-19 9-19 0Zm-18 3h18"
      />
      <path className="avatar-line" d="M151 93c6 6 13 6 19 0" />
      <path className="avatar-necklace" d="M146 111c3 17 25 17 28 0" />
    </>
  )
}

function Sofia() {
  return (
    <>
      <circle className="avatar-halo" cx="160" cy="76" r="63" />
      <path
        className="avatar-hair avatar-hair--dark"
        d="M119 74c-7-36 14-56 41-56s48 20 41 56l5 50c-13 7-24 6-31 0h-30c-7 6-18 7-31 0Z"
      />
      <path
        className="avatar-shirt avatar-shirt--sofia"
        d="M88 168c5-46 28-64 72-64s67 18 72 64Z"
      />
      <path className="avatar-blouse" d="m143 106 17 34 17-34Z" />
      <path
        className="avatar-line avatar-line--light"
        d="m143 106-8 24m42-24 8 24"
      />
      <path className="avatar-neck avatar-skin--tan" d="M145 100h30v14h-30Z" />
      <circle
        className="avatar-skin avatar-skin--tan"
        cx="160"
        cy="72"
        r="35"
      />
      <path
        className="avatar-hair avatar-hair--dark"
        d="M125 67c6-21 21-30 37-28 17 2 29 13 32 29-14-4-25-11-33-19-8 11-21 17-36 18Z"
      />
      <circle className="avatar-eye" cx="148" cy="77" r="2.5" />
      <circle className="avatar-eye" cx="172" cy="77" r="2.5" />
      <path className="avatar-line" d="M152 90c5 5 11 5 16 0" />
      <circle className="avatar-earring" cx="125" cy="84" r="2.6" />
      <circle className="avatar-earring" cx="195" cy="84" r="2.6" />
    </>
  )
}

function Generic() {
  return (
    <>
      <circle className="avatar-halo" cx="160" cy="76" r="63" />
      <path
        className="avatar-shirt avatar-shirt--generic"
        d="M94 168c4-46 28-65 66-65s62 19 66 65Z"
      />
      <circle
        className="avatar-skin avatar-skin--light"
        cx="160"
        cy="71"
        r="36"
      />
    </>
  )
}
