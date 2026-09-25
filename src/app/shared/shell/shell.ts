import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RolSimuladoService {
  rolActual = signal<string>('SuperAdmin');
}
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatSidenavModule, MatListModule, MatSelectModule, MatFormFieldModule, FormsModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  constructor(public rolService: RolSimuladoService) { }

  roles = ['SuperAdmin', 'AdminTI', 'Jefatura', 'RRHH', 'Auditoria'];

  menuPorRol: Record<string, { nombre: string, ruta: string }[]> = {
    SuperAdmin: [
      { nombre: 'Trabajadores', ruta: '/trabajadores' },
      { nombre: 'Solicitudes', ruta: '/solicitudes' },
      { nombre: 'Catálogos', ruta: '/catalogos' },
      { nombre: 'Roles y Permisos', ruta: '/roles' },
    ],
    AdminTI: [
      { nombre: 'Trabajadores', ruta: '/trabajadores' },
      { nombre: 'Solicitudes', ruta: '/solicitudes' },
      { nombre: 'Catálogos', ruta: '/catalogos' },
    ],
    Jefatura: [
      { nombre: 'Mi Equipo', ruta: '/trabajadores' },
      { nombre: 'Mis Solicitudes', ruta: '/solicitudes' },
    ],
    RRHH: [
      { nombre: 'Solicitudes de Bloqueo', ruta: '/solicitudes' },
    ],
    Auditoria: [
      { nombre: 'Trabajadores', ruta: '/trabajadores' },
      { nombre: 'Historial de Solicitudes', ruta: '/solicitudes' },
    ],
  };

  get menuActual() {
    return this.menuPorRol[this.rolService.rolActual()] ?? [];
  }
}