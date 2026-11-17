import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AuthResponse, RolUsuario } from '../models/auth';
import { EstadoPedido, Pedido, TipoPedido } from '../models/pedido';
import { PageResponse } from '../models/plato';
import { AuthService } from './auth-service';
import { NotificationSoundService } from './notification-sound-service';
import { OrderNotificationService } from './order-notification-service';
import { PedidoService } from './pedido-service';
import { ToastService } from './toast-service';
import { WebSocketService } from './websocket-service';

@Component({ template: '' })
class DummyPage {}

class FakeWebSocketService {
  private subjects = new Map<string, Subject<unknown>>();
  listen = vi.fn(<T>(topic: string): Observable<T> => this.subject(topic).asObservable() as Observable<T>);

  emit(topic: string, payload: unknown): void {
    this.subject(topic).next(payload);
  }

  isObserved(topic: string): boolean {
    return this.subject(topic).observed;
  }

  private subject(topic: string): Subject<unknown> {
    if (!this.subjects.has(topic)) {
      this.subjects.set(topic, new Subject<unknown>());
    }
    return this.subjects.get(topic)!;
  }
}

class FakeAuthService {
  isAuthenticated = signal(false);
  currentRol = signal<RolUsuario | null>(null);
  currentUser = signal<AuthResponse | null>(null);
  sessionHintRol = vi.fn((): RolUsuario | null => null);
  checkAuthStatus = vi.fn(async () => false);

  loginAs(rol: RolUsuario, uuid = `user-${rol}`): void {
    this.isAuthenticated.set(true);
    this.currentRol.set(rol);
    this.currentUser.set({ uuid, nombre: 'Test', email: 't@t.com', rol, activo: true });
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.currentRol.set(null);
    this.currentUser.set(null);
  }
}

function pedido(id: number, estado: EstadoPedido = 'ABIERTO', extra: Partial<Pedido> = {}): Pedido {
  const tipo: TipoPedido = extra.tipo ?? 'SALON';
  return {
    id,
    idUsuario: 'u1',
    nombreUsuario: 'Mesero',
    fechaApertura: '2026-11-15T10:00:00Z',
    estado,
    tipo,
    detalles: [],
    createdAt: '2026-11-15T10:00:00Z',
    ...extra,
  };
}

function page(content: Pedido[]): PageResponse<Pedido> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 100,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}

const PEDIDOS = '/topic/pedidos';
const COCINA = '/topic/cocina';

