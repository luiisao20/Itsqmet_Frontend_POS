export const APP_CONFIG = {
  API_URL: 'http://localhost:8080',
  WS_URL: 'ws://localhost:8080/ws-pos',
  ENDPOINTS: {
    AUTH: '/auth',
    PLATOS: '/platos',
    CATEGORIAS: '/categorias-plato',
    MESAS: '/mesas',
    PEDIDOS: '/pedidos',
    FACTURAS: '/facturas',
    PAGOS: '/pagos',
    CLIENTES: '/clientes',
    INSUMOS: '/insumos',
    DISTRIBUIDORES: '/distribuidores',
  },
  TOPICS: {
    PEDIDOS: '/topic/pedidos',
    COCINA: '/topic/cocina',
    ADMIN: '/topic/admin',
  },
};
