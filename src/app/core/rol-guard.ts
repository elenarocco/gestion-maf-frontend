import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolSimuladoService } from './rol-simulado';

// Uso: { path: ..., canActivate: [rolGuard], data: { roles: ['Jefatura'] } }.
// Solo oculta pantallas; la autorización real la valida el backend.
export const rolGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] as string[] | undefined) ?? [];
  const rol = inject(RolSimuladoService).rolActual();
  return roles.includes(rol) || inject(Router).createUrlTree(['/solicitudes']);
};
