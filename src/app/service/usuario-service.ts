import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { Usuario, UsuarioRequest } from '../models/usuario';
import { RolUsuario } from '../models/auth';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private readonly URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.USUARIOS}`;

  getUsuarios(page = 0, size = 50): Observable<PageResponse<Usuario>> {
    return this.http.get<PageResponse<Usuario>>(`${this.URL}?page=${page}&size=${size}`);
  }

  getUsuarioByUuid(uuid: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.URL}/${uuid}`);
  }

  getUsuariosByRol(rol: RolUsuario, page = 0, size = 50): Observable<PageResponse<Usuario>> {
    return this.http.get<PageResponse<Usuario>>(`${this.URL}/rol/${rol}?page=${page}&size=${size}`);
  }

  searchUsuarios(query: string, page = 0, size = 50): Observable<PageResponse<Usuario>> {
    return this.http.get<PageResponse<Usuario>>(`${this.URL}/buscar?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  }

  createUsuario(req: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.URL, req);
  }

  updateUsuario(uuid: string, req: Partial<UsuarioRequest>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.URL}/${uuid}`, req);
  }

  deleteUsuario(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.URL}/${uuid}`);
  }
}
