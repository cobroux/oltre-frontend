import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject<AuthService>(AuthService);
    const router = inject<Router>(Router);
    const token = authService.getToken();

    const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(authReq).pipe(
     catchError(err => {
        if (err.status === 401) {
          authService.logout();
         router.navigate(['/login']);
        }
         return throwError(() => err);
        })
  );
};