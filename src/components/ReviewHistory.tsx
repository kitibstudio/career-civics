import { GRADES, PATH_LABELS, PATH_ORDER, gateConfig } from '../data/grades'
import type { GameState } from '../data/types'
import { fmtNum, fmtSigned } from '../game/guidance'

export function ReviewHistory({ state, limit = 10 }: { state: GameState; limit?: number }) {
  const rows = (state.careerHistory ?? []).slice(-limit)
  if (!rows.length) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        No Reviews yet — your first lands at month 6 of this grade. Each one will appear here so you
        can see the trend.
      </p>
    )
  }
  return (
    <div className="history-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Career month</th>
            <th>Grade</th>
            {PATH_ORDER.map((p) => (
              <th key={p} title={PATH_LABELS[p]}>
                {PATH_LABELS[p].slice(0, 5)}
              </th>
            ))}
            <th>Gate</th>
            <th>Growth</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h, i) => {
            if (h.kind === 'promotion') {
              return (
                <tr key={`p-${i}`} className="history-promo">
                  <td className="mono">M{h.turn}</td>
                  <td colSpan={PATH_ORDER.length + 3}>
                    Promoted: {GRADES[h.grade]?.name} → <strong>{h.toGrade ? GRADES[h.toGrade]?.name : ''}</strong>{' '}
                    after {h.monthInGrade - 1} months · paths reset
                  </td>
                </tr>
              )
            }
            const cfg = gateConfig(h.grade)
            return (
              <tr key={`r-${i}`}>
                <td className="mono">M{h.turn}</td>
                <td>{GRADES[h.grade]?.name}</td>
                {PATH_ORDER.map((p) => {
                  const v = h.pathTotals?.[p] ?? 0
                  const d = h.pathDelta?.[p] ?? 0
                  const tone =
                    v >= cfg.golden ? 'golden' : v >= cfg.m2 ? 'm2' : v >= cfg.m1 ? 'm1' : 'below'
                  return (
                    <td key={p} className={`history-cell ${tone}`}>
                      <strong>{fmtNum(v)}</strong>
                      <span className="history-delta">{fmtSigned(d)}</span>
                    </td>
                  )
                })}
                <td className={h.gatePass ? 'history-pass' : 'history-miss'}>
                  {h.gatePass ? 'Pass' : 'Miss'} {h.streak ?? 0}/2
                </td>
                <td className="mono">{h.growthBanked ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="muted" style={{ fontSize: '0.78rem', margin: '0.35rem 0 0' }}>
        Each cell: path total after that Review (small number = change). Colour: red below M1, teal
        M1, green M2, amber Golden.
      </p>
    </div>
  )
}
