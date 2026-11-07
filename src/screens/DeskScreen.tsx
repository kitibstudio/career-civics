import { useState } from 'react'
import { motion } from 'framer-motion'
import { ActionYields } from '../components/ActionYields'
import { CARD_BY_ID } from '../data/cards'
import { GRADES } from '../data/grades'
import type { GameState, Resources } from '../data/types'
import { FoundingCharter } from '../components/FoundingCharter'
import { PathExplain } from '../components/PathExplain'
import { YieldStrip } from '../components/YieldStrip'
import {
  actionYieldPreview,
  canAfford,
  monthActions,
  monthPlanYieldDeltas,
  slotCount,
  timesUsedThisMonth,
} from '../game/engine'

export function DeskScreen({
  state,
  onAction,
  onEndMonth,
  onDismissTip,
}: {
  state: GameState
  onAction: (id: string) => void
  onEndMonth: () => void
  onDismissTip: () => void
}) {
  const actions = monthActions(state)
  const grade = GRADES[state.grade]
  const project = state.projects[0]
  const slots = slotCount(state)
  const monthPlan = monthPlanYieldDeltas(state)
  const [hoverPreview, setHoverPreview] = useState<Partial<Record<keyof Resources, number>> | null>(
    null,
  )

  return (
    <section className="screen stack">
      <YieldStrip
        resources={state.resources}
        burnout={state.burnoutTurns > 0}
        monthPlan={monthPlan}
        hoverPreview={hoverPreview}
      />

      {!state.tipSeen && (
        <div className="tip" style={{ color: 'var(--paper)' }}>
          <strong>How a month works:</strong> every action is one −8h block — press again to stack
          more (e.g. five calc blocks ≈ a full package). The top strip shows banked +/− for the
          month under each yield. Overtime means you are overloaded: log it, then Ask Up for
          support. Leftover hours? Log <em>Unutilized time</em> (−8h): Fee and Wellbeing yields
          fall; Competence, Reputation, Network, and Growth earn nothing.
          <div style={{ marginTop: '0.6rem' }}>
            <button className="btn btn-primary" onClick={onDismissTip}>
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="desk-grid">
        <div className="panel" style={{ padding: '1.1rem' }}>
          <div className="section-head">
            <div>
              <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
                Monthly desk
              </p>
              <h2 className="h2">Where do the hours go?</h2>
            </div>
            <div className="muted" style={{ fontFamily: 'var(--font-mono)' }}>
              {state.resources.hours}h left
            </div>
          </div>

          <div className="stack">
            {actions.map((action, i) => {
              const used = timesUsedThisMonth(state, action.id)
              const affordable = canAfford(state, action)
              return (
                <motion.button
                  key={action.id}
                  className={`action-row${used > 0 ? ' action-row-used' : ''}`}
                  disabled={!affordable}
                  onClick={() => onAction(action.id)}
                  onMouseEnter={() => {
                    const p = actionYieldPreview(state, action)
                    setHoverPreview({ hours: p.hoursDelta, ...p.resources })
                  }}
                  onMouseLeave={() => setHoverPreview(null)}
                  onFocus={() => {
                    const p = actionYieldPreview(state, action)
                    setHoverPreview({ hours: p.hoursDelta, ...p.resources })
                  }}
                  onBlur={() => setHoverPreview(null)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <div>
                    <div className="action-title-row">
                      <div className="action-title">{action.name}</div>
                      {used > 0 && (
                        <span className="action-count" title="Times selected this month">
                          ×{used}
                        </span>
                      )}
                    </div>
                    <div className="action-blurb">{action.blurb}</div>
                    <ActionYields state={state} action={action} />
                  </div>
                  <div className="hours-pill">
                    {action.hours < 0 ? `+${Math.abs(action.hours)}h` : `−${action.hours}h`}
                  </div>
                </motion.button>
              )
            })}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ink" onClick={onEndMonth}>
              End month
            </button>
            <span className="muted" style={{ alignSelf: 'center', fontSize: '0.88rem' }}>
              Next review in {6 - ((state.monthInGrade - 1) % 6)} month(s)
              {state.resources.hours >= 8
                ? ` · ${Math.floor(state.resources.hours / 8)} unutilized block(s) still available`
                : ''}
            </span>
          </div>
        </div>

        <div className="stack">
          <div className="panel" style={{ padding: '1.1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Live project
            </p>
            <h3 style={{ fontFamily: 'var(--font-display)', margin: '0.2rem 0 0.4rem' }}>
              {project?.name}
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {project?.type} · {project?.stage} · {project?.clashes} open clashes
            </p>
            <div className="bar-track" style={{ margin: '0.75rem 0' }}>
              <div className="bar-fill" style={{ width: `${project?.progress ?? 0}%` }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {project?.progress}% complete
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--steel)' }}>
              Impact band:{' '}
              {Object.entries(grade.impact)
                .filter(([, v]) => v === 'high')
                .map(([k]) => k)
                .join(', ') || 'learning'}{' '}
              pays full project yield.
            </p>
          </div>

          <div className="panel" style={{ padding: '1.1rem' }}>
            <div className="section-head">
              <div>
                <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
                  Loadout · {state.slotted.length}/{slots}
                </p>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Slotted cards</h3>
              </div>
            </div>
            <div className="stack">
              {state.slotted.map((id) => {
                const card = CARD_BY_ID[id]
                return (
                  <div key={id} style={{ fontSize: '0.92rem' }}>
                    <strong>{card?.name ?? id}</strong>
                    <div className="muted">{card?.effect}</div>
                  </div>
                )
              })}
              {!state.slotted.length && <div className="muted">No cards slotted.</div>}
            </div>
          </div>

          <div className="panel" style={{ padding: '1.1rem' }}>
            <FoundingCharter />
          </div>

          <div className="panel" style={{ padding: '1.1rem' }}>
            <PathExplain state={state} />
          </div>

          <div className="panel-dark" style={{ padding: '1.1rem' }}>
            <p className="eyebrow">Recent</p>
            <ul className="log-list">
              {state.log.slice(0, 6).map((entry, i) => (
                <li key={`${entry.turn}-${i}`} className={entry.tone}>
                  <span style={{ opacity: 0.65, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    M{entry.turn}
                  </span>{' '}
                  {entry.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
