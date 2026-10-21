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
import { MisSolicitudesVpn } from './features/solicitudes/vpn/mis-solicitudes-vpn/mis-solicitudes-vpn';
import { NuevaSolicitudVpn } from './features/solicitudes/vpn/nueva-solicitud-vpn/nueva-solicitud-vpn';
import { FichaVpn } from './features/solicitudes/vpn/ficha-vpn/ficha-vpn';
import { BandejaTi } from './features/bandeja-ti/bandeja-ti/bandeja-ti';
import { DetalleSolicitud } from './features/bandeja-ti/detalle-solicitud/detalle-solicitud';
import { rolGuard, sesionGuard } from './core/rol-guard';
import { Shell } from './shared/shell/shell';
import { Login } from './features/login/login';
import { ROLES_JEFATURA_VPN } from './core/solicitud-vpn';
import { ROLES_BANDEJA_TI } from './core/bandeja-ti';

export const routes: Routes = [
  { path: 'login', component: Login },
  // Todo lo demás exige sesión iniciada y se muestra dentro del shell.
  {
    path: '',
    component: Shell,
    canActivate: [sesionGuard],
    children: [
      { path: 'dashboard', component: Panel },
      { path: 'trabajadores', component: ListaTrabajadores },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'solicitudes/nueva', component: SelectorTipo },
      { path: 'solicitudes/nueva/ingreso', component: FormularioIngreso },
      { path: 'solicitudes/bloqueo', component: FormularioBloqueo },
      { path: 'solicitudes/modificacion', component: FormularioModificacion },
      { path: 'solicitudes/vpn', component: MisSolicitudesVpn, canActivate: [rolGuard], data: { roles: ROLES_JEFATURA_VPN } },
      { path: 'solicitudes/vpn/nueva', component: NuevaSolicitudVpn, canActivate: [rolGuard], data: { roles: ROLES_JEFATURA_VPN } },
      { path: 'solicitudes/vpn/:id/ficha', component: FichaVpn, canActivate: [rolGuard], data: { roles: ROLES_JEFATURA_VPN } },
      { path: 'bandeja-ti', component: BandejaTi, canActivate: [rolGuard], data: { roles: ROLES_BANDEJA_TI } },
      { path: 'bandeja-ti/:id', component: DetalleSolicitud, canActivate: [rolGuard], data: { roles: ROLES_BANDEJA_TI } },
      { path: 'solicitudes', component: ListaSolicitudes },
      { path: 'trabajadores/:id', component: FichaTrabajador },
      { path: 'catalogos', component: AdministrarCatalogos },
    ]
  },
  { path: '**', redirectTo: '' }
];
