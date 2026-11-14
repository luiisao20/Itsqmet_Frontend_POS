import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { ClientePedidoRequest, EstadoPedido, Pedido, PedidoRequest, TipoPedido } from '../models/pedido';
import { PageResponse } from '../models/plato';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private http = inject(HttpClient);
  private readonly PEDIDOS_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.PEDIDOS}`;

  getPedidos(page = 0, size = 50): Observable<PageResponse<Pedido>> {
    return this.http.get<PageResponse<Pedido>>(`${this.PEDIDOS_URL}?page=${page}&size=${size}`);
  }

  getPedidoById(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.PEDIDOS_URL}/${id}`);
  }

  searchPedidos(
    estado?: EstadoPedido,
    tipo?: TipoPedido,
    idMesa?: number,
    clienteUuid?: string,
    page = 0,
    size = 50
  ): Observable<PageResponse<Pedido>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (estado) params = params.set('estado', estado);
    if (tipo) params = params.set('tipo', tipo);
    if (idMesa) params = params.set('idMesa', idMesa);
    if (clienteUuid) params = params.set('clienteUuid', clienteUuid);

    return this.http.get<PageResponse<Pedido>>(`${this.PEDIDOS_URL}/buscar`, { params });
  }

  createPedido(req: PedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(this.PEDIDOS_URL, req);
  }

  createPedidoCliente(req: ClientePedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.PEDIDOS_URL}/cliente`, req);
  }

  updateEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.PEDIDOS_URL}/${id}/estado?estado=${estado}`, {});
  }

  getMisPedidos(page = 0, size = 20): Observable<PageResponse<Pedido>> {
    return this.http.get<PageResponse<Pedido>>(`${this.PEDIDOS_URL}/mis-pedidos?page=${page}&size=${size}`);
  }
}
