import { GRADES } from '../data/grades'
import { CHARACTERS } from '../data/characters'
import { habitsForGrade } from '../data/cards'
import type { GameState } from '../data/types'
import { useState } from 'react'

export function PromotionScreen({
  state,
  onPromote,
  onContinue,
}: {
  state: GameState
  onPromote: (keepHabitId?: string) => void
  onContinue: () => void
}) {
  const grade = GRADES[state.grade]
  const next = grade.next ? GRADES[grade.next] : null
  const character = CHARACTERS.find((c) => c.id === state.characterId)
  const carryOptions = habitsForGrade(state.grade).filter((h) => state.slotted.includes(h.id))
  const [keep, setKeep] = useState(carryOptions[0]?.id)
  if (state.justPromoted || (!next && state.ended)) {
    return (
      <section className="screen">
        <div className="panel" style={{ padding: '1.4rem' }}>
          <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
            Promotion
          </p>
          <h2 className="h2">You made {grade.name}</h2>
          <p>{grade.theme}</p>
          <p className="muted">
            Celebration: +1 temporary slot for six months. Old Habits drop unless Golden Age carried
            one forward. Specialisms remain slottable.
          </p>
          <button className="btn btn-ink" style={{ marginTop: '1rem' }} onClick={onContinue}>
            Open the new desk
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.4rem' }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Promotion review
        </p>
        <h2 className="h2">
          {character?.name}, ready for {next?.name ?? 'Legacy'}
        </h2>
        <p>
          Mentor note: you showed up where the band was bright
          {state.milestonesHit.length ? ` and logged ${state.milestonesHit.length} milestones` : ''}.
          Breadth kept Crises off the board — that is the real gate.
        </p>
        <p className="muted">End-of-grade crisis waiting in the wings: {grade.crisis.name} — {grade.crisis.blurb}</p>

        {!!carryOptions.length && next && (
          <div style={{ margin: '1rem 0' }}>
            <label htmlFor="carry">
              <strong>Golden Age carry (if eligible)</strong>
            </label>
            <select
              id="carry"
              value={keep}
              onChange={(e) => setKeep(e.target.value)}
              style={{
                display: 'block',
                marginTop: '0.4rem',
                padding: '0.55rem 0.7rem',
                borderRadius: 10,
                border: '1px solid var(--line)',
                width: 'min(100%, 320px)',
              }}
            >
              {carryOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1rem' }}>
          <button
            className="btn btn-ink"
            onClick={() => {
              if (next) onPromote(keep)
              else onPromote()
            }}
          >
            {next ? `Promote to ${next.name}` : 'Complete Legacy Path'}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}
            onClick={() => {
              window.alert(
                'Pivot: stay on your track for now, or note a future move (Electrical→ICT, Engineer→PM, Technician→Engineer). Full pivot routes unlock in a later patch — your mentor has logged the interest.',
              )
              if (next) onPromote(keep)
              else onPromote()
            }}
          >
            Pivot discipline…
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}
            onClick={() => {
              const blob = new Blob(
                [
                  `Career Civics debrief — ${character?.name ?? ''} · ${grade.name}\n`,
                  `Paths: ${JSON.stringify(state.paths)}\n`,
                  `Milestones: ${state.milestonesHit.join(', ') || 'none'}\n`,
                  `Growth banked: ${state.growthBanked}\n`,
                  `Feedback:\n${state.feedbackLog.map((f) => `M${f.turn}: ${f.text}`).join('\n') || 'none'}\n`,
                ],
                { type: 'text/plain' },
              )
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `career-civics-debrief-${character?.id ?? 'player'}.txt`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export debrief card
          </button>
        </div>
      </div>
    </section>
  )
}
