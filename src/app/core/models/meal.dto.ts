export interface MealDTO {
  id: number;
  mealName: string;
  mealDescript?: string;
  mealType: 'PETIT_DEJ' | 'DEJEUNER' | 'DINER' | 'COLLATION';
  mealDate: string;
}