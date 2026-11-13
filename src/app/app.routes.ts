import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { ClientePedidos } from './features/cliente-pedidos/cliente-pedidos';
import { Mesas } from './features/mesas/mesas';
import { Cocina } from './features/cocina/cocina';
import { Caja } from './features/caja/caja';
import { Admin } from './features/admin/admin';
import { Reportes } from './features/reportes/reportes';
import { NotFound } from './features/not-found/not-found';
import { guestGuard } from './guards/guest-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  {
    path: 'cliente/pedidos',
    component: ClientePedidos,
    canActivate: [roleGuard(['CLIENTE'])],
  },
  {
    path: 'mesas',
    component: Mesas,
    canActivate: [roleGuard(['ADMIN', 'MESERO'])],
  },
  {
    path: 'cocina',
    component: Cocina,
    canActivate: [roleGuard(['ADMIN', 'COCINA', 'MESERO'])],
  },
  {
    path: 'caja',
    component: Caja,
    canActivate: [roleGuard(['ADMIN', 'MESERO'])],
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [roleGuard(['ADMIN'])],
  },
  {
    path: 'reportes',
    component: Reportes,
    canActivate: [roleGuard(['ADMIN'])],
  },
  { path: '**', component: NotFound },
];
