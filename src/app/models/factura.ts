export type EstadoFactura = 'EMITIDA' | 'ANULADA';
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';

export interface Factura {
  id: number;
  idPedido: number;
  idCliente: string;
  razonSocialCliente: string;
  identificacionCliente: string;
  idUsuario: string;
  nombreUsuario: string;
  numeroSecuencial: string;
  claveAccesoSri?: string;
  fechaEmision: string;
  subtotal: number;
  subtotalIva: number;
  propina: number;
  total: number;
  estado: EstadoFactura;
  createdAt: string;
}

export interface FacturaRequest {
  idPedido: number;
  idCliente: string;
  numeroSecuencial: string;
  claveAccesoSri?: string;
  propina?: number;
}

export interface Pago {
  id: number;
  idFactura: number;
  metodoPago: MetodoPago;
  monto: number;
  referenciaTransaccion?: string;
  fechaPago: string;
}

export interface PagoRequest {
  idFactura: number;
  metodoPago: MetodoPago;
  monto: number;
  referenciaTransaccion?: string;
}
