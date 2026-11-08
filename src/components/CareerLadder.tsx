import { GRADES, gateConfig } from '../data/grades'
import type { GameState, GradeId } from '../data/types'
import { growthNeedFor } from '../game/progress'
import { minMonthsForGrade, needsCharterGate } from '../game/promotion'

export function trackGrades(state: GameState): GradeId[] {
  const start: GradeId = state.track === 'technician' ? 'technician' : 'graduate'
  const out: GradeId[] = []
  let g: GradeId | null = start
  while (g && out.length < 8) {
    out.push(g)
    g = GRADES[g]?.next ?? null
  }
  return out
}

function LadderSteps({ state }: { state: GameState }) {
  const grades = trackGrades(state)
  const idx = grades.indexOf(state.grade)
  return (
    <ol className="ladder-steps" aria-label="Career ladder">
      {grades.map((g, i) => (
        <li
          key={g}
          className={i < idx ? 'done' : i === idx ? 'current' : 'future'}
          aria-current={i === idx ? 'step' : undefined}
        >
          <span className="ladder-dot" aria-hidden>
            {i < idx ? '✓' : i + 1}
          </span>
          {GRADES[g].name}
        </li>
      ))}
    </ol>
  )
}

/** Compact ladder shown under the top bar on every in-game screen. */
export function CareerLadderStrip({ state }: { state: GameState }) {
  const minNormal = minMonthsForGrade(state.grade, false)
  const minEarly = minMonthsForGrade(state.grade, true)
  const reviewIn = 6 - ((state.monthInGrade - 1) % 6)
  const hasNext = !!GRADES[state.grade]?.next
  return (
    <div className="ladder-strip">
      <LadderSteps state={state} />
      <div className="ladder-meta">
        <span>
          Month <strong>{state.monthInGrade}</strong> in grade
        </span>
        {hasNext && (
          <span>
            Promotion window: early {minEarly}+ · normal {minNormal}+
          </span>
        )}
        <span>
          Next Review in <strong>{reviewIn}</strong> mo
        </span>
        <span>
          Gate streak <strong>{Math.min(2, state.consecutiveGate)}/2</strong>
        </span>
        <span>
          Growth{' '}
          <strong>
            {Math.round(state.growthBanked)}/{growthNeedFor(state.grade)}
          </strong>
        </span>
      </div>
    </div>
  )
}

/** Full ladder with an in-grade timeline (Self screen). */
export function CareerLadder({ state }: { state: GameState }) {
  const grade = GRADES[state.grade]
  const nextId = grade.next
  const next = nextId ? GRADES[nextId] : null
  const minNormal = minMonthsForGrade(state.grade, false)
  const minEarly = minMonthsForGrade(state.grade, true)
  const span = Math.max(minNormal + 6, grade.baseTimer ?? 0, state.monthInGrade + 2)
  const pos = (m: number) => `${Math.min(100, (m / span) * 100)}%`
  const elapsed = state.monthInGrade - 1

  let since = 0
  const history = state.careerHistory ?? []
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].kind === 'promotion') {
      since = i + 1
      break
    }
  }
  const gradeReviews = history.slice(since).filter((h) => h.kind === 'review')
  const ticks: number[] = []
  for (let m = 6; m <= span; m += 6) ticks.push(m)
  const nextCfg = nextId ? gateConfig(nextId) : null

  return (
    <div className="career-ladder">
      <LadderSteps state={state} />
      {next ? (
        <>
          <div className="ladder-timeline" aria-label={`Month ${state.monthInGrade} of ${grade.name}`}>
            <div className="ladder-zone early" style={{ left: pos(minEarly), width: `calc(${pos(minNormal)} - ${pos(minEarly)})` }} />
            <div className="ladder-zone normal" style={{ left: pos(minNormal), right: 0 }} />
            <div className="ladder-elapsed" style={{ width: pos(elapsed) }} />
            {ticks.map((m, i) => {
              const r = gradeReviews[i]
              const cls = r ? (r.gatePass ? 'pass' : 'miss') : 'pending'
              return (
                <div
                  key={m}
                  className={`ladder-tick ${cls}`}
                  style={{ left: pos(m) }}
                  title={`Review ${i + 1} (month ${m})${r ? (r.gatePass ? ' · gate passed' : ' · gate missed') : ''}`}
                />
              )
            })}
            <div className="ladder-you" style={{ left: pos(elapsed) }}>
              <span>You · m{state.monthInGrade}</span>
            </div>
          </div>
          <div className="ladder-legend">
            <span>
              <i className="sw early" /> Early window (month {minEarly}+, exceptional)
            </span>
            <span>
              <i className="sw normal" /> Normal promotion (month {minNormal}+)
            </span>
            <span>
              <i className="sw pass" /> Review gate passed
            </span>
            <span>
              <i className="sw miss" /> Missed
            </span>
            {grade.baseTimer && <span>Plateau warnings after month {grade.baseTimer}</span>}
          </div>
          <p className="ladder-next">
            <strong>Next: {next.name}</strong> — {next.theme}. {next.slots} card slots (now{' '}
            {grade.slots}); gate rises to M1 {nextCfg?.m1} / M2 {nextCfg?.m2}; Growth need{' '}
            {nextId ? growthNeedFor(nextId) : '—'}.
            {needsCharterGate(state.grade) &&
              ' This step also needs a passed Professional Review (chartership).'}
          </p>
        </>
      ) : (
        <p className="ladder-next">
          Top of the ladder — complete a Legacy path to finish the career.
        </p>
      )}
    </div>
  )
}
