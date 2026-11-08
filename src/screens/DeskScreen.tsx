import { useState } from 'react'
import { motion } from 'framer-motion'
import { ActionYields } from '../components/ActionYields'
import { CARD_BY_ID } from '../data/cards'
import { deskifyCardText as deskify } from '../data/deskNames'
import { GRADES } from '../data/grades'
import type { GameState, Resources } from '../data/types'
import { FoundingCharter } from '../components/FoundingCharter'
import { PathExplain } from '../components/PathExplain'
import { YieldStrip } from '../components/YieldStrip'
import { CyclePreview } from '../components/CyclePreview'
import { FocusPanel } from '../components/FocusPanel'
import { INBOX_POOL } from '../data/inbox'
import {
  actionYieldPreview,
  canAfford,
  monthActions,
  monthPlanYieldDeltas,
  projectReview,
  slotCount,
  timesUsedThisMonth,
} from '../game/engine'

export function DeskScreen({
  state,
  onAction,
  onInbox,
  onEndMonth,
  onDismissTip,
}: {
  state: GameState
  onAction: (id: string) => void
  onInbox: (defId: string, choiceId: string) => void
  onEndMonth: () => void
  onDismissTip: () => void
}) {
  const actions = monthActions(state)
  const grade = GRADES[state.grade]
  const project = state.projects[0]
  const slots = slotCount(state)
  const monthPlan = monthPlanYieldDeltas(state)
  const projection = projectReview(state)
  const idleThisCycle = projection.breakdown.idleBlocks
  const emptySlots = Math.max(0, slots - state.slotted.length)
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
        wellbeingFloor={state.wellbeingFloor}
      />

      {!state.tipSeen && (
        <div className="tip onboarding" style={{ color: 'var(--paper)' }}>
          <strong>How a career works</strong>
          <ol>
            <li>
              <strong>Each month</strong> spend 160h on −8h action blocks. Clear the Inbox before
              deadlines. Wellbeing ≤ {state.wellbeingFloor} triggers Burnout.
            </li>
            <li>
              <strong>Every 6 months a Review</strong> scores five paths. Actions count through your{' '}
              <strong>slotted cards</strong>: a Delivery card turns drawing work into Delivery
              points. <strong>Unutilized</strong> blocks cost −1 Delivery each.
            </li>
            <li>
              <strong>Promotion</strong> = time in grade + the gate passed at two Reviews running +
              enough Growth. “Next best moves” below tracks all three.
            </li>
          </ol>
          <div style={{ marginTop: '0.6rem' }}>
            <button className="btn btn-primary" onClick={onDismissTip}>
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="desk-grid">
        <div className="panel" style={{ padding: '1.1rem' }}>
          <FocusPanel state={state} projection={projection} />
        </div>
        <div className="panel" style={{ padding: '1.1rem' }}>
          <CyclePreview state={state} projection={projection} />
        </div>
      </div>

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

          {!!state.inbox.filter((i) => !i.resolved).length && (
            <div className="inbox-block">
              <div className="section-head">
                <div>
                  <p className="eyebrow" style={{ color: 'var(--signal)' }}>
                    Inbox · {state.inbox.filter((i) => !i.resolved).length} to decide
                  </p>
                  <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
                    Each choice costs hours or a relationship. Late cards cause rework.
                  </p>
                </div>
              </div>
              <div className="stack">
                {state.inbox
                  .filter((i) => !i.resolved)
                  .map((item) => {
                    const def = INBOX_POOL.find((d) => d.id === item.defId)
                    if (!def) return null
                    return (
                      <div className="inbox-card" key={item.defId}>
                        <div className="inbox-title">
                          {def.title}{' '}
                          <span className="muted">
                            · {item.monthsLeft} mo left · from {def.from}
                          </span>
                        </div>
                        <p className="action-blurb">{def.body}</p>
                        <p className="muted" style={{ fontSize: '0.8rem' }}>
                          If late: {def.ifLate}
                        </p>
                        <div className="inbox-choices">
                          {def.choices.map((c) => (
                            <button
                              key={c.id}
                              className="btn btn-ghost"
                              style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}
                              type="button"
                              disabled={(c.hours ?? 0) > state.resources.hours}
                              onClick={() => onInbox(def.id, c.id)}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="stack">
            {actions.map((action, i) => {
              const used = timesUsedThisMonth(state, action.id)
              const affordable = canAfford(state, action)
              return (
                <motion.button
                  key={action.id}
                  className={`action-row${used > 0 ? ' action-row-used' : ''}${
                    action.id === 'unutilized' ? ' action-row-warn' : ''
                  }`}
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
                    {action.id === 'unutilized' && (
                      <div className="action-warn-banner">
                        −1 Delivery path at Review per block
                        {idleThisCycle ? ` · already −${idleThisCycle} this cycle` : ''}. Prefer any
                        real action if you have one.
                      </div>
                    )}
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
                ? ` · ${state.resources.hours}h unspent — use them on actions before ending the month`
                : ''}
              {idleThisCycle ? ` · Unutilized ×${idleThisCycle} this cycle = −${idleThisCycle} Delivery` : ''}
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
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Your network
            </p>
            <div className="stack">
              {state.ties.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span>
                    <strong>{t.name}</strong> · {t.role}
                  </span>
                  <span className="tie-dots" aria-label={`Tie ${t.strength} of 3`}>
                    {[0, 1, 2].map((i) => (
                      <i key={i} className={i < t.strength ? 'on' : ''} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
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
            {emptySlots > 0 && (
              <p className="slot-callout">
                {emptySlots} of {slots} slot{slots === 1 ? '' : 's'} empty — an empty slot scores
                nothing at Review. Fill it on Cards.
              </p>
            )}
            <div className="stack">
              {state.slotted.map((id) => {
                const card = CARD_BY_ID[id]
                return (
                  <div key={id} style={{ fontSize: '0.92rem' }}>
                    <strong>{card?.name ?? id}</strong>
                    <div className="muted">{card ? deskify(card.effect) : ''}</div>
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
