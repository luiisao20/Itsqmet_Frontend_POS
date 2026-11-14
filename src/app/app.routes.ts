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
    children: [
      { path: '', redirectTo: 'platos', pathMatch: 'full' },
      {
        path: 'platos',
        loadComponent: () =>
          import('./features/admin/views/platos/admin-platos').then(
            (m) => m.AdminPlatos
          ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/admin/views/categorias/admin-categorias').then(
            (m) => m.AdminCategorias
          ),
      },
      {
        path: 'mesas',
        loadComponent: () =>
          import('./features/admin/views/mesas/admin-mesas').then(
            (m) => m.AdminMesas
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/views/usuarios/admin-usuarios').then(
            (m) => m.AdminUsuarios
          ),
      },
      {
        path: 'insumos',
        loadComponent: () =>
          import('./features/admin/views/insumos/admin-insumos').then(
            (m) => m.AdminInsumos
          ),
      },
      {
        path: 'distribuidores',
        loadComponent: () =>
          import(
            './features/admin/views/distribuidores/admin-distribuidores'
          ).then((m) => m.AdminDistribuidores),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/admin/views/clientes/admin-clientes').then(
            (m) => m.AdminClientes
          ),
      },
      {
        path: 'turnos',
        loadComponent: () =>
          import('./features/admin/views/turnos/admin-turnos').then(
            (m) => m.AdminTurnos
          ),
      },
      {
        path: 'compras',
        loadComponent: () =>
          import('./features/admin/views/compras/admin-compras').then(
            (m) => m.AdminCompras
          ),
      },
      {
        path: 'facturas',
        loadComponent: () =>
          import('./features/admin/views/facturas/admin-facturas').then(
            (m) => m.AdminFacturas
          ),
      },
      {
        path: 'paquetes',
        loadComponent: () =>
          import('./features/admin/views/paquetes/admin-paquetes').then(
            (m) => m.AdminPaquetes
          ),
      },
    ],
  },
  {
    path: 'reportes',
    component: Reportes,
    canActivate: [roleGuard(['ADMIN'])],
  },
  { path: '**', component: NotFound },
];
