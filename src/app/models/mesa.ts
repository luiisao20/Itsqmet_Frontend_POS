export type EstadoMesa = 'LIBRE' | 'OCUPADA' | 'CUENTA';

export interface Mesa {
  id: number;
  numeroMesa: number;
  capacidad: number;
  ubicacion?: string;
  estado: EstadoMesa;
  createdAt?: string;
}

export interface MesaRequest {
  numeroMesa: number;
  capacidad: number;
  ubicacion?: string;
  estado?: EstadoMesa;
}
