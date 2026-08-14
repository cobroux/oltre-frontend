export interface StravaActivity {
  id: string;
  name: string;
  sportType: string;
  startLocal: string; 
  description?: string;
  distance: number;
  movingTime: number;
  elevationGain: number;
  avgSpeed: number;
  maxSpeed: number;
  calories: number;
  relativeEffort: number;
  kudosCount: number;
  achievementCount: number;
  prCount: number;
}

export interface StravaWeekStats {
  totalCalories: number;
  runCount: number;
  runDistance: number;
  runCalories: number;
  rideCount: number;
  rideDistance: number;
  rideCalories: number;
  weightCount: number;
  weightCalories: number;
  swimCount: number; 
  swimDistance: number;
  runElevation: number;
  rideElevation: number; 
  totalActivities: number;
}