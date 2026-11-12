export interface Distribuidor {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreContacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  categoriaProveedor?: string;
  createdAt?: string;
}

export interface DistribuidorRequest {
  ruc: string;
  razonSocial: string;
  nombreContacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  categoriaProveedor?: string;
}
