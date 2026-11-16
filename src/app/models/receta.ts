import { UnidadMedida } from './insumo';

export interface Receta {
  id: number;
  idPlato: number;
  nombrePlato?: string;
  idInsumo: number;
  nombreInsumo?: string;
  unidadMedidaInsumo?: UnidadMedida;
  cantidadRequerida: number;
  createdAt?: string;
}

export interface RecetaRequest {
  idPlato: number;
  idInsumo: number;
  cantidadRequerida: number;
}
