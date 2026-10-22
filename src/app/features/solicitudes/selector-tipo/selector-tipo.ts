import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionService } from '../../../core/sesion';
import { PERMISOS } from '../../../core/permisos';

@Component({
  selector: 'app-selector-tipo',
  imports: [RouterLink],
  templateUrl: './selector-tipo.html',
  styleUrl: './selector-tipo.scss'
})
export class SelectorTipo {
  private sesion = inject(SesionService);

  private todos = [
    { nombre: 'Ingreso', desc: 'Crear un nuevo usuario e ingresar accesos iniciales al sistema.', ruta: '/solicitudes/nueva/ingreso', permiso: PERMISOS.crearIngreso },
    { nombre: 'Modificación', desc: 'Actualizar cargo, área o accesos de un usuario existente.', ruta: '/solicitudes/modificacion', permiso: PERMISOS.crearModificacion },
    { nombre: 'Bloqueo', desc: 'Suspender o dar de baja todos los accesos de un usuario.', ruta: '/solicitudes/bloqueo', permiso: PERMISOS.crearBloqueo },
    { nombre: 'VPN', desc: 'Habilitar acceso remoto seguro para un proveedor externo.', ruta: '/solicitudes/vpn/nueva', permiso: PERMISOS.solicitarVpn }
  ];

  // Solo los tipos que el rol puede crear, según los permisos del backend.
  tipos = computed(() => this.todos.filter(t => this.sesion.tienePermiso(t.permiso)));
}