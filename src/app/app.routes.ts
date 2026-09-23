import { Routes } from '@angular/router';
import { ExpensesComponent } from './features/expenses/expenses';
import { TasksComponent } from './features/tasks/tasks';
import { FoodComponent } from './features/food/food';
import { AppointmentComponent } from './features/appointment/appointment';
import { CalendarComponent } from './features/calendar/calendar';
import { SportComponent } from './features/sport/sport';
import { LoginComponent } from './features/login/login';
import { RegisterComponent } from './features/register/register';
import { authGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'expenses', component: ExpensesComponent, canActivate: [authGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard] },
  { path: 'food', component: FoodComponent, canActivate: [authGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
  { path: 'sport', component: SportComponent, canActivate: [authGuard] },
  { path: 'habits', component: AppointmentComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'expenses', pathMatch: 'full' }
];