describe('OrderNotificationService', () => {
  let ws: FakeWebSocketService;
  let auth: FakeAuthService;
  let sound: { play: ReturnType<typeof vi.fn> };
  let pedidoService: { searchPedidos: ReturnType<typeof vi.fn> };
  let hidden: boolean;

  beforeEach(() => {
    ws = new FakeWebSocketService();
    auth = new FakeAuthService();
    sound = { play: vi.fn() };
    pedidoService = { searchPedidos: vi.fn(() => of(page([]))) };
    hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.title = 'PosApp';

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cocina', component: DummyPage },
          { path: 'mesas', component: DummyPage },
        ]),
        { provide: WebSocketService, useValue: ws },
        { provide: AuthService, useValue: auth },
        { provide: PedidoService, useValue: pedidoService },
        { provide: NotificationSoundService, useValue: sound },
      ],
    });
  });

  afterEach(() => {
    delete (document as { hidden?: boolean }).hidden;
    vi.useRealTimers();
  });

  function start(): OrderNotificationService {
    const service = TestBed.inject(OrderNotificationService);
    TestBed.tick();
    return service;
  }

  function setHidden(value: boolean): void {
    hidden = value;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  function toastMessages(): string[] {
    return TestBed.inject(ToastService)
      .toasts()
      .map((t) => t.message);
  }

  describe('S1: staff-only global listener', () => {
    it.each<RolUsuario>(['ADMIN', 'COCINA', 'MESERO'])(
      'listens to new orders on any route for %s',
      (rol) => {
        auth.loginAs(rol);
        const service = start();

        ws.emit(PEDIDOS, pedido(1));

        expect(service.unreadCount()).toBe(1);
      }
    );

    it('does not listen nor notify for CLIENTE or guests', () => {
      const service = start();
      ws.emit(PEDIDOS, pedido(1));

      auth.loginAs('CLIENTE');
      TestBed.tick();
      ws.emit(PEDIDOS, pedido(2));
      ws.emit(COCINA, pedido(3));

      expect(ws.listen).not.toHaveBeenCalled();
      expect(service.unreadCount()).toBe(0);
      expect(toastMessages()).toEqual([]);
      expect(sound.play).not.toHaveBeenCalled();
    });

    it('stops listening and resets the counter on logout', () => {
      auth.loginAs('MESERO');
      const service = start();
      ws.emit(PEDIDOS, pedido(1));
      expect(service.unreadCount()).toBe(1);

      auth.logout();
      TestBed.tick();
      ws.emit(PEDIDOS, pedido(2));

      expect(ws.isObserved(PEDIDOS)).toBe(false);
      expect(ws.isObserved(COCINA)).toBe(false);
      expect(service.unreadCount()).toBe(0);
    });

    it('restores a saved staff session so staff are notified on unguarded routes', () => {
      auth.sessionHintRol.mockReturnValue('MESERO');

      start();

      expect(auth.checkAuthStatus).toHaveBeenCalledTimes(1);
    });

    it('does not restore a saved CLIENTE session', () => {
      auth.sessionHintRol.mockReturnValue('CLIENTE');

      start();

      expect(auth.checkAuthStatus).not.toHaveBeenCalled();
    });
  });

  describe('S2: new-order rule', () => {
    it('notifies an unseen ABIERTO order once even if it arrives on both topics', () => {
      auth.loginAs('COCINA');
      const service = start();

      ws.emit(COCINA, pedido(10));
      ws.emit(PEDIDOS, pedido(10));

      expect(service.unreadCount()).toBe(1);
      expect(sound.play).toHaveBeenCalledTimes(1);
    });

    it('never notifies updates of an already-seen order', () => {
      auth.loginAs('ADMIN');
      const service = start();

      ws.emit(PEDIDOS, pedido(10));
      ws.emit(PEDIDOS, pedido(10, 'ABIERTO', { observaciones: 'sin sal' }));
      ws.emit(COCINA, pedido(10, 'EN_PREPARACION'));

      expect(service.unreadCount()).toBe(1);
    });

    it('does not notify an unseen order that is not ABIERTO', () => {
      auth.loginAs('ADMIN');
      const service = start();

      ws.emit(PEDIDOS, pedido(11, 'EN_PREPARACION'));
      ws.emit(PEDIDOS, pedido(12, 'SERVIDO'));
      ws.emit(PEDIDOS, pedido(13, 'FACTURADO'));
      ws.emit(PEDIDOS, pedido(14, 'ANULADO'));

      expect(service.unreadCount()).toBe(0);
      expect(toastMessages()).toEqual([]);
    });

    it('seeds the open orders at start so they are not announced', () => {
      pedidoService.searchPedidos.mockReturnValue(of(page([pedido(20), pedido(21)])));
      auth.loginAs('MESERO');
      const service = start();

      ws.emit(PEDIDOS, pedido(20));
      ws.emit(COCINA, pedido(21));
      ws.emit(PEDIDOS, pedido(22));

      expect(pedidoService.searchPedidos).toHaveBeenCalledWith(
        'ABIERTO',
        undefined,
        undefined,
        undefined,
        0,
        100
      );
      expect(service.unreadCount()).toBe(1);
    });

    it('holds messages received while seeding and evaluates them after the seed', () => {
      const seed = new Subject<PageResponse<Pedido>>();
      pedidoService.searchPedidos.mockReturnValue(seed);
      auth.loginAs('MESERO');
      const service = start();

      ws.emit(PEDIDOS, pedido(30));
      ws.emit(PEDIDOS, pedido(31));
      expect(service.unreadCount()).toBe(0);

      seed.next(page([pedido(30)]));
      seed.complete();

      expect(service.unreadCount()).toBe(1);
    });

    it('still notifies new orders when the seed request fails', () => {
      pedidoService.searchPedidos.mockReturnValue(throwError(() => new Error('500')));
      auth.loginAs('MESERO');
      const service = start();

      ws.emit(COCINA, pedido(40));

      expect(service.unreadCount()).toBe(1);
    });
  });

  describe('S3: toast, sound and counter', () => {
    it('shows a toast, plays a sound and increments the counter per new order', () => {
      auth.loginAs('MESERO');
      const service = start();

      ws.emit(PEDIDOS, pedido(50, 'ABIERTO', { tipo: 'SALON', numeroMesa: 4 }));
      ws.emit(COCINA, pedido(51, 'ABIERTO', { tipo: 'LLEVAR' }));

      expect(service.unreadCount()).toBe(2);
      expect(sound.play).toHaveBeenCalledTimes(2);
      expect(toastMessages()).toEqual(['Nuevo pedido · Mesa 4', 'Nuevo pedido para llevar']);
    });

    it('auto-dismisses the toast after about 5 seconds', () => {
      vi.useFakeTimers();
      auth.loginAs('MESERO');
      start();

      ws.emit(PEDIDOS, pedido(52));
      expect(toastMessages()).toEqual(['Nuevo pedido #52']);

      vi.advanceTimersByTime(5000);
      expect(toastMessages()).toEqual([]);
    });
  });

  describe('S4: document title while hidden', () => {
    it('prefixes the title with the unread count while hidden and restores it when cleared', () => {
      auth.loginAs('ADMIN');
      const service = start();
      setHidden(true);

      ws.emit(PEDIDOS, pedido(60));
      expect(document.title).toBe('(1) PosApp');
      ws.emit(PEDIDOS, pedido(61));
      expect(document.title).toBe('(2) PosApp');

      service.clear();

      expect(service.unreadCount()).toBe(0);
      expect(document.title).toBe('PosApp');
    });

    it('does not prefix the title while the tab is visible', () => {
      auth.loginAs('ADMIN');
      start();

      ws.emit(PEDIDOS, pedido(62));

      expect(document.title).toBe('PosApp');
    });
  });

  describe('S5: entering /cocina', () => {
    it('clears the counter and the title prefix', async () => {
      auth.loginAs('MESERO');
      const service = start();
      setHidden(true);
      ws.emit(PEDIDOS, pedido(70));
      ws.emit(PEDIDOS, pedido(71));
      expect(document.title).toBe('(2) PosApp');

      await TestBed.inject(Router).navigateByUrl('/cocina');

      expect(service.unreadCount()).toBe(0);
      expect(document.title).toBe('PosApp');
    });

    it('leaves alerting to the kitchen screen while it is open and visible', async () => {
      auth.loginAs('COCINA');
      const service = start();
      await TestBed.inject(Router).navigateByUrl('/cocina');

      ws.emit(COCINA, pedido(72));
      await TestBed.inject(Router).navigateByUrl('/mesas');
      ws.emit(PEDIDOS, pedido(72));

      expect(service.unreadCount()).toBe(0);
      expect(sound.play).not.toHaveBeenCalled();
      expect(toastMessages()).toEqual([]);
    });

    it('counts orders received on a hidden /cocina tab until the tab is shown again', async () => {
      auth.loginAs('COCINA');
      const service = start();
      await TestBed.inject(Router).navigateByUrl('/cocina');
      setHidden(true);

      ws.emit(COCINA, pedido(73));
      expect(service.unreadCount()).toBe(1);
      expect(document.title).toBe('(1) PosApp');
      expect(sound.play).not.toHaveBeenCalled();

      setHidden(false);

      expect(service.unreadCount()).toBe(0);
      expect(document.title).toBe('PosApp');
    });
  });

  describe('S6: coexistence with realtime screens', () => {
    it('keeps screen subscriptions on the shared topics working after logout', () => {
      auth.loginAs('ADMIN');
      start();
      const screen: unknown[] = [];
      ws.listen(PEDIDOS).subscribe((p) => screen.push(p));

      auth.logout();
      TestBed.tick();
      ws.emit(PEDIDOS, pedido(80));

      expect(screen).toEqual([pedido(80)]);
    });
  });
});

