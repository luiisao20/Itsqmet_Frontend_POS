import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { Insumo, InsumoRequest, UnidadMedida } from '../models/insumo';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class InsumoService {
  private http = inject(HttpClient);
  private readonly URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.INSUMOS}`;

  getInsumos(page = 0, size = 50): Observable<PageResponse<Insumo>> {
    return this.http.get<PageResponse<Insumo>>(`${this.URL}?page=${page}&size=${size}`);
  }

  getInsumoById(id: number): Observable<Insumo> {
    return this.http.get<Insumo>(`${this.URL}/${id}`);
  }

  getStockBajo(page = 0, size = 50): Observable<PageResponse<Insumo>> {
    return this.http.get<PageResponse<Insumo>>(`${this.URL}/stock-bajo?page=${page}&size=${size}`);
  }

  searchInsumos(nombre?: string, unidadMedida?: UnidadMedida, page = 0, size = 50): Observable<PageResponse<Insumo>> {
    let params = `page=${page}&size=${size}`;
    if (nombre) params += `&nombre=${encodeURIComponent(nombre)}`;
    if (unidadMedida) params += `&unidadMedida=${unidadMedida}`;
    return this.http.get<PageResponse<Insumo>>(`${this.URL}/buscar?${params}`);
  }

  createInsumo(req: InsumoRequest): Observable<Insumo> {
    return this.http.post<Insumo>(this.URL, req);
  }

  updateInsumo(id: number, req: Partial<InsumoRequest>): Observable<Insumo> {
    return this.http.put<Insumo>(`${this.URL}/${id}`, req);
  }

  deleteInsumo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/${id}`);
  }
}
