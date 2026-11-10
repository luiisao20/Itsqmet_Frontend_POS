import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { EstadoMesa, Mesa } from '../models/mesa';
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

  updateEstado(id: number, estado: EstadoMesa): Observable<Mesa> {
    return this.http.patch<Mesa>(`${this.MESAS_URL}/${id}/estado?estado=${estado}`, {});
  }
}
