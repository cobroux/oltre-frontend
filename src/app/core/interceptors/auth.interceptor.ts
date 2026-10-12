import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { getApiUrl } from '../config/runtime-config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject<AuthService>(AuthService);
    const router = inject<Router>(Router);
    const token = authService.getToken();

    // N'attache le JWT qu'aux requêtes vers notre propre backend - sans ce
    // garde-fou, un futur appel direct vers une API tierce (pas le cas
    // aujourd'hui, tout passe par notre backend) enverrait le token de
    // l'utilisateur à ce tiers.
    const isOwnApi = req.url.startsWith(getApiUrl());
    const authReq = token && isOwnApi
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(authReq).pipe(
     catchError(err => {
        const isGarminRequest = req.url.includes('/api/garmin/');
        if (err.status === 401 && !isGarminRequest) {
          authService.logout();
         router.navigate(['/login']);
        }
         return throwError(() => err);
        })
  );
};