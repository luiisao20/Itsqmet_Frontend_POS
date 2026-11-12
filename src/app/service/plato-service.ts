import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { CategoriaPlato, CategoriaPlatoRequest, PageResponse, Plato } from '../models/plato';
import { CacheService } from './cache-service';

@Injectable({
  providedIn: 'root',
})
export class PlatoService {
  private http = inject(HttpClient);
  private cache = inject(CacheService);

  private readonly PLATOS_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.PLATOS}`;
  private readonly CATEGORIAS_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.CATEGORIAS}`;

  getCategorias(): Observable<CategoriaPlato[]> {
    const cacheKey = 'categorias_all';
    const cached = this.cache.get<CategoriaPlato[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.http.get<any>(this.CATEGORIAS_URL).pipe(
      map((data: any) => {
        const items: CategoriaPlato[] = data && data.content ? data.content : (Array.isArray(data) ? data : []);
        this.cache.set(cacheKey, items, 10 * 60 * 1000); // 10 min
        return items;
      })
    );
  }

  getPlatos(page = 0, size = 50): Observable<PageResponse<Plato>> {
    const cacheKey = `platos_${page}_${size}`;
    const cached = this.cache.get<PageResponse<Plato>>(cacheKey);
    if (cached) {
      return of(cached);
    }

    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Plato>>(this.PLATOS_URL, { params }).pipe(
      tap((res) => {
        this.cache.set(cacheKey, res, 5 * 60 * 1000); // 5 min
      })
    );
  }

  getPlatosByCategoria(idCategoria: number, page = 0, size = 50): Observable<PageResponse<Plato>> {
    const cacheKey = `platos_cat_${idCategoria}_${page}_${size}`;
    const cached = this.cache.get<PageResponse<Plato>>(cacheKey);
    if (cached) {
      return of(cached);
    }

    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<PageResponse<Plato>>(`${this.PLATOS_URL}/categoria/${idCategoria}`, { params })
      .pipe(
        tap((res) => {
          this.cache.set(cacheKey, res, 5 * 60 * 1000);
        })
      );
  }

  searchPlatos(nombre?: string, idCategoria?: number, disponible?: boolean): Observable<PageResponse<Plato>> {
    let params = new HttpParams().set('size', 50);
    if (nombre) params = params.set('nombre', nombre);
    if (idCategoria) params = params.set('idCategoria', idCategoria);
    if (disponible !== undefined) params = params.set('disponible', disponible);

    return this.http.get<PageResponse<Plato>>(`${this.PLATOS_URL}/buscar`, { params });
  }

  getPlatoById(id: number): Observable<Plato> {
    const cacheKey = `plato_${id}`;
    const cached = this.cache.get<Plato>(cacheKey);
    if (cached) return of(cached);

    return this.http.get<Plato>(`${this.PLATOS_URL}/${id}`).pipe(
      tap((p) => this.cache.set(cacheKey, p, 10 * 60 * 1000))
    );
  }

  createPlato(plato: Partial<Plato>): Observable<Plato> {
    return this.http.post<Plato>(this.PLATOS_URL, plato).pipe(
      tap(() => this.cache.clear('platos'))
    );
  }

  updatePlato(id: number, plato: Partial<Plato>): Observable<Plato> {
    return this.http.put<Plato>(`${this.PLATOS_URL}/${id}`, plato).pipe(
      tap(() => this.cache.clear('platos'))
    );
  }

  deletePlato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.PLATOS_URL}/${id}`).pipe(
      tap(() => this.cache.clear('platos'))
    );
  }

  createCategoria(cat: CategoriaPlatoRequest): Observable<CategoriaPlato> {
    return this.http.post<CategoriaPlato>(this.CATEGORIAS_URL, cat).pipe(
      tap(() => this.cache.clear('categorias'))
    );
  }

  updateCategoria(id: number, cat: CategoriaPlatoRequest): Observable<CategoriaPlato> {
    return this.http.put<CategoriaPlato>(`${this.CATEGORIAS_URL}/${id}`, cat).pipe(
      tap(() => this.cache.clear('categorias'))
    );
  }

  deleteCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.CATEGORIAS_URL}/${id}`).pipe(
      tap(() => this.cache.clear('categorias'))
    );
  }
}
