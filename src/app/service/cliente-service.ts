import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { Cliente, ClienteRequest } from '../models/cliente';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private http = inject(HttpClient);
  private readonly URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.CLIENTES}`;

  getClientes(page = 0, size = 50): Observable<PageResponse<Cliente>> {
    return this.http.get<PageResponse<Cliente>>(`${this.URL}?page=${page}&size=${size}`);
  }

  getClienteByUuid(uuid: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.URL}/${uuid}`);
  }

  getClienteByIdentificacion(identificacion: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.URL}/identificacion/${identificacion}`);
  }

  searchClientes(filtro: string, page = 0, size = 50): Observable<PageResponse<Cliente>> {
    return this.http.get<PageResponse<Cliente>>(`${this.URL}/buscar?filtro=${encodeURIComponent(filtro)}&page=${page}&size=${size}`);
  }

  createCliente(req: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.URL, req);
  }

  updateCliente(uuid: string, req: Partial<ClienteRequest>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.URL}/${uuid}`, req);
  }

  deleteCliente(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.URL}/${uuid}`);
  }
}
