import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { Factura, FacturaRequest, Pago, PagoRequest } from '../models/factura';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class FacturaService {
  private http = inject(HttpClient);
  private readonly FACTURAS_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.FACTURAS}`;
  private readonly PAGOS_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.PAGOS}`;

  getFacturas(page = 0, size = 50): Observable<PageResponse<Factura>> {
    return this.http.get<PageResponse<Factura>>(`${this.FACTURAS_URL}?page=${page}&size=${size}`);
  }

  getFacturaById(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.FACTURAS_URL}/${id}`);
  }

  emitirFactura(req: FacturaRequest): Observable<Factura> {
    return this.http.post<Factura>(this.FACTURAS_URL, req);
  }

  getMisFacturas(page = 0, size = 20): Observable<PageResponse<Factura>> {
    return this.http.get<PageResponse<Factura>>(`${this.FACTURAS_URL}/mis-facturas?page=${page}&size=${size}`);
  }

  registrarPago(req: PagoRequest): Observable<Pago> {
    return this.http.post<Pago>(this.PAGOS_URL, req);
  }
}
