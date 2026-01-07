import { Routes } from '@angular/router';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { ClienteListComponent } from './features/clientes/pages/cliente-list.component';
import { EventosComponent } from './features/eventos/pages/eventos.component';
import { ProfileComponent } from './features/profile/pages/profile.component';

export const routes: Routes = [
  // Ruta principal → Dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'dashboard', component: DashboardComponent },
  { path: 'eventos', component: EventosComponent },

  // Clientes
  { path: 'clientes', component: ClienteListComponent },

  // Usuario
  { path: 'perfil', component: ProfileComponent},

  // Cualquier ruta inválida → Dashboard
  { path: '**', redirectTo: 'dashboard' }
];
