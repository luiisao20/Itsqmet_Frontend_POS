export type EstadoPaqueteSorpresa = 'PROGRAMADO' | 'ACTIVO' | 'AGOTADO' | 'FINALIZADO';

export interface PaqueteSorpresa {
  id: number;
  titulo: string;
  descripcion?: string;
  precioEstimadoOriginal: number;
  precioRescate: number;
  cantidadTotal: number;
  cantidadDisponible: number;
  unidadesVendidas: number;
  porcentajeDescuento: number;
  fechaDisponible: string;
  horaInicioVisibilidad: string;
  horaFinRecogida: string;
  estado: EstadoPaqueteSorpresa;
  urlImagen?: string;
  disponibleAhora: boolean;
  segundosParaApertura: number;
  createdAt: string;
}

export interface PaqueteSorpresaRequest {
  titulo: string;
  descripcion?: string;
  precioEstimadoOriginal: number;
  precioRescate: number;
  cantidadTotal: number;
  fechaDisponible: string;
  horaInicioVisibilidad: string;
  horaFinRecogida: string;
  urlImagen?: string;
  estado?: EstadoPaqueteSorpresa;
}

export interface RescateRequest {
  cantidad?: number;
  observaciones?: string;
}

export interface RescateResponse {
  idPedido: number;
  idPaquete: number;
  tituloPaquete: string;
  cantidadRescatada: number;
  totalPagar: number;
  horaFinRecogida: string;
  estadoPedido: string;
  mensaje: string;
}
