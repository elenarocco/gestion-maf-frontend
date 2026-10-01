import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { RolSimuladoService } from '../../core/rol-simulado';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSelectModule, MatFormFieldModule, FormsModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  constructor(public rolService: RolSimuladoService) { }

  roles = ['SuperAdmin', 'AdminTI', 'Jefatura', 'RRHH', 'Auditoria'];

  menuPorRol: Record<string, { nombre: string, ruta: string }[]> = {
    SuperAdmin: [
      { nombre: 'Dashboard', ruta: '/dashboard' },
      { nombre: 'Trabajadores', ruta: '/trabajadores' },
      { nombre: 'Solicitudes', ruta: '/solicitudes' },
      { nombre: 'Catálogos', ruta: '/catalogos' },
      { nombre: 'Roles y Permisos', ruta: '/roles' },
    ],
    AdminTI: [
      { nombre: 'Dashboard', ruta: '/dashboard' },
      { nombre: 'Trabajadores', ruta: '/trabajadores' },
      { nombre: 'Solicitudes', ruta: '/solicitudes' },
      { nombre: 'Catálogos', ruta: '/catalogos' },
    ],
    Jefatura: [
      { nombre: 'Dashboard', ruta: '/dashboard' },
      { nombre: 'Mi Equipo', ruta: '/trabajadores' },
      { nombre: 'Mis Solicitudes', ruta: '/solicitudes' },
    ],
    RRHH: [
      { nombre: 'Dashboard', ruta: '/dashboard' },
      { nombre: 'Solicitudes de Bloqueo', ruta: '/solicitudes' },
    ],
    Auditoria: [
      { nombre: 'Dashboard', ruta: '/dashboard' },
      { nombre: 'Trabajadores', ruta: '/trabajadores' },
      { nombre: 'Historial de Solicitudes', ruta: '/solicitudes' },
    ],
  };

  get menuActual() {
    return this.menuPorRol[this.rolService.rolActual()] ?? [];
  }

  cambiarRol(nuevoRol: string): void {
    this.rolService.rolActual.set(nuevoRol);
  }
}