/** Counts live subscribers per topic, unlike a plain Subject fake. */
class CountingWs {
  private subjects = new Map<string, Subject<unknown>>();
  live = new Map<string, number>();

  listen<T>(topic: string): Observable<T> {
    if (!this.subjects.has(topic)) {
      this.subjects.set(topic, new Subject<unknown>());
    }
    const subject = this.subjects.get(topic)!;
    return new Observable<T>((subscriber) => {
      this.live.set(topic, (this.live.get(topic) ?? 0) + 1);
      const inner = subject.subscribe(subscriber as never);
      return () => {
        inner.unsubscribe();
        this.live.set(topic, this.live.get(topic)! - 1);
      };
    });
  }

  emit(topic: string, payload: unknown): void {
    this.subjects.get(topic)?.next(payload);
  }
}

describe('OrderNotificationService session lifecycle', () => {
  let ws: CountingWs;
  let auth: FakeAuthService;
  let seeds: Subject<PageResponse<Pedido>>[];

  beforeEach(() => {
    ws = new CountingWs();
    auth = new FakeAuthService();
    seeds = [];
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'mesas', component: DummyPage }]),
        { provide: WebSocketService, useValue: ws },
        { provide: AuthService, useValue: auth },
        {
          provide: PedidoService,
          useValue: {
            searchPedidos: vi.fn(() => {
              const seed = new Subject<PageResponse<Pedido>>();
              seeds.push(seed);
              return seed;
            }),
          },
        },
        { provide: NotificationSoundService, useValue: { play: vi.fn() } },
      ],
    });
  });

  afterEach(() => {
    delete (document as { hidden?: boolean }).hidden;
  });

  it('ignores a seed that settles after logout and starts clean on the next login', () => {
    auth.loginAs('MESERO');
    const service = TestBed.inject(OrderNotificationService);
    TestBed.tick();
    ws.emit(PEDIDOS, pedido(1));

    auth.logout();
    TestBed.tick();
    expect(seeds[0].observed).toBe(false);
    expect(ws.live.get(PEDIDOS)).toBe(0);
    seeds[0].next(page([]));
    seeds[0].complete();
    expect(service.unreadCount()).toBe(0);

    auth.loginAs('MESERO');
    TestBed.tick();
    expect(seeds.length).toBe(2);
    ws.emit(PEDIDOS, pedido(1));
    seeds[1].next(page([]));
    seeds[1].complete();
    expect(service.unreadCount()).toBe(1);
  });

  it('restarts the session when another staff user signs in while the seed is pending', () => {
    auth.loginAs('MESERO', 'a');
    const service = TestBed.inject(OrderNotificationService);
    TestBed.tick();
    ws.emit(PEDIDOS, pedido(5));

    auth.loginAs('ADMIN', 'b');
    TestBed.tick();
    expect(seeds.length).toBe(2);
    expect(seeds[0].observed).toBe(false);
    seeds[1].next(page([]));
    seeds[1].complete();
    // Order 5 was buffered for user "a" and dropped with that session.
    expect(service.unreadCount()).toBe(0);

    ws.emit(COCINA, pedido(6));
    expect(service.unreadCount()).toBe(1);
  });

  it('keeps exactly one subscription per topic across repeated auth cycles', () => {
    TestBed.inject(OrderNotificationService);
    for (let i = 0; i < 4; i++) {
      auth.loginAs('ADMIN', `x${i}`);
      TestBed.tick();
      auth.logout();
      TestBed.tick();
    }

    auth.loginAs('COCINA');
    TestBed.tick();

    expect(ws.live.get(PEDIDOS)).toBe(1);
    expect(ws.live.get(COCINA)).toBe(1);
  });
});

