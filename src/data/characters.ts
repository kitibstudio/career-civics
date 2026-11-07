import type { CharacterDef } from './types'

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'aisha',
    name: 'Aisha',
    route: 'MSc graduate · Electrical',
    discipline: 'electrical',
    track: 'engineer',
    backstory:
      'Top of her class; first job in a large consultancy. She trusts the calc more than the corridor chat.',
    skills: {
      technical: 2,
      communication: 1,
      presenting: 0,
      coordination: 1,
      commercial: 0,
    },
    strength: 'Calc accuracy — fewer error events',
    blindSpot: 'Rarely asks questions; struggles alone too long',
  },
  {
    id: 'rohan',
    name: 'Rohan',
    route: 'BEng graduate · Mechanical',
    discipline: 'mechanical',
    track: 'engineer',
    backstory:
      'Summer placements with a contractor taught him what site looks like. He wants drawings in the world, not only on paper.',
    skills: {
      technical: 1,
      communication: 2,
      presenting: 1,
      coordination: 1,
      commercial: 0,
    },
    strength: 'Site sense — extra value from site visits',
    blindSpot: 'Rushes calcs to get to drawings',
  },
  {
    id: 'maya',
    name: 'Maya',
    route: 'Part 2 graduate · Architect',
    discipline: 'architect',
    track: 'engineer',
    backstory:
      'Design-studio star, new to technical delivery. She can hold a room; plant rooms still surprise her.',
    skills: {
      technical: 1,
      communication: 2,
      presenting: 2,
      coordination: 1,
      commercial: 0,
    },
    strength: 'Presenting — client meetings go well early',
    blindSpot: 'Underestimates MEP space needs',
  },
  {
    id: 'sam',
    name: 'Sam',
    route: 'MEP Technician · Electrical bias',
    discipline: 'technician',
    track: 'technician',
    backstory:
      'Drafting diploma and two years producing layouts. Confident in AutoCAD, new to Revit.',
    skills: {
      technical: 2,
      communication: 1,
      presenting: 0,
      coordination: 2,
      commercial: 0,
    },
    strength: 'Fast production — layouts and sheets cost fewer Hours',
    blindSpot: 'Models from old markups without checking latest calcs',
    software: ['autocad'],
  },
]
