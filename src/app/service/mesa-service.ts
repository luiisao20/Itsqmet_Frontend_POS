import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { EstadoMesa, Mesa, MesaRequest } from '../models/mesa';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class MesaService {
  private http = inject(HttpClient);
  private readonly MESAS_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.MESAS}`;

  getMesas(page = 0, size = 50): Observable<PageResponse<Mesa>> {
    return this.http.get<PageResponse<Mesa>>(`${this.MESAS_URL}?page=${page}&size=${size}`);
  }

  getMesaById(id: number): Observable<Mesa> {
    return this.http.get<Mesa>(`${this.MESAS_URL}/${id}`);
  }

  createMesa(req: MesaRequest): Observable<Mesa> {
    return this.http.post<Mesa>(this.MESAS_URL, req);
  }

  updateMesa(id: number, req: Partial<MesaRequest>): Observable<Mesa> {
    return this.http.put<Mesa>(`${this.MESAS_URL}/${id}`, req);
  }

  deleteMesa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.MESAS_URL}/${id}`);
  }

  updateEstado(id: number, estado: EstadoMesa): Observable<Mesa> {
    return this.http.patch<Mesa>(`${this.MESAS_URL}/${id}/estado?estado=${estado}`, {});
  }
}
