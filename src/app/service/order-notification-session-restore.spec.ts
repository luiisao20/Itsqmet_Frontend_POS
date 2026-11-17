import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { ClientePedidos } from '../features/cliente-pedidos/cliente-pedidos';
import { authInterceptor } from '../interceptor/auth-interceptor';
import { NotificationSoundService } from './notification-sound-service';
import { OrderNotificationService } from './order-notification-service';
import { WebSocketService } from './websocket-service';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class Host {}

class FakeWebSocketService {
  private subjects = new Map<string, Subject<unknown>>();
  listen<T>(topic: string): Observable<T> {
    if (!this.subjects.has(topic)) {
      this.subjects.set(topic, new Subject<unknown>());
    }
    return this.subjects.get(topic)!.asObservable() as Observable<T>;
  }
}

/** In-memory Storage: the Node test environment exposes no usable localStorage. */
function memoryStorage(init: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(init));
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key: string) => items.get(key) ?? null,
    key: (index: number) => [...items.keys()][index] ?? null,
    removeItem: (key: string) => void items.delete(key),
    setItem: (key: string, value: string) => void items.set(key, String(value)),
  } as Storage;
}

const ME_URL = '/auth/me';

/**
 * Startup session restore done by the notifier, exercised with the real AuthService,
 * HttpClient and interceptor. It must only happen for staff, so clients and guests keep
 * the baseline behavior (no extra /auth/me call).
 */
describe('OrderNotificationService startup session restore', () => {
  let originalStorage: PropertyDescriptor | undefined;

  function useStorage(descriptor: PropertyDescriptor): HttpTestingController {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...descriptor });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'cliente/pedidos', component: ClientePedidos }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: WebSocketService, useValue: new FakeWebSocketService() },
        { provide: NotificationSoundService, useValue: { play: vi.fn() } },
      ],
    });
    return TestBed.inject(HttpTestingController);
  }

  function meRequests(http: HttpTestingController): number {
    return http.match((req) => req.url.endsWith(ME_URL)).length;
  }

  beforeEach(() => {
    originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  });

  afterEach(() => {
    if (originalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalStorage);
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  });

  it('does not call /auth/me for a CLIENTE session reloaded on /cliente/pedidos', async () => {
    const http = useStorage({
      value: memoryStorage({ pos_logged_in: 'true', pos_user_rol: 'CLIENTE', pos_user_name: 'Ana' }),
    });

    TestBed.inject(OrderNotificationService);
    TestBed.tick();
    const host = TestBed.createComponent(Host);
    await TestBed.inject(Router).navigateByUrl('/cliente/pedidos');
    host.detectChanges();

    expect(meRequests(http)).toBe(0);
    host.destroy();
  });

  it('does not call /auth/me for a guest', () => {
    const http = useStorage({ value: memoryStorage() });

    TestBed.inject(OrderNotificationService);
    TestBed.tick();

    expect(meRequests(http)).toBe(0);
  });

  it.each(['ADMIN', 'COCINA', 'MESERO'])('restores a saved %s session once at startup', (rol) => {
    const http = useStorage({
      value: memoryStorage({ pos_logged_in: 'true', pos_user_rol: rol, pos_user_name: 'Ana' }),
    });

    TestBed.inject(OrderNotificationService);
    TestBed.tick();

    expect(meRequests(http)).toBe(1);
  });

  it.each<[string, PropertyDescriptor]>([
    [
      'throws',
      {
        get: () => {
          throw new DOMException('Storage is disabled', 'SecurityError');
        },
      },
    ],
    ['is undefined', { value: undefined }],
  ])('starts without throwing when storage access %s', (_case, descriptor) => {
    const http = useStorage(descriptor);

    expect(() => {
      TestBed.inject(OrderNotificationService);
      TestBed.tick();
    }).not.toThrow();
    expect(meRequests(http)).toBe(0);
  });
});
