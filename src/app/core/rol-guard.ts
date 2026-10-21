import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion';

// Exige sesión iniciada (usuario validado por GET /api/auth/yo).
export const sesionGuard: CanActivateFn = () => {
  return !!inject(SesionService).usuario() || inject(Router).createUrlTree(['/login']);
};

// Uso: { path: ..., canActivate: [rolGuard], data: { roles: ['Jefatura'] } }.
// Solo oculta pantallas según el rol de la sesión; la autorización real la valida el backend.
export const rolGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] as string[] | undefined) ?? [];
  return roles.includes(inject(SesionService).rol()) || inject(Router).createUrlTree(['/solicitudes']);
};
