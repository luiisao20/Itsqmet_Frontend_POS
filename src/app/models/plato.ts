export type AreaImpresion = 'COCINA' | 'BAR' | 'CAJA';

export interface CategoriaPlato {
  id: number;
  nombre: string;
  areaImpresion: AreaImpresion;
  ordenVisual?: number;
  createdAt?: string;
}

export interface Plato {
  id: number;
  idCategoria: number;
  nombreCategoria?: string;
  nombre: string;
  descripcion?: string;
  precioUnitario: number;
  aplicaIva: boolean;
  disponible: boolean;
  urlImagen?: string;
  createdAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
