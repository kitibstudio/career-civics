export function FoundingCharter() {
  return (
    <div className="founding-charter" id="founding-charter">
      <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
        Founding Charter
      </p>
      <h3 style={{ margin: '0.15rem 0 0.45rem', fontFamily: 'var(--font-display)' }}>
        Second Pair of Eyes
      </h3>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>
        Always in force. Uses <strong>no loadout slot</strong>. Quality review and CPD sit under every
        grade — only your role changes (from being checked, to checking others).
      </p>
      <ul className="founding-list">
        <li>
          <strong>QA before issue</strong> — nothing ships without a human check. Issuing unchecked
          automation can draw the Black Box Crisis.
        </li>
        <li>
          <strong>CPD stays live</strong> — diarised learning never switches off; logging a CPD block
          this month also nudges Growth at month end.
        </li>
        <li>
          <strong>Not optional</strong> — you cannot unequip this. Habits and Specialisms share the
          remaining slots around it.
        </li>
      </ul>
    </div>
  )
}
