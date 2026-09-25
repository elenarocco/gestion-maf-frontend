import { Routes } from '@angular/router';
import { ListaTrabajadores } from './features/trabajadores/lista-trabajadores/lista-trabajadores';
import { Panel } from './features/dashboard/panel/panel';
export const routes: Routes = [
  { path: 'dashboard', component: Panel },
  { path: '', redirectTo: 'trabajadores', pathMatch: 'full' }
];