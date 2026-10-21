import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SesionService, UsuarioDesarrollo } from '../../core/sesion';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  sesion = inject(SesionService);
  private router = inject(Router);

  // Selector de desarrollo: solo si el build lo permite Y el backend expone /api/auth/dev (Development).
  usuariosDesarrollo = signal<UsuarioDesarrollo[]>([]);
  seleccionado = signal<number | null>(null);
  entrando = signal(false);

  constructor() {
    if (this.sesion.usuario()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (environment.loginDesarrollo) {
      this.sesion.usuariosDesarrollo()
        .then(u => { this.usuariosDesarrollo.set(u); this.seleccionado.set(u[0]?.usuarioId ?? null); })
        .catch(() => this.usuariosDesarrollo.set([]));
    }
  }

  entrarConMicrosoft(): void {
    this.entrando.set(true);
    this.sesion.iniciarConMicrosoft();
  }

  async entrarDesarrollo(): Promise<void> {
    const id = this.seleccionado();
    if (id == null) return;
    this.entrando.set(true);
    const ok = await this.sesion.iniciarDesarrollo(id);
    this.entrando.set(false);
    if (ok) this.router.navigate(['/dashboard']);
  }

  etiqueta(u: UsuarioDesarrollo): string {
    return `${u.rol} — ${u.nombre} (${u.correo})`;
  }
}
