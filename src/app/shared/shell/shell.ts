import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SesionService } from '../../core/sesion';
import { PERMISOS, PERMISOS_VER_SOLICITUDES } from '../../core/permisos';

type GrupoMenu = 'General' | 'Gestión' | 'Administración';

interface ItemMenu {
  nombre: string;
  ruta: string;
  icono: string;                 // nombre del ícono de Material Symbols
  grupo: GrupoMenu;
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
      { nombre: 'Dashboard', ruta: '/dashboard', icono: 'space_dashboard', grupo: 'General', permisos: [] },
      { nombre: 'Sostenibilidad', ruta: '/sostenibilidad', icono: 'eco', grupo: 'General', permisos: [PERMISOS.verSostenibilidad] },
      { nombre: 'Bandeja de TI', ruta: '/bandeja-ti', icono: 'inbox', grupo: 'Gestión', permisos: [PERMISOS.bandejaTi] },
      { nombre: veTodas ? 'Solicitudes' : 'Mis solicitudes', ruta: '/solicitudes', icono: 'description', grupo: 'Gestión', permisos: PERMISOS_VER_SOLICITUDES },
      { nombre: 'Accesos VPN', ruta: '/accesos-vpn', icono: 'vpn_key', grupo: 'Gestión', permisos: [PERMISOS.bandejaTi, PERMISOS.consultarTodasLasSolicitudes] },
      { nombre: soloSuArea ? 'Mi equipo' : 'Trabajadores', ruta: '/trabajadores', icono: 'group', grupo: 'Gestión', permisos: [PERMISOS.consultarTrabajadores] },
      { nombre: 'Catálogos', ruta: '/catalogos', icono: 'category', grupo: 'Administración', permisos: [PERMISOS.administrarCatalogos] },
      { nombre: 'Usuarios y roles', ruta: '/usuarios', icono: 'admin_panel_settings', grupo: 'Administración', permisos: [PERMISOS.administrarUsuarios] }
    ];
    return items.filter(i => this.sesion.tieneAlguno(i.permisos));
  });

  // Secciones del menú; las que quedan sin opciones para el rol no se muestran.
  grupos = computed(() => {
    const orden: GrupoMenu[] = ['General', 'Gestión', 'Administración'];
    return orden
      .map(nombre => ({ nombre, items: this.menuActual().filter(i => i.grupo === nombre) }))
      .filter(g => g.items.length > 0);
  });

  // Iniciales para el avatar: primer nombre y primer apellido.
  iniciales = computed(() => {
    const partes = (this.sesion.usuario()?.nombre ?? '').trim().split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
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
