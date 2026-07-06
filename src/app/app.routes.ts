import { Routes } from '@angular/router';
import { ExpensesComponent } from './features/expenses/expenses';
import { TasksComponent } from './features/tasks/tasks';

export const routes: Routes = [
  { path: 'expenses', component: ExpensesComponent },
  { path: 'tasks', component: TasksComponent }
];
