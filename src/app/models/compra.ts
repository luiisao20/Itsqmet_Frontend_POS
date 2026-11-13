export type EstadoCompra = 'RECIBIDA' | 'PENDIENTE_PAGO' | 'PAGADA';

export interface DetalleCompra {
  id?: number;
  idCompra?: number;
  idInsumo: number;
  nombreInsumo?: string;
  unidadMedida?: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  createdAt?: string;
}

export interface CompraInsumo {
  id: number;
  idDistribuidor: number;
  razonSocialDistribuidor: string;
  rucDistribuidor: string;
  esProveedorLocalDistribuidor?: boolean;
  idUsuario: string;
  nombreUsuario: string;
  numeroFacturaProveedor: string;
  fechaCompra: string;
  totalCompra: number;
  estado: EstadoCompra;
  detalles: DetalleCompra[];
  createdAt: string;
}

export interface CompraInsumoRequest {
  idDistribuidor: number;
  numeroFacturaProveedor: string;
  estado: EstadoCompra;
  detalles: {
    idInsumo: number;
    cantidad: number;
    costoUnitario: number;
  }[];
}
