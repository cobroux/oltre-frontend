import { Routes } from '@angular/router';
import { ExpensesComponent } from './features/expenses/expenses';
import { TasksComponent } from './features/tasks/tasks';
import { FoodComponent } from './features/food/food';
import { AppointmentsComponent } from './features/appointment/appointment';

export const routes: Routes = [
  { path: 'expenses', component: ExpensesComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'habits', component: AppointmentsComponent },
    { path: 'food', component: FoodComponent }

];
