export type SportGoalType = 'Marathon' | 'SemiMarathon' | 'TenK' | 'Triathlon' | 'Other';

export interface SportGoalDTO {
  id?: number;
  goalType: SportGoalType;
  name: string;
  eventDate: string;
  targetTime?: string | null;
}

export interface PlanDayDTO {
  day: string;
  type: 'Rest' | 'Run' | 'Ride' | 'Swim' | 'Other';
  label: string;
  distanceKm?: number | null;
  done: boolean;
}

export interface CoachPlanDTO {
  generatedAt: string;
  analysis: string;
  days: PlanDayDTO[];
}
