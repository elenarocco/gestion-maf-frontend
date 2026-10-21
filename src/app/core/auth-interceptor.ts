import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SesionService } from './sesion';

// Agrega "Authorization: Bearer <token>" a las llamadas a la API (token de Entra ID o de desarrollo).
// Si la API responde 401 con sesión abierta, la sesión venció: se vuelve al login.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || req.url.startsWith(`${environment.apiUrl}/auth/dev/`)) {
    return next(req);
  }

  const sesion = inject(SesionService);
  const router = inject(Router);

  return from(sesion.token()).pipe(
    switchMap(token => next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req)),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && sesion.usuario()) {
        sesion.expirar();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
