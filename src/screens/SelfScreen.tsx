import { GRADES, PATH_LABELS, PATH_ORDER, SKILL_LABELS, STAGE_LABELS, STAGE_ORDER } from '../data/grades'
import { CHARACTERS } from '../data/characters'
import {
  BODY_LABELS,
  CPD_ANNUAL_TARGET,
  EI_GROUPS,
  UK_SPEC_ELEMENTS,
} from '../data/ukSpec'
import type { CharterBody, GameState, SkillId } from '../data/types'
import {
  canAttemptProfessionalReview,
  cpdProgress,
  expectedLevel,
  growthNeedFor,
  milestonesFor,
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

const FILL = ['#ffffff', '#e6e6e6', '#c4c4c4', '#8f8f8f', '#4d4d4d', '#111111']
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
}: {
  state: GameState
  onAskFeedback?: () => void
  onPlanGaps?: () => void
  onCharterBody?: (body: CharterBody) => void
  onCharterReview?: () => void
}) {
  const grade = GRADES[state.grade]
  const character = CHARACTERS.find((c) => c.id === state.characterId)
  const ready = promotionReady(state)
  const gaps = topGaps(state, 3)
  const specs = milestonesFor(state.grade)
  const growthNeed = growthNeedFor(state.grade)
  const nxt = nextGradeId(state.grade)
  const nextGrade = nxt ? GRADES[nxt] : null
  const timer = grade.baseTimer
  const hiddenCount = state.grid.filter((c) => !c.revealed).length
  const cfg = { m1: state.grade === 'graduate' || state.grade === 'technician' ? 1 : 2 }
  const cpd = cpdProgress(state)
  const reviewReady = canAttemptProfessionalReview(state)

  return (
    <section className="screen self-mono">
      <div className="self-panel">
        <div className="self-header">
          <div>
            <p className="self-kicker">Career Civics · Self</p>
            <h2 className="self-title">
              {character?.name} · {grade.name}
              {character ? ` · ${character.discipline}` : ''}
            </h2>
            <p className="self-sub">
              Month {state.monthInGrade}
              {timer ? ` of ${timer}` : ''} · Review{' '}
              {Math.floor((state.monthInGrade - 1) / 6) + 1} in grade
            </p>
          </div>
        </div>

        <div className="self-ready">
          <div>
            <h3 className="self-ready-status">{ready.ready ? 'Ready for promotion' : 'Not yet ready'}</h3>
            <p className="self-sub">{ready.reason}</p>
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
            <button className="self-btn" disabled={!ready.earlyOk} type="button">
              {ready.earlyOk
                ? 'Request early promotion'
                : `Request early promotion · ${ready.earlyMissing || 'locked'}`}
            </button>
          </div>
        </div>

        <div className="self-paths">
          {PATH_ORDER.map((p) => {
            const v = state.paths[p] ?? 0
            const m1 = cfg.m1
            const m2 = state.grade === 'graduate' || state.grade === 'technician' ? 3 : 4
            const atRisk = v <= m1
            const mark = v >= m2 ? 'M2' : v >= m1 ? 'M1' : 'Below'
            return (
              <div className={`self-path-row${atRisk ? ' at-risk' : ''}`} key={p}>
                <div className="self-path-label">
                  <strong>{PATH_LABELS[p]}</strong>
                  <span>
                    {v} · {mark}
                    {atRisk ? ', at risk' : ''}
                  </span>
                </div>
                <div className="self-path-track">
                  <div className="self-path-fill" style={{ width: `${Math.min(100, (v / (m2 + 2)) * 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="self-main">
          <div>
            <h3 className="self-section">Proficiency against your grade</h3>
            <p className="self-sub">
              Big number = level. exp = this grade. ▲ = next grade. Hatched = hidden until feedback.
              Impact band columns get full project yield.
            </p>
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
                            style={{ background: color, color: light ? '#fff' : '#111' }}
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

            <h3 className="self-section" style={{ marginTop: '1.25rem' }}>
              Chartership evidence · {BODY_LABELS[state.charterBody]}
            </h3>
            <p className="self-sub">
              17 UK-SPEC elements (A1–E5). Strength: none / mentioned / demonstrated / strong.
              “I led” → strong; “I contributed” → demonstrated; “we” → mentioned. Body choice only
              changes grouping.
            </p>
            {onCharterBody && (
              <div className="charter-body-pick">
                <button
                  type="button"
                  className={`self-btn${state.charterBody === 'cibse' ? ' solid' : ''}`}
                  onClick={() => onCharterBody('cibse')}
                >
                  CIBSE / IET
                </button>
                <button
                  type="button"
                  className={`self-btn${state.charterBody === 'engineersIreland' ? ' solid' : ''}`}
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
                          <span key={id} className={`ukspec-cell s-${s}`} title={UK_SPEC_ELEMENTS.find((e) => e.id === id)?.title}>
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
                          <span key={e.id} className={`ukspec-cell s-${s}`} title={`${e.title} · ${s}`}>
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
                CPD: <strong className="mono">{cpd.total} / {CPD_ANNUAL_TARGET}h</strong> (planned{' '}
                {cpd.planned} · unplanned {cpd.unplanned})
              </div>
              <div>
                Sponsor: <strong>{state.sponsor.name}</strong> · tie {state.sponsor.tieStrength}/3
              </div>
              <div>
                DAP — short: {state.actionPlan.short}
              </div>
              <div className="self-sub">
                Medium: {state.actionPlan.medium} · Long: {state.actionPlan.long}
              </div>
              {onCharterReview && (
                <button
                  type="button"
                  className="self-btn solid"
                  disabled={!reviewReady}
                  onClick={onCharterReview}
                >
                  {state.professionalReview.passed
                    ? 'Professional Review passed'
                    : reviewReady
                      ? 'Sit Professional Review'
                      : 'Professional Review · need all elements ≥ demonstrated'}
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

            <h3 className="self-section" style={{ marginTop: '1.25rem' }}>
              {grade.name} milestones
            </h3>
            <ul className="self-milestones">
              {specs.map((m) => {
                const progress = state.milestoneProgress[m.id] ?? (state.milestonesHit.includes(m.id) ? m.target : 0)
                const done = state.milestonesHit.includes(m.id)
                const pct = Math.min(100, (progress / m.target) * 100)
                return (
                  <li key={m.id}>
                    <div className="ms-head">
                      <span>
                        {done ? '✓' : '○'} {m.label}
                      </span>
                      <span className="mono">
                        {Math.min(progress, m.target)} / {m.target} · {PATH_LABELS[m.path]} +1
                      </span>
                    </div>
                    <div className="ms-track">
                      <div className="ms-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="self-sub">3 of {specs.length} lets you request early promotion.</p>
          </div>

          <aside className="self-side">
            <div className="self-card">
              <h4>Your top 3 gaps</h4>
              {gaps.length === 0 && <p className="self-sub">No visible gaps yet — reveal soft skills or keep practising.</p>}
              {gaps.map((g) => (
                <div className="gap-item" key={`${g.skill}-${g.stage}`}>
                  <strong>
                    {SKILL_LABELS[g.skill]} at {STAGE_LABELS[g.stage]}: {g.level}, need {g.expected}
                  </strong>
                  <div className="self-sub">
                    Do: {g.actionHint}
                    {g.cardHint ? `. Slot: ${g.cardHint}.` : '.'} Lifts {PATH_LABELS[g.path]}
                    {g.path ===
                    (Object.entries(state.paths).sort((a, b) => a[1] - b[1])[0]?.[0] as string)
                      ? ', your weakest path'
                      : ''}
                    .
                  </div>
                </div>
              ))}
              {onPlanGaps && (
                <button className="self-btn solid" type="button" onClick={onPlanGaps}>
                  Plan next month around these
                </button>
              )}
            </div>

            <div className="self-card">
              <h4>Feedback</h4>
              <p className="self-sub">{hiddenCount} cells still hidden.</p>
              <button
                className="self-btn solid"
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
                {!state.feedbackLog.length && <li className="self-sub">No feedback yet.</li>}
              </ul>
            </div>

            <div className="self-card">
              <h4>Character</h4>
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
                <p className="self-sub">
                  Next grade, {nextGrade.name}: {nextGrade.theme}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
