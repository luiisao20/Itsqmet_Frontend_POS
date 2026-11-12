export type UnidadMedida = 'KG' | 'LT' | 'UNIDAD';

export interface Insumo {
  id: number;
  nombre: string;
  unidadMedida: UnidadMedida;
  stockActual: number;
  stockMinimo: number;
  costoPromedio: number;
  stockBajo?: boolean;
  createdAt?: string;
}

export interface InsumoRequest {
  nombre: string;
  unidadMedida: UnidadMedida;
  stockActual: number;
  stockMinimo: number;
  costoPromedio: number;
}
