import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Clona la petición agregando withCredentials: true para enviar las cookies HttpOnly
  const cloned = req.clone({
    withCredentials: true,
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ignorar 401 en endpoints de autenticación (/auth/me, /auth/login, etc.) para evitar bucles
      const isAuthEndpoint = req.url.includes('/auth/');

      if (error.status === 401 && !isAuthEndpoint) {
        // Redirigir a login solo si no está ya en la pantalla de login o registro
        const currentUrl = router.url;
        if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
