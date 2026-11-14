export type EstadoPedido = 'ABIERTO' | 'EN_PREPARACION' | 'SERVIDO' | 'FACTURADO' | 'ANULADO';
export type TipoPedido = 'SALON' | 'LLEVAR';
export type EstadoDetallePedido = 'PENDIENTE' | 'IMPRESO' | 'LISTO' | 'ENTREGADO';

export interface DetallePedido {
  id?: number;
  idPlato: number;
  nombrePlato: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notasPreparacion?: string;
  estado: EstadoDetallePedido;
}

export interface DetallePedidoRequest {
  idPlato: number;
  cantidad: number;
  notasPreparacion?: string;
  estado?: EstadoDetallePedido;
}

export interface Pedido {
  id: number;
  idMesa?: number;
  numeroMesa?: number;
  idUsuario: string;
  nombreUsuario: string;
  idCliente?: string;
  razonSocialCliente?: string;
  fechaApertura: string;
  fechaCierre?: string;
  estado: EstadoPedido;
  tipo: TipoPedido;
  observaciones?: string;
  detalles: DetallePedido[];
  idPaqueteSorpresa?: number;
  tituloPaqueteSorpresa?: string;
  createdAt: string;
}

export interface PedidoRequest {
  idMesa?: number;
  idCliente?: string;
  tipo: TipoPedido;
  observaciones?: string;
  detalles: DetallePedidoRequest[];
}

export interface ClientePedidoRequest {
  observaciones?: string;
  detalles: DetallePedidoRequest[];
}
