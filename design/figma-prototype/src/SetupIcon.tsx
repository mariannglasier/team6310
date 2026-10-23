export default function SetupIcon({ kind }: { kind: "support" | "independent" | "check" | "calendar" | "wallet" | "flag" }) {
  return <svg className="setup-flow-icon" aria-hidden="true" viewBox="0 0 24 24">
    {kind === "support" && <><path d="m3 11 9-8 9 8M5 10v10h14V10" /><path d="M12 17s-5-3-3-5c1-1 2-1 3 0 1-1 2-1 3 0 2 2-3 5-3 5Z" /></>}
    {kind === "independent" && <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 4-4 2 2-4 4-2Z" /></>}
    {kind === "check" && <path d="m5 12 4 4L19 6" />}
    {kind === "calendar" && <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 10h16m-11 5h6" /></>}
    {kind === "wallet" && <><path d="M19 7V4H6a3 3 0 0 0 0 6h14v11H6a3 3 0 0 1-3-3V7" /><path d="M20 13h-5v5h5m-3-2.5h.1" /></>}
    {kind === "flag" && <><path d="M5 21V3c5-3 9 4 14 0v11c-5 4-9-3-14 0" /></>}
  </svg>
}
