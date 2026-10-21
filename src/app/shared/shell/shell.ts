import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SesionService } from '../../core/sesion';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  sesion = inject(SesionService);
  private router = inject(Router);

  menuPorRol: Record<string, { nombre: string, ruta: string }[]> = {
  'Super Admin': [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Trabajadores', ruta: '/trabajadores' },
    { nombre: 'Solicitudes', ruta: '/solicitudes' },
    { nombre: 'Catálogos', ruta: '/catalogos' },
    { nombre: 'Roles y Permisos', ruta: '/roles' },
  ],
  'Admin TI': [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Trabajadores', ruta: '/trabajadores' },
    { nombre: 'Bandeja de TI', ruta: '/bandeja-ti' },
    { nombre: 'Solicitudes', ruta: '/solicitudes' },
    { nombre: 'Catálogos', ruta: '/catalogos' },
  ],
  'Jefatura': [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Mi Equipo', ruta: '/trabajadores' },
    { nombre: 'Mis Solicitudes', ruta: '/solicitudes' },
    { nombre: 'Solicitudes VPN', ruta: '/solicitudes/vpn' },
  ],
  'RRHH': [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Solicitudes de Bloqueo', ruta: '/solicitudes' },
  ],
  'Auditoría': [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Trabajadores', ruta: '/trabajadores' },
    { nombre: 'Historial de Solicitudes', ruta: '/solicitudes' },
  ],
};

  get menuActual() {
    return this.menuPorRol[this.sesion.rol()] ?? [];
  }

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
