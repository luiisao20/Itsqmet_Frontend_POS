import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { Receta, RecetaRequest } from '../models/receta';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class RecetaService {
  private http = inject(HttpClient);
  private readonly URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.RECETAS}`;

  getByPlato(idPlato: number, page = 0, size = 50): Observable<PageResponse<Receta>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Receta>>(`${this.URL}/plato/${idPlato}`, { params });
  }

  create(req: RecetaRequest): Observable<Receta> {
    return this.http.post<Receta>(this.URL, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/${id}`);
  }
}
