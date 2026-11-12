import { TipoIdentificacion } from './auth';

export interface Cliente {
  uuid: string;
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  razonSocial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
  createdAt?: string;
}

export interface ClienteRequest {
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  razonSocial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  password?: string;
  activo?: boolean;
}
