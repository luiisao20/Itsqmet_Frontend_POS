import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import {
  EstadoPaqueteSorpresa,
  PaqueteSorpresa,
  PaqueteSorpresaRequest,
  RescateRequest,
  RescateResponse,
} from '../models/paquete-sorpresa';
import { WebSocketService } from './websocket-service';

@Injectable({
  providedIn: 'root',
})
export class PaqueteSorpresaService {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private readonly BASE_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.PAQUETES_SORPRESA}`;

  /**
   * Obtiene los paquetes sorpresa del día para comensales / clientes.
   */
  getDisponibles(): Observable<PaqueteSorpresa[]> {
    return this.http.get<PaqueteSorpresa[]>(`${this.BASE_URL}/disponibles`);
  }

  /**
   * Obtiene la gestión completa de paquetes para personal (Admin / Cocina).
   */
  getGestion(fecha?: string): Observable<PaqueteSorpresa[]> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<PaqueteSorpresa[]>(`${this.BASE_URL}/gestion`, { params });
  }

  getById(id: number): Observable<PaqueteSorpresa> {
    return this.http.get<PaqueteSorpresa>(`${this.BASE_URL}/${id}`);
  }

  crear(pack: PaqueteSorpresaRequest): Observable<PaqueteSorpresa> {
    return this.http.post<PaqueteSorpresa>(this.BASE_URL, pack);
  }

  actualizar(id: number, pack: PaqueteSorpresaRequest): Observable<PaqueteSorpresa> {
    return this.http.put<PaqueteSorpresa>(`${this.BASE_URL}/${id}`, pack);
  }

  cambiarEstado(id: number, nuevoEstado: EstadoPaqueteSorpresa): Observable<PaqueteSorpresa> {
    let params = new HttpParams().set('nuevoEstado', nuevoEstado);
    return this.http.patch<PaqueteSorpresa>(`${this.BASE_URL}/${id}/estado`, {}, { params });
  }

  rescatar(id: number, req?: RescateRequest): Observable<RescateResponse> {
    return this.http.post<RescateResponse>(`${this.BASE_URL}/${id}/rescatar`, req || {});
  }

  /**
   * Escucha eventos de paquetes sorpresa en tiempo real (creación, stock, horarios).
   */
  listenPaquetes(): Observable<PaqueteSorpresa> {
    return this.wsService.listen<PaqueteSorpresa>(APP_CONFIG.TOPICS.PAQUETES_SORPRESA);
  }
}
