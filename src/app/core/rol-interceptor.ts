import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RolSimuladoService } from './rol-simulado';

export const rolInterceptor: HttpInterceptorFn = (req, next) => {
  const rolService = inject(RolSimuladoService);
  const clonada = req.clone({
    setHeaders: { 'X-Rol-Simulado': rolService.rolActual() }
  });
  return next(clonada);
};