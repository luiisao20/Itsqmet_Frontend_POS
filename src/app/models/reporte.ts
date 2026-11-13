export interface VentaResumen {
  periodo: string;
  totalFacturado: number;
  totalPedidos: number;
  pedidosSalon: number;
  pedidosLlevar: number;
  totalPropinas: number;
}

export interface PlatoPopular {
  idPlato: number;
  nombrePlato: string;
  totalVendido: number;
  totalIngresos: number;
}

export interface GastosProveedor {
  idDistribuidor: number;
  razonSocial: string;
  esProveedorLocal: boolean;
  totalCompras: number;
  cantidadCompras: number;
}

export interface MargenPlato {
  idPlato: number;
  nombrePlato: string;
  precioVenta: number;
  costoReceta: number;
  margenGanancia: number;
  porcentajeMargen: number;
}
