import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-selector-tipo',
  imports: [RouterLink],
  templateUrl: './selector-tipo.html',
  styleUrl: './selector-tipo.scss'
})
export class SelectorTipo {
  tipos = [
    { nombre: 'Ingreso', desc: 'Crear un nuevo usuario e ingresar accesos iniciales al sistema.', ruta: '/solicitudes/nueva/ingreso', disponible: true },
    { nombre: 'Modificación', desc: 'Actualizar cargo, área o accesos de un usuario existente.', ruta: '', disponible: false },
    { nombre: 'Bloqueo', desc: 'Suspender o dar de baja todos los accesos de un usuario.', ruta: '/solicitudes/bloqueo', disponible: true },
    { nombre: 'VPN', desc: 'Habilitar acceso remoto seguro para un proveedor externo.', ruta: '', disponible: false }
  ];
}