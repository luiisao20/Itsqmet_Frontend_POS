import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { GastosProveedor, MargenPlato, PlatoPopular, VentaResumen } from '../models/reporte';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private http = inject(HttpClient);
  private readonly URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.REPORTES}`;

  getResumenVentas(desde?: string, hasta?: string): Observable<VentaResumen> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<VentaResumen>(`${this.URL}/ventas`, { params });
  }

  getPlatosPopulares(desde?: string, hasta?: string, limit = 10): Observable<PlatoPopular[]> {
    let params = new HttpParams().set('limit', limit);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<PlatoPopular[]>(`${this.URL}/platos-populares`, { params });
  }

  getGastosProveedores(desde?: string, hasta?: string): Observable<GastosProveedor[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<GastosProveedor[]>(`${this.URL}/proveedores`, { params });
  }

  getMargenes(): Observable<MargenPlato[]> {
    return this.http.get<MargenPlato[]>(`${this.URL}/margenes`);
  }
}
