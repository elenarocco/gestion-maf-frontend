import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RolSimuladoService {
  rolActual = signal<string>('Super Admin');
}