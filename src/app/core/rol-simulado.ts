import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RolSimuladoService {
  rolActual = signal<string>('Super Admin');
  // TEMPORAL: id de UsuarioSistema que actúa, hasta tener login real (header X-Usuario-Simulado).
  usuarioId = signal<number>(1);
}
