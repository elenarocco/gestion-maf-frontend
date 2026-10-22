import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SesionService } from '../../core/sesion';
import { PERMISOS, PERMISOS_CREAR_SOLICITUD, PERMISOS_VER_SOLICITUDES } from '../../core/permisos';

interface ItemMenu {
  nombre: string;
  ruta: string;
  permisos: readonly string[];   // se muestra si el usuario tiene alguno (vacío = todos)
  tambien?: string[];            // otras rutas que pertenecen a esta opción (para marcarla activa)
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  sesion = inject(SesionService);
  private router = inject(Router);

  // El menú sale de los permisos que entrega el backend, no del nombre del rol:
  // si a un rol se le da o quita un permiso en la BD, el menú lo refleja solo.
  menuActual = computed<ItemMenu[]>(() => {
    const soloSuArea = this.sesion.soloSuArea();
    const veTodas = this.sesion.tienePermiso(PERMISOS.consultarTodasLasSolicitudes);
    const items: ItemMenu[] = [
      { nombre: 'Dashboard', ruta: '/dashboard', permisos: [] },
      { nombre: soloSuArea ? 'Mi equipo' : 'Trabajadores', ruta: '/trabajadores', permisos: [PERMISOS.consultarTrabajadores] },
      { nombre: 'Bandeja de TI', ruta: '/bandeja-ti', permisos: [PERMISOS.bandejaTi] },
      { nombre: 'Nueva solicitud', ruta: '/solicitudes/nueva', permisos: PERMISOS_CREAR_SOLICITUD,
        tambien: ['/solicitudes/bloqueo', '/solicitudes/modificacion'] },
      { nombre: veTodas ? 'Solicitudes' : 'Mis solicitudes', ruta: '/solicitudes', permisos: PERMISOS_VER_SOLICITUDES },
      { nombre: 'Solicitudes VPN', ruta: '/solicitudes/vpn', permisos: [PERMISOS.solicitarVpn] },
      { nombre: 'Catálogos', ruta: '/catalogos', permisos: [PERMISOS.administrarCatalogos] }
    ];
    return items.filter(i => this.sesion.tieneAlguno(i.permisos));
  });

  private url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Solo se marca la opción más específica que coincide con la URL: en /solicitudes/vpn se marca
  // "Solicitudes VPN" y no también "Mis solicitudes" (/solicitudes).
  rutaActiva = computed(() => {
    const url = this.url().split(/[?#]/)[0];
    const coincide = (r: string) => url === r || url.startsWith(r + '/');
    return this.menuActual()
      .flatMap(i => [i.ruta, ...(i.tambien ?? [])].filter(coincide).map(r => ({ item: i.ruta, largo: r.length })))
      .sort((a, b) => b.largo - a.largo)[0]?.item ?? null;
  });

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
