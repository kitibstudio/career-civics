import type { CharterBody, UkSpecElementId, UkSpecElement } from './types'

/** UK-SPEC 4th edition CEng elements A1–E5 (17). Engineers Ireland maps the same data into 5 competences. */
export const UK_SPEC_ELEMENTS: UkSpecElement[] = [
  {
    id: 'A1',
    code: 'A1',
    theme: 'A',
    title: 'Maintain and extend theory',
    short: 'Keep technical knowledge current',
  },
  {
    id: 'A2',
    code: 'A2',
    theme: 'A',
    title: 'Unusual or challenging problems',
    short: 'Non-routine technical problems',
  },
  {
    id: 'B1',
    code: 'B1',
    theme: 'B',
    title: 'Define requirements and opportunities',
    short: 'Briefing and requirements',
  },
  {
    id: 'B2',
    code: 'B2',
    theme: 'B',
    title: 'Investigate, analyse and design',
    short: 'Design incl. safety, security, environment',
  },
  {
    id: 'B3',
    code: 'B3',
    theme: 'B',
    title: 'Implement and evaluate',
    short: 'Build, commission, learn from results',
  },
  {
    id: 'C1',
    code: 'C1',
    theme: 'C',
    title: 'Plan work and resources',
    short: 'Plan your own and others’ work',
  },
  {
    id: 'C2',
    code: 'C2',
    theme: 'C',
    title: 'Programme, budget, quality',
    short: 'Delivery controls',
  },
  {
    id: 'C3',
    code: 'C3',
    theme: 'C',
    title: 'Lead teams and develop others',
    short: 'Leadership and mentoring',
  },
  {
    id: 'C4',
    code: 'C4',
    theme: 'C',
    title: 'Continuous quality improvement',
    short: 'Improve how the team works',
  },
  {
    id: 'D1',
    code: 'D1',
    theme: 'D',
    title: 'Communicate at all levels',
    short: 'Clear communication',
  },
  {
    id: 'D2',
    code: 'D2',
    theme: 'D',
    title: 'Present and discuss proposals',
    short: 'Presenting options',
  },
  {
    id: 'D3',
    code: 'D3',
    theme: 'D',
    title: 'Personal and social skills',
    short: 'Diversity, inclusion, interpersonal',
  },
  {
    id: 'E1',
    code: 'E1',
    theme: 'E',
    title: 'Codes of conduct',
    short: 'Professional conduct',
  },
  {
    id: 'E2',
    code: 'E2',
    theme: 'E',
    title: 'Safe systems of work',
    short: 'Health and safety',
  },
  {
    id: 'E3',
    code: 'E3',
    theme: 'E',
    title: 'Sustainable development',
    short: 'Carbon and sustainability',
  },
  {
    id: 'E4',
    code: 'E4',
    theme: 'E',
    title: 'Continuing professional development',
    short: 'CPD planned and unplanned',
  },
  {
    id: 'E5',
    code: 'E5',
    theme: 'E',
    title: 'Ethics',
    short: 'Ethical practice',
  },
]

export const UK_SPEC_BY_ID = Object.fromEntries(
  UK_SPEC_ELEMENTS.map((e) => [e.id, e]),
) as Record<UkSpecElementId, UkSpecElement>

/** Engineers Ireland five competences — same evidence, different grouping. */
export const EI_GROUPS: { id: string; title: string; elements: UkSpecElementId[] }[] = [
  { id: 'knowledge', title: 'Engineering knowledge and understanding', elements: ['A1', 'A2'] },
  {
    id: 'solutions',
    title: 'Development and implementation of engineering solutions',
    elements: ['B1', 'B2', 'B3'],
  },
  {
    id: 'responsibility',
    title: 'Professional responsibility and leadership',
    elements: ['C1', 'C2', 'C3', 'C4'],
  },
  { id: 'communication', title: 'Communication skills', elements: ['D1', 'D2', 'D3'] },
  { id: 'ethics', title: 'Ethical practice', elements: ['E1', 'E2', 'E3', 'E4', 'E5'] },
]

export const BODY_LABELS: Record<CharterBody, string> = {
  cibse: 'CIBSE / IET (UK-SPEC 17)',
  engineersIreland: 'Engineers Ireland (5 competences)',
}

export const CPD_ANNUAL_TARGET = 40
export const CPD_BLOCK_HOURS = 8

export const STRENGTH_ORDER = ['none', 'mentioned', 'demonstrated', 'strong'] as const

export function emptyEvidenceMap(): Record<UkSpecElementId, import('./types').EvidenceStrength> {
  const map = {} as Record<UkSpecElementId, import('./types').EvidenceStrength>
  for (const e of UK_SPEC_ELEMENTS) map[e.id] = 'none'
  return map
}

export function strengthRank(s: import('./types').EvidenceStrength): number {
  return STRENGTH_ORDER.indexOf(s)
}

export function maxStrength(
  a: import('./types').EvidenceStrength,
  b: import('./types').EvidenceStrength,
): import('./types').EvidenceStrength {
  return strengthRank(a) >= strengthRank(b) ? a : b
}

export function claimToStrength(
  claim: import('./types').ClaimRole,
): import('./types').EvidenceStrength {
  if (claim === 'led') return 'strong'
  if (claim === 'contributed') return 'demonstrated'
  return 'mentioned'
}

export function elementsReadyForReview(
  strengths: Record<UkSpecElementId, import('./types').EvidenceStrength>,
): boolean {
  return UK_SPEC_ELEMENTS.every((e) => strengthRank(strengths[e.id] ?? 'none') >= 2)
}

export function weakestElements(
  strengths: Record<UkSpecElementId, import('./types').EvidenceStrength>,
  n = 3,
): UkSpecElementId[] {
  return [...UK_SPEC_ELEMENTS]
    .sort(
      (a, b) =>
        strengthRank(strengths[a.id] ?? 'none') - strengthRank(strengths[b.id] ?? 'none'),
    )
    .slice(0, n)
    .map((e) => e.id)
}

export function defaultSponsor(discipline: string): import('./types').SponsorState {
  const names: Record<string, string> = {
    electrical: 'Priya Nair · Senior Electrical',
    mechanical: 'Omar Hassan · Senior Mechanical',
    architect: 'Elena Voss · Associate Architect',
    technician: 'Chris Okonkwo · BIM Lead',
    plumbing: 'Samira Blake · Senior PH',
    fire: 'Jon Park · Fire Engineer',
    ict: 'Leah Cho · ICT Lead',
  }
  return {
    id: `sponsor-${discipline}`,
    name: names[discipline] ?? 'Alex Rivera · Senior Engineer',
    tieStrength: 1,
  }
}

export function defaultActionPlan(grade: string): import('./types').DevelopmentActionPlan {
  if (grade === 'technician' || grade === 'seniorTechnician') {
    return {
      short: 'Produce clean layouts and unlock the second software package',
      medium: 'Own a discipline model and train one junior',
      long: 'Lead cross-discipline coordination on a major project',
      lastReviewedTurn: 0,
    }
  }
  return {
    short: 'Open the chartership log; evidence A1, B2, D1, E2, E4',
    medium: 'Professional Review at Engineer; cover B1, B3, C1–C2, E1, E3, E5',
    long: 'Sponsor a graduate; feed Influence legacy through committee work',
    lastReviewedTurn: 0,
  }
}
