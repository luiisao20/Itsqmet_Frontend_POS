import {
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { RolUsuario } from '../models/auth';
import { Pedido } from '../models/pedido';
import { AuthService } from './auth-service';
import { NotificationSoundService } from './notification-sound-service';
import { PedidoService } from './pedido-service';
import { ToastService } from './toast-service';
import { WebSocketService } from './websocket-service';

const STAFF_ROLES: ReadonlySet<RolUsuario> = new Set<RolUsuario>(['ADMIN', 'COCINA', 'MESERO']);
const ORDER_TOPICS = [APP_CONFIG.TOPICS.PEDIDOS, APP_CONFIG.TOPICS.COCINA];
const KITCHEN_PATH = '/cocina';
/** Matches the backend `spring.data.web.pageable.max-page-size`. */
const SEED_PAGE_SIZE = 100;

/**
 * App-wide new-order alerts for staff (ADMIN, COCINA, MESERO).
 *
 * While a staff user is signed in it listens to the order topics on any route and, for every
 * order seen for the first time in state ABIERTO, shows a toast, plays a chime and increments
 * the unread counter shown in the navbar and, while the tab is hidden, in the document title.
 * Entering the kitchen screen clears the counter.
 *
 * It only subscribes to the shared WebSocketService topics and never deactivates the socket,
 * so the realtime screens keep their own subscriptions untouched.
 */
@Injectable({
  providedIn: 'root',
})
export class OrderNotificationService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly pedidoService = inject(PedidoService);
  private readonly toast = inject(ToastService);
  private readonly sound = inject(NotificationSoundService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private readonly unread = signal(0);
  readonly unreadCount = this.unread.asReadonly();

  private sessionUserId: string | null = null;
  private session: Subscription | null = null;
  private seenIds = new Set<number>();
  /** Orders received before the seed request settles; null once the seed is applied. */
  private pending: Pedido[] | null = null;
  private originalTitle: string | null = null;

  constructor() {
    // Unguarded routes never restore the session, so staff would miss alerts after a reload.
    // Only staff sessions are restored: clients and guests keep the baseline startup behavior.
    const hintRol = this.auth.sessionHintRol();
    if (hintRol && STAFF_ROLES.has(hintRol)) {
      void this.auth.checkAuthStatus();
    }

    effect(() => {
      const user = this.auth.currentUser();
      const rol = this.auth.currentRol();
      const staff = user && rol && STAFF_ROLES.has(rol) ? { userId: user.uuid, rol } : null;
      untracked(() => this.syncSession(staff));
    });

    const navigation = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isOnKitchenScreen()) {
          this.clear();
        }
      });

    const onVisibilityChange = () => {
      if (!this.document.hidden && this.isOnKitchenScreen()) {
        this.clear();
      } else {
        this.renderTitle();
      }
    };
    this.document.addEventListener('visibilitychange', onVisibilityChange);

    inject(DestroyRef).onDestroy(() => {
      navigation.unsubscribe();
      this.document.removeEventListener('visibilitychange', onVisibilityChange);
      this.stopSession();
    });
  }

  /** Marks every pending new order as seen. */
  clear(): void {
    this.unread.set(0);
    this.renderTitle();
  }

  private syncSession(staff: { userId: string; rol: RolUsuario } | null): void {
    if ((staff?.userId ?? null) === this.sessionUserId) {
      return;
    }
    this.stopSession();
    if (staff) {
      this.startSession(staff.userId, staff.rol);
    }
  }

  private startSession(staffUserId: string, rol: RolUsuario): void {
    this.sessionUserId = staffUserId;
    this.seenIds = new Set();

    const session = new Subscription();
    this.session = session;
    // Seeding is skipped for COCINA: the backend restricts /pedidos/** to ADMIN and MESERO
    // (GlobalConfig), so the request would always fail with 403. Limitation: an order already
    // open before a COCINA session may be announced once if it is re-broadcast while ABIERTO.
    const seed = rol !== 'COCINA';
    this.pending = seed ? [] : null;

    // Resolved lazily so guests and clients do not open the socket just by loading the app.
    const ws = this.injector.get(WebSocketService);
    for (const topic of ORDER_TOPICS) {
      session.add(ws.listen<Pedido>(topic).subscribe((pedido) => this.receive(pedido)));
    }

    if (!seed) {
      return;
    }
    // Seed the orders already open so they are not announced as new when they get updated.
    session.add(
      this.pedidoService
        .searchPedidos('ABIERTO', undefined, undefined, undefined, 0, SEED_PAGE_SIZE)
        .subscribe({
          next: (page) => page.content.forEach((pedido) => this.seenIds.add(pedido.id)),
          error: () => this.flushPending(),
          complete: () => this.flushPending(),
        })
    );
  }

  private stopSession(): void {
    this.session?.unsubscribe();
    this.session = null;
    this.sessionUserId = null;
    this.seenIds.clear();
    this.pending = null;
    this.clear();
  }

  private flushPending(): void {
    const pending = this.pending ?? [];
    this.pending = null;
    pending.forEach((pedido) => this.evaluate(pedido));
  }

  private receive(pedido: Pedido): void {
    if (pedido?.id == null) {
      return;
    }
    if (this.pending) {
      this.pending.push(pedido);
      return;
    }
    this.evaluate(pedido);
  }

  private evaluate(pedido: Pedido): void {
    if (this.seenIds.has(pedido.id)) {
      return;
    }
    this.seenIds.add(pedido.id);
    if (pedido.estado === 'ABIERTO') {
      this.announce(pedido);
    }
  }

  private announce(pedido: Pedido): void {
    if (this.isOnKitchenScreen()) {
      // The kitchen screen already lists the order and rings its own bell;
      // only count it when the tab is hidden so the title shows it.
      if (this.document.hidden) {
        this.increment();
      }
      return;
    }
    this.increment();
    this.toast.show(describeOrder(pedido));
    this.sound.play();
  }

  private increment(): void {
    this.unread.update((count) => count + 1);
    this.renderTitle();
  }

  private renderTitle(): void {
    const count = this.unread();
    if (count > 0 && this.document.hidden) {
      this.originalTitle ??= this.document.title;
      this.document.title = `(${count}) ${this.originalTitle}`;
    } else if (this.originalTitle !== null) {
      this.document.title = this.originalTitle;
      this.originalTitle = null;
    }
  }

  private isOnKitchenScreen(): boolean {
    const path = this.router.url.split(/[?#]/)[0];
    return path === KITCHEN_PATH || path.startsWith(`${KITCHEN_PATH}/`);
  }
}

function describeOrder(pedido: Pedido): string {
  if (pedido.tipo === 'LLEVAR') {
    return 'Nuevo pedido para llevar';
  }
  if (pedido.numeroMesa != null) {
    return `Nuevo pedido · Mesa ${pedido.numeroMesa}`;
  }
  return `Nuevo pedido #${pedido.id}`;
}
