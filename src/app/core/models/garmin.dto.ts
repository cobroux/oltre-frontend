export interface GarminActivity {
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
}

export interface SportRecord {
  sportType: string;
  bestDistanceKm?: number;
  bestDistanceDate?: string;
  bestElevationGainM?: number;
  bestElevationDate?: string;
  bestAvgSpeedKmh?: number;
  bestAvgSpeedDate?: string;
}

export interface GarminWeekStats {
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
