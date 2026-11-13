import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { Turno, TurnoRequest } from '../models/turno';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class TurnoService {
  private http = inject(HttpClient);
  private readonly URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.TURNOS}`;

  getAll(page = 0, size = 50): Observable<PageResponse<Turno>> {
    return this.http.get<PageResponse<Turno>>(`${this.URL}?page=${page}&size=${size}`);
  }

  getByUsuario(uuid: string, page = 0, size = 50): Observable<PageResponse<Turno>> {
    return this.http.get<PageResponse<Turno>>(`${this.URL}/usuario/${uuid}?page=${page}&size=${size}`);
  }

  getTurnoActivo(uuid: string): Observable<Turno | null> {
    return this.http.get<Turno | null>(`${this.URL}/activo/${uuid}`);
  }

  iniciarTurno(req: TurnoRequest): Observable<Turno> {
    return this.http.post<Turno>(`${this.URL}/iniciar`, req);
  }

  cerrarTurno(req: TurnoRequest): Observable<Turno> {
    return this.http.post<Turno>(`${this.URL}/cerrar`, req);
  }
}
