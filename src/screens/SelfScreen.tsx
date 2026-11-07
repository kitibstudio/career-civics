import { GRADES, SKILL_LABELS, STAGE_LABELS, STAGE_ORDER } from '../data/grades'
import { CHARACTERS } from '../data/characters'
import type { GameState, SkillId } from '../data/types'

const SKILLS: SkillId[] = [
  'technical',
  'communication',
  'presenting',
  'coordination',
  'commercial',
]

export function SelfScreen({ state }: { state: GameState }) {
  const grade = GRADES[state.grade]
  const character = CHARACTERS.find((c) => c.id === state.characterId)

  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.2rem' }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Self view
        </p>
        <h2 className="h2">Proficiency grid</h2>
        <p className="muted" style={{ maxWidth: '40rem' }}>
          Soft-skill cells stay hatched until feedback. The wash marks your Grade’s impact band —
          full project yield there; elsewhere you mostly earn Competence.
        </p>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Skill</th>
                {STAGE_ORDER.map((s) => (
                  <th key={s}>{STAGE_LABELS[s]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SKILLS.map((skill) => (
                <tr key={skill}>
                  <th scope="row">{SKILL_LABELS[skill]}</th>
                  {STAGE_ORDER.map((stage) => {
                    const cell = state.grid.find((c) => c.skill === skill && c.stage === stage)
                    const band = grade.impact[stage]
                    const bandClass = band === 'high' ? 'band' : ''
                    if (!cell?.revealed) {
                      return (
                        <td key={stage} className={`cell fog ${bandClass}`} title="Self-rating fog">
                          ~{cell?.selfRating ?? 0}
                        </td>
                      )
                    }
                    return (
                      <td key={stage} className={`cell ${bandClass}`}>
                        {cell.level}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="desk-grid" style={{ marginTop: '1.25rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Milestones this grade</h3>
            <ul style={{ paddingLeft: '1.1rem', color: 'var(--steel)' }}>
              {grade.milestones.map((m) => (
                <li key={m.id}>
                  {state.milestonesHit.includes(m.id) ? '✓' : '○'} {m.label}
                </li>
              ))}
            </ul>
            <p className="muted">Hit 3 of 5 for an early promotion request.</p>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Character</h3>
            <p>
              <strong>{character?.name}</strong> — {character?.route}
            </p>
            <p className="muted">Strength: {character?.strength}</p>
            <p className="muted">
              Blind spot:{' '}
              {state.grid.some((c) => c.revealed && c.skill === 'communication')
                ? character?.blindSpot
                : 'Still fogged — seek feedback.'}
            </p>
            {state.track === 'technician' && (
              <p className="muted">
                Software: AutoCAD {state.software.autocad ? 'unlocked' : 'locked'} · Revit{' '}
                {state.software.revit ? 'unlocked' : 'locked'}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
