import type { GradeId, SkillId, StageId } from './types'

export type ExpectTable = Record<SkillId, Record<StageId, number>>

/** Expected cell levels at current grade (feedback §6.4). */
export const EXPECTATIONS: Partial<Record<GradeId, ExpectTable>> = {
  graduate: {
    technical: { concept: 1, scheme: 1, detailed: 2, tender: 2, construction: 1, commissioning: 1 },
    communication: { concept: 1, scheme: 1, detailed: 2, tender: 1, construction: 1, commissioning: 0 },
    presenting: { concept: 0, scheme: 1, detailed: 2, tender: 0, construction: 0, commissioning: 0 },
    coordination: { concept: 0, scheme: 1, detailed: 2, tender: 2, construction: 1, commissioning: 0 },
    commercial: { concept: 0, scheme: 0, detailed: 1, tender: 2, construction: 0, commissioning: 0 },
  },
  engineer: {
    technical: { concept: 2, scheme: 2, detailed: 3, tender: 3, construction: 2, commissioning: 1 },
    communication: { concept: 1, scheme: 2, detailed: 2, tender: 2, construction: 2, commissioning: 1 },
    presenting: { concept: 1, scheme: 1, detailed: 2, tender: 1, construction: 1, commissioning: 1 },
    coordination: { concept: 1, scheme: 2, detailed: 3, tender: 2, construction: 2, commissioning: 1 },
    commercial: { concept: 0, scheme: 1, detailed: 1, tender: 2, construction: 1, commissioning: 0 },
  },
  senior: {
    technical: { concept: 3, scheme: 3, detailed: 4, tender: 3, construction: 2, commissioning: 2 },
    communication: { concept: 2, scheme: 3, detailed: 3, tender: 3, construction: 2, commissioning: 2 },
    presenting: { concept: 2, scheme: 2, detailed: 3, tender: 2, construction: 2, commissioning: 2 },
    coordination: { concept: 2, scheme: 3, detailed: 4, tender: 3, construction: 3, commissioning: 2 },
    commercial: { concept: 1, scheme: 2, detailed: 2, tender: 3, construction: 2, commissioning: 1 },
  },
  associate: {
    technical: { concept: 3, scheme: 4, detailed: 4, tender: 3, construction: 3, commissioning: 2 },
    communication: { concept: 3, scheme: 3, detailed: 3, tender: 3, construction: 3, commissioning: 2 },
    presenting: { concept: 3, scheme: 3, detailed: 3, tender: 3, construction: 2, commissioning: 2 },
    coordination: { concept: 3, scheme: 4, detailed: 4, tender: 3, construction: 3, commissioning: 2 },
    commercial: { concept: 2, scheme: 3, detailed: 3, tender: 4, construction: 2, commissioning: 1 },
  },
  technician: {
    technical: { concept: 1, scheme: 1, detailed: 2, tender: 2, construction: 2, commissioning: 1 },
    communication: { concept: 0, scheme: 1, detailed: 1, tender: 1, construction: 1, commissioning: 0 },
    presenting: { concept: 0, scheme: 0, detailed: 1, tender: 0, construction: 0, commissioning: 0 },
    coordination: { concept: 0, scheme: 1, detailed: 2, tender: 2, construction: 2, commissioning: 1 },
    commercial: { concept: 0, scheme: 0, detailed: 1, tender: 1, construction: 0, commissioning: 0 },
  },
  seniorTechnician: {
    technical: { concept: 1, scheme: 2, detailed: 3, tender: 3, construction: 3, commissioning: 2 },
    communication: { concept: 1, scheme: 1, detailed: 2, tender: 2, construction: 2, commissioning: 1 },
    presenting: { concept: 0, scheme: 1, detailed: 2, tender: 1, construction: 1, commissioning: 1 },
    coordination: { concept: 1, scheme: 2, detailed: 3, tender: 3, construction: 3, commissioning: 2 },
    commercial: { concept: 0, scheme: 1, detailed: 1, tender: 2, construction: 1, commissioning: 0 },
  },
  bimLead: {
    technical: { concept: 2, scheme: 2, detailed: 3, tender: 3, construction: 2, commissioning: 2 },
    communication: { concept: 2, scheme: 2, detailed: 3, tender: 2, construction: 2, commissioning: 2 },
    presenting: { concept: 1, scheme: 2, detailed: 2, tender: 2, construction: 1, commissioning: 1 },
    coordination: { concept: 2, scheme: 3, detailed: 4, tender: 3, construction: 3, commissioning: 2 },
    commercial: { concept: 1, scheme: 1, detailed: 2, tender: 2, construction: 1, commissioning: 1 },
  },
  leadCoordinator: {
    technical: { concept: 2, scheme: 3, detailed: 4, tender: 3, construction: 3, commissioning: 2 },
    communication: { concept: 2, scheme: 3, detailed: 3, tender: 3, construction: 3, commissioning: 2 },
    presenting: { concept: 2, scheme: 2, detailed: 3, tender: 2, construction: 2, commissioning: 2 },
    coordination: { concept: 3, scheme: 4, detailed: 4, tender: 4, construction: 3, commissioning: 2 },
    commercial: { concept: 1, scheme: 2, detailed: 2, tender: 3, construction: 2, commissioning: 1 },
  },
}

export const LEVEL_EVIDENCE = [0, 2, 6, 14, 26, 40] as const

export function expectedLevel(grade: GradeId, skill: SkillId, stage: StageId): number {
  return EXPECTATIONS[grade]?.[skill]?.[stage] ?? 0
}

export function nextGradeId(grade: GradeId): GradeId | null {
  const map: Partial<Record<GradeId, GradeId>> = {
    graduate: 'engineer',
    engineer: 'senior',
    senior: 'associate',
    technician: 'seniorTechnician',
    seniorTechnician: 'bimLead',
    bimLead: 'leadCoordinator',
  }
  return map[grade] ?? null
}

export function levelFromEvidence(evidence: number): number {
  let level = 0
  for (let i = 1; i < LEVEL_EVIDENCE.length; i++) {
    if (evidence >= LEVEL_EVIDENCE[i]) level = i
  }
  return level
}
