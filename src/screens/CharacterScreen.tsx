import { useState } from 'react'
import { motion } from 'framer-motion'
import { CHARACTERS } from '../data/characters'

export function CharacterScreen({
  onBack,
  onPick,
}: {
  onBack: () => void
  onPick: (id: string) => void
}) {
  const [selected, setSelected] = useState(CHARACTERS[0].id)
  const character = CHARACTERS.find((c) => c.id === selected)!

  return (
    <section className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: '1rem' }}>
        Back
      </button>
      <p className="eyebrow">Character select</p>
      <h1 className="h2" style={{ color: 'var(--paper)' }}>
        Who walks into the office?
      </h1>
      <p className="lede" style={{ marginBottom: '1.25rem' }}>
        One pre-made starter. Strength is visible; the blind spot stays fogged until feedback.
      </p>

      <div className="desk-grid">
        <div className="char-grid">
          {CHARACTERS.map((c, i) => (
            <motion.button
              key={c.id}
              className={`char-card ${selected === c.id ? 'selected' : ''}`}
              onClick={() => setSelected(c.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="tag">{c.route}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.35rem', marginTop: '0.45rem' }}>
                {c.name}
              </div>
              <p style={{ margin: '0.45rem 0 0', color: 'var(--steel)', fontSize: '0.92rem' }}>{c.backstory}</p>
            </motion.button>
          ))}
        </div>

        <div className="panel" style={{ padding: '1.25rem' }}>
          <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
            Starting brief
          </p>
          <h2 className="h2">{character.name}</h2>
          <p style={{ color: 'var(--steel)' }}>{character.backstory}</p>
          <div style={{ display: 'grid', gap: '0.55rem', margin: '1rem 0' }}>
            <div>
              <strong>Strength</strong>
              <div className="muted">{character.strength}</div>
            </div>
            <div>
              <strong>Hidden blind spot</strong>
              <div className="muted">Revealed by feedback — not yet.</div>
            </div>
            <div>
              <strong>Skills</strong>
              <div className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Tech {character.skills.technical} · Comms {character.skills.communication} · Present{' '}
                {character.skills.presenting} · Coord {character.skills.coordination} · Commercial{' '}
                {character.skills.commercial}
              </div>
            </div>
            <div>
              <strong>Career map</strong>
              <div className="muted" style={{ fontSize: '0.88rem' }}>
                {character.track === 'technician'
                  ? 'Technician → Senior Technician → BIM Lead → Lead Coordinator (can pivot toward engineer later).'
                  : 'Graduate → Engineer → Senior → Associate. Pivots (discipline / PM) appear at promotion.'}
              </div>
            </div>
          </div>
          <button className="btn btn-ink" onClick={() => onPick(character.id)}>
            Begin career
          </button>
        </div>
      </div>
    </section>
  )
}
