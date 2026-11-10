export type RolUsuario = 'ADMIN' | 'MESERO' | 'COCINA' | 'CLIENTE';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface ClienteLoginRequest {
  login: string;
  password?: string;
}

export type TipoIdentificacion = 'CEDULA' | 'RUC' | 'PASAPORTE' | 'CONSUMIDOR_FINAL';

export interface ClienteRegisterRequest {
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  razonSocial: string;
  direccion?: string;
  telefono?: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  uuid: string;
  nombre: string;
  apellido?: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  message?: string;
}
