import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/today/today').then(m => m.TodayComponent), canActivate: [authGuard], pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/register/register').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/reset-password/reset-password').then(m => m.ResetPasswordComponent) },
  { path: 'cgu', loadComponent: () => import('./features/legal/cgu').then(m => m.CguComponent) },
  { path: 'confidentialite', loadComponent: () => import('./features/legal/confidentialite').then(m => m.ConfidentialiteComponent) },
  { path: 'profile', loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'settings', loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent), canActivate: [authGuard] },
  { path: 'expenses', loadComponent: () => import('./features/expenses/expenses').then(m => m.ExpensesComponent), canActivate: [authGuard] },
  { path: 'tasks', loadComponent: () => import('./features/tasks/tasks').then(m => m.TasksComponent), canActivate: [authGuard] },
  { path: 'food', loadComponent: () => import('./features/food/food').then(m => m.FoodComponent), canActivate: [authGuard] },
  { path: 'calendar', loadComponent: () => import('./features/calendar/calendar').then(m => m.CalendarComponent), canActivate: [authGuard] },
  { path: 'sport', loadComponent: () => import('./features/sport/sport').then(m => m.SportComponent), canActivate: [authGuard] },
  { path: 'sport/coach', loadComponent: () => import('./features/coach/coach').then(m => m.CoachComponent), canActivate: [authGuard] },
  { path: 'appointments', loadComponent: () => import('./features/appointment/appointment').then(m => m.AppointmentComponent), canActivate: [authGuard] },
  { path: 'habits', redirectTo: 'appointments' },
  { path: '**', redirectTo: '' }
];
