import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RolSimuladoService } from './rol-simulado';

export const rolInterceptor: HttpInterceptorFn = (req, next) => {
  const rolService = inject(RolSimuladoService);
  const clonada = req.clone({
    setHeaders: {
      'X-Rol-Simulado': rolService.rolActual(),
      'X-Usuario-Simulado': String(rolService.usuarioId())
    }
  });
  return next(clonada);
};
