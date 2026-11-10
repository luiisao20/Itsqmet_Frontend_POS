import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth-service';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no hay indicio de sesión previa en localStorage, permitir el paso inmediatamente sin peticiones HTTP
  if (!authService.hasSessionHint()) {
    return true;
  }

  const isValid = await authService.checkAuthStatus();
  if (!isValid) {
    return true;
  }

  // Si ya tiene sesión, redirigir según su rol
  const rol = authService.currentRol();
  if (rol === 'COCINA') {
    return router.parseUrl('/cocina');
  } else if (rol === 'CLIENTE') {
    return router.parseUrl('/cliente/pedidos');
  } else if (rol === 'MESERO') {
    return router.parseUrl('/mesas');
  } else if (rol === 'ADMIN') {
    return router.parseUrl('/admin');
  }

  return router.parseUrl('/');
};
