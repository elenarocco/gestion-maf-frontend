import { Routes } from '@angular/router';
import { permisoGuard, sesionGuard } from './core/rol-guard';
import { PERMISOS, PERMISOS_CREAR_SOLICITUD, PERMISOS_VER_SOLICITUDES } from './core/permisos';
import { Shell } from './shared/shell/shell';

// Cada pantalla se carga bajo demanda (loadComponent): al entrar solo se descarga el login y el menú,
// y el código de una pantalla se baja la primera vez que se abre.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.Login) },
  // Todo lo demás exige sesión iniciada y se muestra dentro del shell.
  {
    path: '',
    component: Shell,
    canActivate: [sesionGuard],
    children: [
      // Cada pantalla exige alguno de los permisos que entrega el backend; sin él, vuelve al dashboard.
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/panel/panel').then(m => m.Panel) },
      { path: 'trabajadores', loadComponent: () => import('./features/trabajadores/lista-trabajadores/lista-trabajadores').then(m => m.ListaTrabajadores), canActivate: [permisoGuard], data: { permisos: [PERMISOS.consultarTrabajadores] } },
      { path: 'trabajadores/:id', loadComponent: () => import('./features/trabajadores/ficha-trabajador/ficha-trabajador').then(m => m.FichaTrabajador), canActivate: [permisoGuard], data: { permisos: [PERMISOS.consultarTrabajadores] } },
      { path: 'solicitudes', loadComponent: () => import('./features/solicitudes/lista-solicitudes/lista-solicitudes').then(m => m.ListaSolicitudes), canActivate: [permisoGuard], data: { permisos: PERMISOS_VER_SOLICITUDES } },
      { path: 'solicitudes/nueva', loadComponent: () => import('./features/solicitudes/selector-tipo/selector-tipo').then(m => m.SelectorTipo), canActivate: [permisoGuard], data: { permisos: PERMISOS_CREAR_SOLICITUD } },
      { path: 'solicitudes/nueva/ingreso', loadComponent: () => import('./features/solicitudes/formulario-ingreso/formulario-ingreso').then(m => m.FormularioIngreso), canActivate: [permisoGuard], data: { permisos: [PERMISOS.crearIngreso] } },
      { path: 'solicitudes/bloqueo', loadComponent: () => import('./features/solicitudes/formulario-bloqueo/formulario-bloqueo').then(m => m.FormularioBloqueo), canActivate: [permisoGuard], data: { permisos: [PERMISOS.crearBloqueo] } },
      { path: 'solicitudes/modificacion', loadComponent: () => import('./features/solicitudes/formulario-modificacion/formulario-modificacion').then(m => m.FormularioModificacion), canActivate: [permisoGuard], data: { permisos: [PERMISOS.crearModificacion] } },
      { path: 'solicitudes/vpn/nueva', loadComponent: () => import('./features/solicitudes/vpn/nueva-solicitud-vpn/nueva-solicitud-vpn').then(m => m.NuevaSolicitudVpn), canActivate: [permisoGuard], data: { permisos: [PERMISOS.solicitarVpn] } },
      { path: 'solicitudes/vpn/:id/ficha', loadComponent: () => import('./features/solicitudes/vpn/ficha-vpn/ficha-vpn').then(m => m.FichaVpn), canActivate: [permisoGuard], data: { permisos: [PERMISOS.completarFichaVpn] } },
      // Después de las rutas fijas de /solicitudes/*: el router usa la primera que calza.
      { path: 'solicitudes/:id', loadComponent: () => import('./features/bandeja-ti/detalle-solicitud/detalle-solicitud').then(m => m.DetalleSolicitud), canActivate: [permisoGuard], data: { permisos: PERMISOS_VER_SOLICITUDES } },
      { path: 'bandeja-ti', loadComponent: () => import('./features/bandeja-ti/bandeja-ti/bandeja-ti').then(m => m.BandejaTi), canActivate: [permisoGuard], data: { permisos: [PERMISOS.bandejaTi] } },
      { path: 'bandeja-ti/:id', loadComponent: () => import('./features/bandeja-ti/detalle-solicitud/detalle-solicitud').then(m => m.DetalleSolicitud), canActivate: [permisoGuard], data: { permisos: [PERMISOS.bandejaTi] } },
      { path: 'catalogos', loadComponent: () => import('./features/catalogos/administrar-catalogos/administrar-catalogos').then(m => m.AdministrarCatalogos), canActivate: [permisoGuard], data: { permisos: [PERMISOS.administrarCatalogos] } },
      { path: 'usuarios', loadComponent: () => import('./features/usuarios/administrar-usuarios/administrar-usuarios').then(m => m.AdministrarUsuarios), canActivate: [permisoGuard], data: { permisos: [PERMISOS.administrarUsuarios] } },
    ]
  },
  { path: '**', redirectTo: '' }
];
