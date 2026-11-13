export interface Turno {
  id: number;
  idUsuario: string;
  nombreUsuario: string;
  rolUsuario?: string;
  fechaInicio: string;
  fechaFin?: string;
  totalHoras?: number;
  observaciones?: string;
  createdAt?: string;
}

export interface TurnoRequest {
  idUsuario: string;
  observaciones?: string;
}
