import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthResponse, RolUsuario } from '../../models/auth';
import { AuthService } from '../../service/auth-service';
import { OrderNotificationService } from '../../service/order-notification-service';
import { Navbar } from './navbar';

describe('Navbar unread orders badge', () => {
  const unreadCount = signal(0);

  function render(rol: RolUsuario): HTMLElement {
    const auth = {
      isAuthenticated: signal(true),
      currentRol: signal<RolUsuario | null>(rol),
      currentUser: signal<AuthResponse | null>({
        uuid: 'u1',
        nombre: 'Ana',
        email: 'ana@pos.com',
        rol,
        activo: true,
      }),
      logout: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: OrderNotificationService, useValue: { unreadCount } },
      ],
    });
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => unreadCount.set(0));

  it('shows the unread counter on the kitchen link', () => {
    unreadCount.set(3);

    const el = render('MESERO');

    const badge = el.querySelector('a[href="/cocina"] [data-unread-orders]');
    expect(badge?.textContent?.trim()).toBe('3');
  });

  it('hides the counter when there are no unread orders', () => {
    const el = render('COCINA');

    expect(el.querySelector('[data-unread-orders]')).toBeNull();
  });
});
