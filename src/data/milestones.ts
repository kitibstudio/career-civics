import type { GradeId, PathId } from './types'

export interface MilestoneSpec {
  id: string
  label: string
  path: PathId
  /** Progress units needed to complete. */
  target: number
  /** Action ids that add +1 (or more) progress. */
  actions: string[]
  /** Optional: how much each matching action adds (default 1). */
  perAction?: number
}

export const MILESTONE_SPECS: Partial<Record<GradeId, MilestoneSpec[]>> = {
  graduate: [
    {
      id: 'calcPackage',
      label: 'Own a calc package',
      path: 'technical',
      target: 8,
      actions: ['calc-package'],
    },
    {
      id: 'designReview',
      label: 'Pass a design review',
      path: 'delivery',
      target: 2,
      actions: ['design-review'],
    },
    {
      id: 'siteVisits',
      label: 'Log 20 site visits',
      path: 'collaboration',
      target: 20,
      actions: ['site-visit'],
    },
    {
      id: 'drawingSet',
      label: 'Complete a full drawing set',
      path: 'delivery',
      target: 10,
      actions: ['drawing-set'],
    },
    {
      id: 'charterLog',
      label: 'Start a chartership log',
      path: 'leadership',
      target: 4,
      actions: ['chartership-log', 'cpd-friday'],
    },
  ],
  engineer: [
    {
      id: 'leadSmall',
      label: 'Lead a discipline on a small project',
      path: 'leadership',
      target: 6,
      actions: ['work-across', 'mentor-junior', 'client-meeting'],
    },
    {
      id: 'clientSolo',
      label: 'Client meeting solo',
      path: 'collaboration',
      target: 3,
      actions: ['client-meeting'],
    },
    {
      id: 'specSection',
      label: 'Sign off a spec section',
      path: 'technical',
      target: 6,
      actions: ['calc-package', 'drawing-set', 'timesheets'],
    },
    {
      id: 'mentorGrad',
      label: 'Mentor a graduate',
      path: 'leadership',
      target: 4,
      actions: ['mentor-junior'],
    },
    {
      id: 'chartership',
      label: 'Achieve chartership',
      path: 'technical',
      target: 12,
      actions: ['chartership-log', 'cpd-friday'],
    },
  ],
  technician: [
    {
      id: 'layoutSet',
      label: 'Complete a layout set',
      path: 'delivery',
      target: 8,
      actions: ['model-layouts', 'drawing-set'],
    },
    {
      id: 'clashCycle',
      label: 'Run a clash cycle',
      path: 'collaboration',
      target: 4,
      actions: ['clash-cycle'],
    },
    {
      id: 'siteVisits',
      label: 'Log 20 site visits',
      path: 'collaboration',
      target: 20,
      actions: ['site-visit'],
    },
    {
      id: 'secondPackage',
      label: 'Learn a second package (Revit)',
      path: 'technical',
      target: 6,
      actions: ['learn-revit'],
    },
    {
      id: 'charterLog',
      label: 'Start a CPD log',
      path: 'leadership',
      target: 4,
      actions: ['chartership-log', 'cpd-friday'],
    },
  ],
}

export function milestonesFor(grade: GradeId): MilestoneSpec[] {
  return MILESTONE_SPECS[grade] ?? MILESTONE_SPECS.graduate ?? []
}
