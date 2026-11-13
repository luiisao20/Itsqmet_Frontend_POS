import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { CompraInsumo, CompraInsumoRequest, EstadoCompra } from '../models/compra';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class CompraService {
  private http = inject(HttpClient);
  private readonly COMPRAS_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.COMPRAS}`;

  getCompras(page = 0, size = 20): Observable<PageResponse<CompraInsumo>> {
    return this.http.get<PageResponse<CompraInsumo>>(`${this.COMPRAS_URL}?page=${page}&size=${size}`);
  }

  getCompraById(id: number): Observable<CompraInsumo> {
    return this.http.get<CompraInsumo>(`${this.COMPRAS_URL}/${id}`);
  }

  searchCompras(
    numeroFactura?: string,
    idDistribuidor?: number,
    estado?: EstadoCompra,
    page = 0,
    size = 20
  ): Observable<PageResponse<CompraInsumo>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (numeroFactura?.trim()) params = params.set('numeroFactura', numeroFactura.trim());
    if (idDistribuidor) params = params.set('idDistribuidor', idDistribuidor);
    if (estado) params = params.set('estado', estado);

    return this.http.get<PageResponse<CompraInsumo>>(`${this.COMPRAS_URL}/buscar`, { params });
  }

  registrarCompra(req: CompraInsumoRequest): Observable<CompraInsumo> {
    return this.http.post<CompraInsumo>(this.COMPRAS_URL, req);
  }

  updateEstado(id: number, estado: EstadoCompra): Observable<CompraInsumo> {
    return this.http.patch<CompraInsumo>(`${this.COMPRAS_URL}/${id}/estado?estado=${estado}`, {});
  }
}