describe('OrderNotificationService seed over HTTP', () => {
  let ws: FakeWebSocketService;
  let auth: FakeAuthService;

  beforeEach(() => {
    ws = new FakeWebSocketService();
    auth = new FakeAuthService();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WebSocketService, useValue: ws },
        { provide: AuthService, useValue: auth },
        { provide: NotificationSoundService, useValue: { play: vi.fn() } },
      ],
    });
  });

  afterEach(() => {
    delete (document as { hidden?: boolean }).hidden;
  });

  it('sends no /pedidos/buscar request for a COCINA session and still notifies new orders', () => {
    const http = TestBed.inject(HttpTestingController);
    auth.loginAs('COCINA');
    const service = TestBed.inject(OrderNotificationService);
    TestBed.tick();

    http.expectNone((req) => req.url.endsWith('/pedidos/buscar'));
    ws.emit(COCINA, pedido(90));
    expect(service.unreadCount()).toBe(1);
  });

  it('seeds open orders over HTTP for an ADMIN or MESERO session', () => {
    const http = TestBed.inject(HttpTestingController);
    auth.loginAs('ADMIN');
    TestBed.inject(OrderNotificationService);
    TestBed.tick();

    const req = http.expectOne((r) => r.url.endsWith('/pedidos/buscar'));
    expect(req.request.params.get('estado')).toBe('ABIERTO');
    req.flush(page([]));
  });
});
