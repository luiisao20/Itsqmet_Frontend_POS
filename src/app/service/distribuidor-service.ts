import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { Distribuidor, DistribuidorRequest } from '../models/distribuidor';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class DistribuidorService {
  private http = inject(HttpClient);
  private readonly URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.DISTRIBUIDORES}`;

  getDistribuidores(page = 0, size = 50): Observable<PageResponse<Distribuidor>> {
    return this.http.get<PageResponse<Distribuidor>>(`${this.URL}?page=${page}&size=${size}`);
  }

  getDistribuidorById(id: number): Observable<Distribuidor> {
    return this.http.get<Distribuidor>(`${this.URL}/${id}`);
  }

  searchDistribuidores(filtro: string, page = 0, size = 50): Observable<PageResponse<Distribuidor>> {
    return this.http.get<PageResponse<Distribuidor>>(`${this.URL}/buscar?filtro=${encodeURIComponent(filtro)}&page=${page}&size=${size}`);
  }

  createDistribuidor(req: DistribuidorRequest): Observable<Distribuidor> {
    return this.http.post<Distribuidor>(this.URL, req);
  }

  updateDistribuidor(id: number, req: Partial<DistribuidorRequest>): Observable<Distribuidor> {
    return this.http.put<Distribuidor>(`${this.URL}/${id}`, req);
  }

  deleteDistribuidor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/${id}`);
  }
}
