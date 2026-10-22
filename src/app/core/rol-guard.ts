import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion';

// Exige sesión iniciada (usuario validado por GET /api/auth/yo).
export const sesionGuard: CanActivateFn = () => {
  return !!inject(SesionService).usuario() || inject(Router).createUrlTree(['/login']);
};

// Uso: { path: ..., canActivate: [permisoGuard], data: { permisos: [PERMISOS.crearBloqueo] } }.
// Deja pasar si el usuario tiene ALGUNO de los permisos (los entrega el backend en /api/auth/yo).
// Solo oculta pantallas; la autorización real la valida el backend en cada llamada.
export const permisoGuard: CanActivateFn = (route) => {
  const permisos = (route.data['permisos'] as string[] | undefined) ?? [];
  return inject(SesionService).tieneAlguno(permisos) || inject(Router).createUrlTree(['/dashboard']);
};
