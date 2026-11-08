import {
  GRADES,
  PATH_LABELS,
  SKILL_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
} from '../data/grades'
import { CHARACTERS } from '../data/characters'
import {
  BODY_LABELS,
  CPD_ANNUAL_TARGET,
  EI_GROUPS,
  UK_SPEC_ELEMENTS,
} from '../data/ukSpec'
import type { CharterBody, GameState, SkillId } from '../data/types'
import { PathBars } from '../components/PathBars'
import { CareerLadder } from '../components/CareerLadder'
import { ReviewHistory } from '../components/ReviewHistory'
import {
  canAttemptProfessionalReview,
  cpdProgress,
  expectedLevel,
  growthNeedFor,
  milestonesFor,
  monthInCycle,
  nextGradeId,
  promotionReady,
  topGaps,
} from '../game/engine'

const SKILLS: SkillId[] = [
  'technical',
  'communication',
  'presenting',
  'coordination',
  'commercial',
]

const FILL = ['#ffffff', '#e8eef2', '#c5d4de', '#8aa4b5', '#4a6b7c', '#1a3344']
const STRENGTH_LABEL = {
  none: '—',
  mentioned: 'men',
  demonstrated: 'dem',
  strong: 'str',
} as const

export function SelfScreen({
  state,
  onAskFeedback,
  onPlanGaps,
  onCharterBody,
  onCharterReview,
  onRequestEarly,
}: {
  state: GameState
  onAskFeedback?: () => void
  onPlanGaps?: () => void
  onCharterBody?: (body: CharterBody) => void
  onCharterReview?: () => void
  onRequestEarly?: () => void
}) {
  const grade = GRADES[state.grade]
  const character = CHARACTERS.find((c) => c.id === state.characterId)
  const ready = promotionReady(state)
  const visibleBlockers = ready.blockers.filter((b) => {
    if (ready.earlyOk && (b.id === 'tenure' || b.id === 'milestones-early' || b.id === 'blind-spot-early'))
      return false
    if (ready.ready && b.id.startsWith('milestones-early')) return false
    return true
  })
  const gaps = topGaps(state, 3)
  const specs = milestonesFor(state.grade)
  const growthNeed = growthNeedFor(state.grade)
  const nxt = nextGradeId(state.grade)
  const nextGrade = nxt ? GRADES[nxt] : null
  const timer = grade.baseTimer
  const hiddenCount = state.grid.filter((c) => !c.revealed).length
  const cpd = cpdProgress(state)
  const reviewReady = canAttemptProfessionalReview(state)
  const cycleMonth = monthInCycle(state)
  const isGradOrTech = state.grade === 'graduate' || state.grade === 'technician'
  const demonstratedCount = UK_SPEC_ELEMENTS.filter(
    (e) =>
      state.elementStrength[e.id] === 'demonstrated' || state.elementStrength[e.id] === 'strong',
  ).length

  return (
    <section className="screen stack">
      <div className="panel" style={{ padding: '1.15rem' }}>
        <div className="section-head">
          <div>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Self · readiness
            </p>
            <h2 className="h2">
              {character?.name} · {grade.name}
              {character ? ` · ${character.discipline}` : ''}
            </h2>
            <p className="muted">
              Month {state.monthInGrade}
              {timer ? ` of ${timer}` : ''} · Review cycle month {cycleMonth}/6 ·{' '}
              {state.reviewsDone} review{state.reviewsDone === 1 ? '' : 's'} done
            </p>
          </div>
        </div>

        <div className="self-ready desk-ready">
          <div>
            <h3 className="self-ready-status">
              {ready.ready
                ? 'Ready for promotion'
                : ready.earlyOk
                  ? 'Early route open'
                  : 'Not yet ready'}
            </h3>
            <p className="muted">{ready.reason}</p>
          </div>
          <div className="self-ready-stats">
            <div>
              Growth banked:{' '}
              <strong>
                {Math.round(state.growthBanked)} / {growthNeed}
              </strong>
            </div>
            <div>
              Milestones:{' '}
              <strong>
                {state.milestonesHit.length} / {specs.length || 5}
              </strong>
            </div>
            <div>
              Crisis in play: <strong>{state.crises.length ? state.crises.length : 'None'}</strong>
            </div>
            <button
              className="btn btn-ghost self-early-btn"
              disabled={!ready.earlyOk || !onRequestEarly}
              type="button"
              onClick={() => onRequestEarly?.()}
            >
              {ready.earlyOk
                ? 'Request early promotion'
                : `Early promotion · ${ready.earlyMissing || 'locked'}`}
            </button>
            <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>
              Normal promo needs month {ready.minMonths}+ in grade. Early: month{' '}
              {ready.minMonthsEarly}+, 3 milestones (incl. blind-spot ones), Technical or Delivery at
              M1
              {isGradOrTech ? '' : ', and Professional Review if leaving Engineer'}. Early no longer
              auto-fires after Review — request it here.
            </p>
          </div>
        </div>

        {!ready.ready && !ready.earlyOk && visibleBlockers.length > 0 && (
          <div className="promo-blockers">
            <p className="eyebrow" style={{ color: 'var(--signal)', marginBottom: '0.35rem' }}>
              Why you can’t promote yet
            </p>
            <ul>
              {visibleBlockers.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <strong>{b.label}</strong>
                  <span className="muted"> — {b.fix ?? b.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="desk-grid">
        <div className="panel" style={{ padding: '1.1rem' }}>
          <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
            Career ladder
          </p>
          <CareerLadder state={state} />
        </div>
        <div className="panel" style={{ padding: '1.1rem' }}>
          <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
            Review history · trajectory
          </p>
          <ReviewHistory state={state} />
        </div>
      </div>

      <div className="desk-grid">
        <div className="stack">
          <div className="panel" style={{ padding: '1.1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Promotion paths
            </p>
            <PathBars
              paths={state.paths}
              grade={state.grade}
              reviewsDone={state.reviewsDone}
              monthInCycle={cycleMonth}
              delta={state.lastReview?.pathDelta}
              deltaLabel="last Review"
            />
          </div>

          <div className="panel" style={{ padding: '1.1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Proficiency against your grade
            </p>
            <h3 className="h2" style={{ fontSize: '1.25rem' }}>
              Skills × project stages
            </h3>
            <details className="score-recipe">
              <summary>How this grid is derived</summary>
              <p>
                Each cell is a skill at a project stage. Desk actions tagged to a skill add{' '}
                <strong>evidence</strong> only at your live project’s current stage. Level rises
                from evidence thresholds; soft skills stay hatched until feedback confirms them.
              </p>
              <p>
                <strong>Big number</strong> = current level (0–5). <strong>exp</strong> = expected
                for <em>this</em> grade. <strong>▲</strong> = expected for the <em>next</em> grade.{' '}
                <strong>gap</strong> = below this grade’s expectation. Impact-band columns (your
                grade’s high-influence stages) earn full project yield; elsewhere you mostly learn.
              </p>
            </details>
            <div className="self-grid-wrap">
              <table className="self-grid">
                <thead>
                  <tr>
                    <th>Skill</th>
                    {STAGE_ORDER.map((s) => {
                      const band = grade.impact[s] === 'high'
                      return (
                        <th key={s} className={band ? 'impact' : ''}>
                          {STAGE_LABELS[s]}
                          {band ? <div className="impact-tag">Impact band</div> : null}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {SKILLS.map((skill) => (
                    <tr key={skill}>
                      <th scope="row">{SKILL_LABELS[skill]}</th>
                      {STAGE_ORDER.map((stage) => {
                        const cell = state.grid.find((c) => c.skill === skill && c.stage === stage)!
                        const exp = expectedLevel(state.grade, skill, stage)
                        const nextExp = nxt ? expectedLevel(nxt, skill, stage) : exp
                        if (!cell.revealed) {
                          return (
                            <td key={stage} className="fog">
                              <div className="cell-big">?</div>
                              <div className="cell-meta">you think {cell.selfRating}</div>
                            </td>
                          )
                        }
                        const gap = cell.level < exp
                        const ahead = cell.level >= nextExp && nextExp > 0
                        const color = FILL[Math.min(5, cell.level)]
                        const light = cell.level >= 4
                        return (
                          <td
                            key={stage}
                            className={`${gap ? 'gap' : ''} ${ahead ? 'ahead' : ''}`}
                            style={{ background: color, color: light ? '#fff' : 'var(--ink)' }}
                            title={`Evidence ${cell.evidence}${cell.confirmed ? ' · confirmed' : ''}`}
                          >
                            <div className="cell-big">{cell.level}</div>
                            <div className="cell-meta">
                              exp {exp} · ▲{nextExp}
                              {gap ? ' · gap' : ''}
                              {ahead ? ' · ahead' : ''}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel" style={{ padding: '1.1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Chartership · {BODY_LABELS[state.charterBody]}
            </p>
            <h3 className="h2" style={{ fontSize: '1.25rem' }}>
              UK-SPEC evidence (A1–E5)
            </h3>
            <details className="score-recipe" open>
              <summary>How to read this — and what it feeds</summary>
              <p>
                Each cell is one competence from UK-SPEC 4th edition. Shade = strength:{' '}
                <strong>—</strong> none · <strong>men</strong> mentioned · <strong>dem</strong>{' '}
                demonstrated · <strong>str</strong> strong. Desk CPD / commitment actions and
                narrative events log episodes; after an event you choose <em>I led</em> /{' '}
                <em>I contributed</em> / <em>we</em>.
              </p>
              <p>
                <strong>What it factors into:</strong> (1) Commitment path points at Review from
                those blocks and events; (2) Graduate milestone “Build chartership log”; (3)
                Professional Review unlock at <em>Engineer+</em> when every element is at least
                demonstrated — not a Graduate shortcut. CIBSE/IET vs Engineers Ireland only changes
                grouping; the 17 elements stay the same.
              </p>
            </details>
            {onCharterBody && (
              <div className="charter-body-pick">
                <button
                  type="button"
                  className={`btn ${state.charterBody === 'cibse' ? 'btn-ink' : 'btn-ghost'}`}
                  onClick={() => onCharterBody('cibse')}
                >
                  CIBSE / IET
                </button>
                <button
                  type="button"
                  className={`btn ${state.charterBody === 'engineersIreland' ? 'btn-ink' : 'btn-ghost'}`}
                  onClick={() => onCharterBody('engineersIreland')}
                >
                  Engineers Ireland
                </button>
              </div>
            )}
            {state.charterBody === 'engineersIreland' ? (
              <div className="ukspec-ei">
                {EI_GROUPS.map((g) => (
                  <div key={g.id} className="ukspec-ei-group">
                    <strong>{g.title}</strong>
                    <div className="ukspec-row">
                      {g.elements.map((id) => {
                        const s = state.elementStrength[id] ?? 'none'
                        return (
                          <span
                            key={id}
                            className={`ukspec-cell s-${s}`}
                            title={UK_SPEC_ELEMENTS.find((e) => e.id === id)?.title}
                          >
                            {id}
                            <em>{STRENGTH_LABEL[s]}</em>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ukspec-grid">
                {(['A', 'B', 'C', 'D', 'E'] as const).map((theme) => (
                  <div key={theme} className="ukspec-theme">
                    <div className="ukspec-theme-label">{theme}</div>
                    <div className="ukspec-row">
                      {UK_SPEC_ELEMENTS.filter((e) => e.theme === theme).map((e) => {
                        const s = state.elementStrength[e.id] ?? 'none'
                        return (
                          <span
                            key={e.id}
                            className={`ukspec-cell s-${s}`}
                            title={`${e.title} · ${s}`}
                          >
                            {e.code}
                            <em>{STRENGTH_LABEL[s]}</em>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="charter-meta">
              <div>
                Elements ≥ demonstrated:{' '}
                <strong className="mono">
                  {demonstratedCount} / {UK_SPEC_ELEMENTS.length}
                </strong>
              </div>
              <div>
                CPD:{' '}
                <strong className="mono">
                  {cpd.total} / {CPD_ANNUAL_TARGET}h
                </strong>{' '}
                (planned {cpd.planned} · unplanned {cpd.unplanned})
              </div>
              <div>
                Sponsor: <strong>{state.sponsor.name}</strong> · tie {state.sponsor.tieStrength}/3
              </div>
              <div>
                DAP — short: {state.actionPlan.short}
              </div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                Medium: {state.actionPlan.medium}
              </div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                Long: {state.actionPlan.long}
              </div>
              {onCharterReview && (
                <button
                  type="button"
                  className="btn btn-ink"
                  disabled={!reviewReady}
                  onClick={onCharterReview}
                >
                  {state.professionalReview.passed
                    ? 'Professional Review passed'
                    : isGradOrTech
                      ? 'Professional Review · unlocks at Engineer grade'
                      : reviewReady
                        ? 'Sit Professional Review'
                        : `Professional Review · ${demonstratedCount}/17 elements ≥ demonstrated`}
                </button>
              )}
            </div>
            {!!state.charterLog.length && (
              <details className="charter-log">
                <summary>Evidence log ({state.charterLog.length})</summary>
                <ul>
                  {state.charterLog.slice(0, 12).map((e) => (
                    <li key={e.id}>
                      <span className="mono">M{e.turn}</span> {e.title} · {e.elements.join(',')} ·{' '}
                      {e.claim}
                      {!e.credited ? ' (not credited)' : ''}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div className="panel" style={{ padding: '1.1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              {grade.name} milestones
            </p>
            <ul className="self-milestones">
              {specs.map((m) => {
                const progress =
                  state.milestoneProgress[m.id] ??
                  (state.milestonesHit.includes(m.id) ? m.target : 0)
                const done = state.milestonesHit.includes(m.id)
                const pct = Math.min(100, (progress / m.target) * 100)
                return (
                  <li key={m.id}>
                    <div className="ms-head">
                      <span>
                        {done ? '✓' : '○'} {m.label}
                      </span>
                      <span className="mono">
                        {Math.min(progress, m.target)} / {m.target} · {PATH_LABELS[m.path]} +1 at
                        Review
                      </span>
                    </div>
                    <div className="ms-track">
                      <div className="ms-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="muted">
              Early needs month {ready.minMonthsEarly}+, 3 milestones (incl. blind-spot set), a passed
              gate, and Growth ≥ ~50% of target. Normal needs month {ready.minMonths}+. Base grade
              timer is {timer ?? 'open'} months.
            </p>
          </div>
        </div>

        <aside className="stack">
          <div className="panel" style={{ padding: '1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Top gaps
            </p>
            {gaps.length === 0 && (
              <p className="muted">No visible gaps yet — reveal soft skills or keep practising.</p>
            )}
            {gaps.map((g) => (
              <div className="gap-item" key={`${g.skill}-${g.stage}`}>
                <strong>
                  {SKILL_LABELS[g.skill]} at {STAGE_LABELS[g.stage]}: {g.level}, need {g.expected}
                </strong>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  Do: {g.actionHint}
                  {g.cardHint ? `. Slot: ${g.cardHint}.` : '.'} Supports {PATH_LABELS[g.path]}.
                </div>
              </div>
            ))}
            {onPlanGaps && (
              <button className="btn btn-ink" type="button" onClick={onPlanGaps}>
                Plan next month around these
              </button>
            )}
          </div>

          <div className="panel" style={{ padding: '1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Feedback
            </p>
            <p className="muted">{hiddenCount} cells still hidden.</p>
            <button
              className="btn btn-ink"
              type="button"
              disabled={!onAskFeedback || state.resources.hours < 8 || hiddenCount === 0}
              onClick={onAskFeedback}
            >
              Ask for feedback · −8h · reveals 1 cell
            </button>
            <ul className="fb-log">
              {state.feedbackLog.slice(0, 5).map((f, i) => (
                <li key={`${f.turn}-${i}`}>
                  <span className="mono">M{f.turn}</span> {f.text}
                </li>
              ))}
              {!state.feedbackLog.length && <li className="muted">No feedback yet.</li>}
            </ul>
          </div>

          <div className="panel" style={{ padding: '1rem' }}>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Character
            </p>
            <p>
              <strong>Strength:</strong> {character?.strength}
            </p>
            <p>
              <strong>Blind spot:</strong>{' '}
              {state.feedbackLog.some((f) => f.text.toLowerCase().includes('blind')) ||
              state.grid.filter((c) => c.revealed && c.skill !== 'technical').length >= 2
                ? character?.blindSpot
                : 'Hidden until feedback from a 1:1 or appraisal.'}
            </p>
            {nextGrade && (
              <p className="muted">
                Next grade, {nextGrade.name}: {nextGrade.theme}
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
