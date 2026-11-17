import { TestBed } from '@angular/core/testing';
import { ToastService } from '../../service/toast-service';
import { ToastContainer } from './toast';

describe('ToastContainer', () => {
  afterEach(() => vi.useRealTimers());

  it('renders active toasts in a polite live region and removes them on dismiss', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [ToastContainer] });
    const fixture = TestBed.createComponent(ToastContainer);
    const toasts = TestBed.inject(ToastService);

    toasts.show('Nuevo pedido · Mesa 4');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Nuevo pedido · Mesa 4');

    (el.querySelector('button[aria-label="Cerrar notificación"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.textContent).not.toContain('Nuevo pedido · Mesa 4');
  });
});
