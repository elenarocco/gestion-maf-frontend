import { Routes } from '@angular/router';
import { Panel } from './features/dashboard/panel/panel';
import { ListaTrabajadores } from './features/trabajadores/lista-trabajadores/lista-trabajadores';
import { SelectorTipo } from './features/solicitudes/selector-tipo/selector-tipo';
import { FormularioIngreso } from './features/solicitudes/formulario-ingreso/formulario-ingreso';
import { FormularioBloqueo } from './features/solicitudes/formulario-bloqueo/formulario-bloqueo';
import { FormularioModificacion } from './features/solicitudes/formulario-modificacion/formulario-modificacion';
import { ListaSolicitudes } from './features/solicitudes/lista-solicitudes/lista-solicitudes';
import { FichaTrabajador } from './features/trabajadores/ficha-trabajador/ficha-trabajador';
import { AdministrarCatalogos } from './features/catalogos/administrar-catalogos/administrar-catalogos';
import { NuevaSolicitudVpn } from './features/solicitudes/vpn/nueva-solicitud-vpn/nueva-solicitud-vpn';
import { FichaVpn } from './features/solicitudes/vpn/ficha-vpn/ficha-vpn';
import { BandejaTi } from './features/bandeja-ti/bandeja-ti/bandeja-ti';
import { DetalleSolicitud } from './features/bandeja-ti/detalle-solicitud/detalle-solicitud';
import { permisoGuard, sesionGuard } from './core/rol-guard';
import { PERMISOS, PERMISOS_CREAR_SOLICITUD, PERMISOS_VER_SOLICITUDES } from './core/permisos';
import { Shell } from './shared/shell/shell';
import { Login } from './features/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  // Todo lo demás exige sesión iniciada y se muestra dentro del shell.
  {
    path: '',
    component: Shell,
    canActivate: [sesionGuard],
    children: [
      // Cada pantalla exige alguno de los permisos que entrega el backend; sin él, vuelve al dashboard.
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Panel },
      { path: 'trabajadores', component: ListaTrabajadores, canActivate: [permisoGuard], data: { permisos: [PERMISOS.consultarTrabajadores] } },
      { path: 'trabajadores/:id', component: FichaTrabajador, canActivate: [permisoGuard], data: { permisos: [PERMISOS.consultarTrabajadores] } },
      { path: 'solicitudes', component: ListaSolicitudes, canActivate: [permisoGuard], data: { permisos: PERMISOS_VER_SOLICITUDES } },
      { path: 'solicitudes/nueva', component: SelectorTipo, canActivate: [permisoGuard], data: { permisos: PERMISOS_CREAR_SOLICITUD } },
      { path: 'solicitudes/nueva/ingreso', component: FormularioIngreso, canActivate: [permisoGuard], data: { permisos: [PERMISOS.crearIngreso] } },
      { path: 'solicitudes/bloqueo', component: FormularioBloqueo, canActivate: [permisoGuard], data: { permisos: [PERMISOS.crearBloqueo] } },
      { path: 'solicitudes/modificacion', component: FormularioModificacion, canActivate: [permisoGuard], data: { permisos: [PERMISOS.crearModificacion] } },
      { path: 'solicitudes/vpn/nueva', component: NuevaSolicitudVpn, canActivate: [permisoGuard], data: { permisos: [PERMISOS.solicitarVpn] } },
      { path: 'solicitudes/vpn/:id/ficha', component: FichaVpn, canActivate: [permisoGuard], data: { permisos: [PERMISOS.completarFichaVpn] } },
      // Después de las rutas fijas de /solicitudes/*: el router usa la primera que calza.
      { path: 'solicitudes/:id', component: DetalleSolicitud, canActivate: [permisoGuard], data: { permisos: PERMISOS_VER_SOLICITUDES } },
      { path: 'bandeja-ti', component: BandejaTi, canActivate: [permisoGuard], data: { permisos: [PERMISOS.bandejaTi] } },
      { path: 'bandeja-ti/:id', component: DetalleSolicitud, canActivate: [permisoGuard], data: { permisos: [PERMISOS.bandejaTi] } },
      { path: 'catalogos', component: AdministrarCatalogos, canActivate: [permisoGuard], data: { permisos: [PERMISOS.administrarCatalogos] } },
    ]
  },
  { path: '**', redirectTo: '' }
];
