// Approved descriptions read "Name — Tagline. Rest of the profile." Split them for
// display only; anything that does not match is shown unchanged.
export function splitDescription(
  name: string,
  description: string,
): { tagline: string | null; body: string } {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(
    `^${escaped}\\s+[—–-]\\s+([^.]+)\\.\\s*(.*)$`,
    's',
  ).exec(description.trim())
  return match
    ? { tagline: match[1], body: match[2] }
    : { tagline: null, body: description }
}
