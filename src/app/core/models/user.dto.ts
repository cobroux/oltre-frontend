export interface UserDTO {
  username: string;
  birthDate: string | null;
  age: number | null;
}

export interface UpdateProfileRequest {
  username: string;
  age: number | null;
  birthDate: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserStatsDTO {
  sportSessionsLast30Days: number;
  sportDistanceKmLast30Days: number;
  expensesThisMonth: number;
  tasksInProgress: number;
}