import { RolUsuario } from './auth';

export interface Usuario {
  uuid: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt?: string;
}

export interface UsuarioRequest {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  activo?: boolean;
}
