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

export interface RunningRecord {
  label: string;
  targetDistanceKm: number;
  distanceKm: number;
  durationSeconds: number;
  date: string;
}

export interface GarminRecords {
  runningRecords: RunningRecord[];
  otherRecords: SportRecord[];
}

export interface GarminRecordsResponse {
  allTime: GarminRecords;
  thisYear: GarminRecords;
}

export interface GarminLatLon {
  lat: number;
  lon: number;
}

export interface GarminSplit {
  distance: number;
  duration: number;
  elevationGain?: number;
  averageSpeed?: number;
  averageHR?: number;
}

export interface GarminExerciseSet {
  name: string | null;
  reps: number | null;
  weightKg: number | null;
  duration: number | null;
}

export interface GarminActivityDetail {
  activityId: string;
  name: string | null;
  sportType: string | null;
  startLocal: string | null;
  distance: number | null;
  duration: number | null;
  elevationGain: number | null;
  elevationLoss: number | null;
  calories: number | null;
  averageHR: number | null;
  maxHR: number | null;
  averageSpeed: number | null;
  maxSpeed: number | null;
  polyline: GarminLatLon[] | null;
  splits: GarminSplit[];
  exerciseSets: GarminExerciseSet[];
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
