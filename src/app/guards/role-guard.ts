import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth-service';
import { RolUsuario } from '../models/auth';

export const roleGuard = (allowedRoles: RolUsuario[]): CanActivateFn => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isValid = await authService.checkAuthStatus();
    if (!isValid) {
      return router.parseUrl('/login');
    }

    const currentRol = authService.currentRol();
    if (currentRol && allowedRoles.includes(currentRol)) {
      return true;
    }

    // Si el rol no tiene permiso para este módulo, redirigir al home o su vista principal
    return router.parseUrl('/');
  };
};
