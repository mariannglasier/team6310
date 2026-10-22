export default function HouseholdAvatar({ householdId }: { householdId: string }) {
  if (householdId === "jordan-maya") {
    return <svg className="household-avatar" aria-hidden="true" viewBox="0 0 320 168">
      <path className="avatar-ground" d="M38 145c42-23 201-30 246 0v23H38Z" />
      <circle className="avatar-halo avatar-halo--large" cx="124" cy="70" r="53" />
      <circle className="avatar-halo avatar-halo--small" cx="211" cy="91" r="35" />
      <path className="avatar-shirt avatar-shirt--adult" d="M72 167c3-43 23-61 52-61s50 18 53 61Z" />
      <circle className="avatar-skin avatar-skin--deep" cx="124" cy="75" r="31" />
      <path className="avatar-hair avatar-hair--coils" d="M93 73c-4-28 15-43 34-43 22 0 37 15 33 43-9-13-19-17-32-17-15 0-25 6-35 17Z" />
      <circle className="avatar-eye" cx="113" cy="78" r="2.4" /><circle className="avatar-eye" cx="136" cy="78" r="2.4" />
      <path className="avatar-smile" d="M116 91c5 5 12 5 17 0" />
      <path className="avatar-shirt avatar-shirt--child" d="M178 167c2-28 15-42 34-42s32 14 34 42Z" />
      <circle className="avatar-skin avatar-skin--warm" cx="212" cy="99" r="22" />
      <path className="avatar-hair avatar-hair--pony" d="M190 99c-3-20 9-32 22-32 16 0 27 12 23 32-5-9-13-13-23-13-9 0-16 4-22 13Zm42-16c14-6 18 4 15 15-6-4-10-8-15-15Z" />
      <circle className="avatar-eye" cx="204" cy="101" r="2" /><circle className="avatar-eye" cx="220" cy="101" r="2" />
      <path className="avatar-smile" d="M205 111c3 3 8 3 11 0" />
    </svg>
  }

  if (householdId === "alex") {
    return <svg className="household-avatar" aria-hidden="true" viewBox="0 0 320 168">
      <path className="avatar-ground" d="M36 145c48-22 205-25 250 0v23H36Z" />
      <circle className="avatar-halo avatar-halo--large" cx="160" cy="76" r="63" />
      <path className="avatar-shirt avatar-shirt--alex" d="M94 168c4-46 28-65 66-65s62 19 66 65Z" />
      <path className="avatar-neck avatar-skin--gold" d="M143 103h34v21h-34Z" />
      <circle className="avatar-skin avatar-skin--gold" cx="160" cy="71" r="37" />
      <path className="avatar-hair avatar-hair--curly" d="M123 68c-2-29 16-48 37-48 20 0 39 16 38 47-10-14-23-21-38-21-16 0-27 7-37 22Z" />
      <circle className="avatar-eye" cx="147" cy="76" r="2.6" /><circle className="avatar-eye" cx="173" cy="76" r="2.6" />
      <path className="avatar-smile" d="M151 91c6 6 13 6 19 0" />
      <path className="avatar-collar" d="m143 117 17 15 17-15-5-6h-24Z" />
    </svg>
  }

  return <svg className="household-avatar" aria-hidden="true" viewBox="0 0 320 168">
    <path className="avatar-ground" d="M36 145c50-25 199-25 250 0v23H36Z" />
    <circle className="avatar-halo avatar-halo--large" cx="160" cy="75" r="63" />
    <path className="avatar-shirt avatar-shirt--patricia" d="M91 168c6-48 29-65 69-65s63 18 69 65Z" />
    <path className="avatar-neck avatar-skin--light" d="M144 104h32v20h-32Z" />
    <circle className="avatar-skin avatar-skin--light" cx="160" cy="71" r="37" />
    <path className="avatar-hair avatar-hair--silver" d="M123 71c-4-28 13-50 37-50 27 0 42 22 37 50-10-15-22-21-37-21-17 0-28 7-37 21Z" />
    <path className="avatar-glasses" d="M132 77h19c0 9-19 9-19 0Zm37 0h19c0 9-19 9-19 0Zm-18 3h18" />
    <path className="avatar-smile" d="M151 93c6 6 13 6 19 0" />
    <path className="avatar-necklace" d="M146 111c3 17 25 17 28 0" />
  </svg>
}
