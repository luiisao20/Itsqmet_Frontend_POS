function resolveApiUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080';
  // Si estamos en desarrollo local con ng serve en el puerto 4200
  if (window.location.port === '4200') {
    return 'http://localhost:8080';
  }
  // En producción / Docker con el Gateway o Tailscale, peticiones relativas al dominio y puerto actual
  return '';
}

function resolveWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:8080/ws-pos';
  if (window.location.port === '4200') {
    return 'ws://localhost:8080/ws-pos';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws-pos`;
}

export const APP_CONFIG = {
  get API_URL(): string {
    return resolveApiUrl();
  },
  get WS_URL(): string {
    return resolveWsUrl();
  },
  ENDPOINTS: {
    AUTH: '/auth',
    USUARIOS: '/usuarios',
    PLATOS: '/platos',
    CATEGORIAS: '/categorias-plato',
    MESAS: '/mesas',
    PEDIDOS: '/pedidos',
    FACTURAS: '/facturas',
    PAGOS: '/pagos',
    CLIENTES: '/clientes',
    INSUMOS: '/insumos',
    DISTRIBUIDORES: '/distribuidores',
    COMPRAS: '/compras',
    TURNOS: '/turnos',
    REPORTES: '/reportes',
    PAQUETES_SORPRESA: '/paquetes-sorpresa',
    RECETAS: '/recetas',
  },
  TOPICS: {
    PEDIDOS: '/topic/pedidos',
    COCINA: '/topic/cocina',
    ADMIN: '/topic/admin',
    PAQUETES_SORPRESA: '/topic/paquetes-sorpresa',
  },
};
