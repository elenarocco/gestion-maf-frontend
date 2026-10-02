import { Routes } from '@angular/router';
import { Panel } from './features/dashboard/panel/panel';
import { ListaTrabajadores } from './features/trabajadores/lista-trabajadores/lista-trabajadores';
import { SelectorTipo } from './features/solicitudes/selector-tipo/selector-tipo';
import { FormularioIngreso } from './features/solicitudes/formulario-ingreso/formulario-ingreso';
import { ListaSolicitudes } from './features/solicitudes/lista-solicitudes/lista-solicitudes';

export const routes: Routes = [
  { path: 'dashboard', component: Panel },
  { path: 'trabajadores', component: ListaTrabajadores },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'solicitudes/nueva', component: SelectorTipo },
  { path: 'solicitudes/nueva/ingreso', component: FormularioIngreso },
  { path: 'solicitudes', component: ListaSolicitudes },
];