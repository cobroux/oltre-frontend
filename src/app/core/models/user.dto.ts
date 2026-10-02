export interface UserDTO {
  username: string;
  birthDate: string;
  age: number;
}

export interface UserStatsDTO {
  sportSessionsLast30Days: number;
  sportDistanceKmLast30Days: number;
  expensesThisMonth: number;
  tasksInProgress: number;
}