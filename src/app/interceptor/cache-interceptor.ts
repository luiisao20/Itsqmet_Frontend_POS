import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { CacheService } from '../service/cache-service';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  // Solo cacheamos peticiones GET a los endpoints del catálogo
  const isCacheable =
    req.method === 'GET' &&
    (req.url.includes('/platos') || req.url.includes('/categorias-plato'));

  // Invalidar caché cuando hay mutaciones (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (req.url.includes('/platos')) cacheService.clear('platos');
    if (req.url.includes('/categorias-plato')) cacheService.clear('categorias');
    return next(req);
  }

  if (!isCacheable) {
    return next(req);
  }

  const cacheKey = req.urlWithParams;
  const cachedResponse = cacheService.get<any>(cacheKey);

  if (cachedResponse) {
    return of(new HttpResponse({ status: 200, body: cachedResponse }));
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cacheService.set(cacheKey, event.body, 5 * 60 * 1000); // 5 minutos
      }
    })
  );
};
