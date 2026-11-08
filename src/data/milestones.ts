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
      target: 16,
      actions: ['calc-package'],
    },
    {
      id: 'designReview',
      label: 'Pass a design review',
      path: 'delivery',
      target: 4,
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
      target: 14,
      actions: ['drawing-set'],
    },
    {
      id: 'charterLog',
      label: 'Build chartership log (12 CPD / commitment blocks)',
      path: 'commitment',
      target: 12,
      actions: [
        'chartership-log',
        'cpd-friday',
        'risk-review',
        'carbon-option',
        'conduct-dilemma',
      ],
      perAction: 1,
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
      label: 'Pass Professional Review',
      path: 'commitment',
      target: 1,
      actions: ['professional-review'],
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
      id: 'drawingQa',
      label: 'Pass a drawing QA check',
      path: 'technical',
      target: 4,
      actions: ['drawing-set', 'peer-check'],
    },
    {
      id: 'siteVisits',
      label: 'Log site visits',
      path: 'collaboration',
      target: 12,
      actions: ['site-visit'],
    },
    {
      id: 'secondPackage',
      label: 'Learn a second package (Revit)',
      path: 'technical',
      target: 3,
      actions: ['learn-revit', 'model-layouts'],
    },
    {
      id: 'charterLog',
      label: 'Start a CPD log',
      path: 'leadership',
      target: 6,
      actions: ['chartership-log', 'cpd-friday', 'peer-check'],
    },
  ],
  seniorTechnician: [
    {
      id: 'leadModel',
      label: 'Lead a discipline model',
      path: 'technical',
      target: 8,
      actions: ['model-layouts', 'clash-cycle', 'drawing-set'],
    },
    {
      id: 'trainTech',
      label: 'Train a technician',
      path: 'leadership',
      target: 4,
      actions: ['mentor-junior', 'peer-check', 'ask-mentor'],
    },
    {
      id: 'clashFree',
      label: 'Deliver a clash-free floor',
      path: 'collaboration',
      target: 6,
      actions: ['clash-cycle', 'work-across'],
    },
    {
      id: 'automate',
      label: 'Automate one repetitive task',
      path: 'technical',
      target: 3,
      actions: ['automate'],
    },
    {
      id: 'tenderSet',
      label: 'Issue a tender set on time',
      path: 'delivery',
      target: 6,
      actions: ['drawing-set', 'timesheets'],
    },
  ],
}

export function milestonesFor(grade: GradeId): MilestoneSpec[] {
  return MILESTONE_SPECS[grade] ?? MILESTONE_SPECS.graduate ?? []
}
