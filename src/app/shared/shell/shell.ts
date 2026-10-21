import { Component,computed, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RolSimuladoService } from '../../core/rol-simulado';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  private router = inject(Router);

  constructor(public rolService: RolSimuladoService) { }

  roles = ['Super Admin', 'Admin TI', 'Jefatura', 'RRHH', 'Auditoría'];
  puedeCrearSolicitud = computed(() => {
    const rol = this.rolService.rolActual();
    const rolesPermitidos = ['SuperAdmin', 'AdminTI', 'Jefatura'];
    
    return rolesPermitidos.includes(rol);
  });
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
    return this.menuPorRol[this.rolService.rolActual()] ?? [];
  }

  cambiarRol(nuevoRol: string): void {
    if (nuevoRol === this.rolService.rolActual()) return;
    this.rolService.rolActual.set(nuevoRol);
    this.recargarPantalla();
  }

  cambiarUsuario(valor: string): void {
    const id = Number(valor);
    if (!Number.isInteger(id) || id < 1 || id === this.rolService.usuarioId()) return;
    this.rolService.usuarioId.set(id);
    this.recargarPantalla();
  }

  // Vuelve a crear la pantalla actual: el guard se evalúa con el rol nuevo (si no tiene acceso, redirige)
  // y la pantalla pide de nuevo sus datos, con las acciones que el backend permite a ese rol.
  private recargarPantalla(): void {
    const url = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true })
      .then(() => this.router.navigateByUrl(url));
  }
}