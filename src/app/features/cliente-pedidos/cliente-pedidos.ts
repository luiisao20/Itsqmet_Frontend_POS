import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PlatoService } from '../../service/plato-service';
import { PedidoService } from '../../service/pedido-service';
import { FacturaService } from '../../service/factura-service';
import { WebSocketService } from '../../service/websocket-service';
import { PaqueteSorpresaService } from '../../service/paquete-sorpresa.service';
import { AuthService } from '../../service/auth-service';
import { CategoriaPlato, Plato } from '../../models/plato';
import { Pedido } from '../../models/pedido';
import { Factura } from '../../models/factura';
import { PaqueteSorpresa } from '../../models/paquete-sorpresa';
import { TipoIdentificacion } from '../../models/auth';
import { PlatoCard } from '../../shared/plato-card/plato-card';
import { OrderSummary, CartItem } from '../../shared/order-summary/order-summary';
import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';
import { Modal } from '../../shared/modal/modal';

@Component({
  selector: 'app-cliente-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, PlatoCard, OrderSummary, Badge, Button, Modal],
  templateUrl: './cliente-pedidos.html',
})
export class ClientePedidos implements OnInit, OnDestroy {
  private platoService = inject(PlatoService);
  private pedidoService = inject(PedidoService);
  private facturaService = inject(FacturaService);
  private wsService = inject(WebSocketService);
  private paqueteService = inject(PaqueteSorpresaService);
  public authService = inject(AuthService);

  activeTab = signal<'nuevo' | 'paquetes' | 'historial' | 'facturas'>('nuevo');

  // Catálogo
  categorias = signal<CategoriaPlato[]>([]);
  platos = signal<Plato[]>([]);
  selectedCategoriaId = signal<number | null>(null);

  // Carrito
  cartItems = signal<CartItem[]>([]);
  observaciones = signal<string>('');
  loadingOrder = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  // Paquetes Sorpresa (ODS 12)
  paquetes = signal<PaqueteSorpresa[]>([]);
  loadingPaquetes = signal<boolean>(false);
  selectedPaquete = signal<PaqueteSorpresa | null>(null);
  rescateModalOpen = signal<boolean>(false);
  rescateCantidad = signal<number>(1);
  rescateObservaciones = signal<string>('');
  loadingRescate = signal<boolean>(false);
  temporizadores = signal<{ [id: number]: string }>({});

  // Historial
  misPedidos = signal<Pedido[]>([]);
  misFacturas = signal<Factura[]>([]);
  loadingList = signal<boolean>(false);

  // Modal de Autenticación / Registro al Enviar Orden
  authModalOpen = signal<boolean>(false);
  authModalMessage = signal<string>('Identifícate para completar tu pedido');
  authTab = signal<'login' | 'register'>('login');
  authLoading = signal<boolean>(false);
  authError = signal<string | null>(null);

  // Campos Login Cliente
  authLoginInput = signal<string>('');
  authPasswordInput = signal<string>('');

  // Campos Registro Cliente
  regTipoId = signal<TipoIdentificacion>('CEDULA');
  regIdentificacion = signal<string>('');
  regRazonSocial = signal<string>('');
  regEmail = signal<string>('');
  regTelefono = signal<string>('');
  regDireccion = signal<string>('');
  regPassword = signal<string>('');

  private wsSubscription?: Subscription;
  private wsPaquetesSubscription?: Subscription;
  private timerInterval: any;

  ngOnInit(): void {
    this.loadCartFromStorage();
    this.loadCategorias();
    this.loadPlatos();
    this.loadPaquetes();

    if (this.authService.isAuthenticated() && this.authService.currentRol() === 'CLIENTE') {
      this.loadMisPedidos();
      this.loadMisFacturas();
      this.checkAndExecutePendingAction();
    }

    // Escuchar actualizaciones en vivo del pedido por WebSocket
    this.wsSubscription = this.wsService.listen<Pedido>('/topic/pedidos').subscribe({
      next: (updatedPedido) => {
        this.misPedidos.update((list) =>
          list.map((p) => (p.id === updatedPedido.id ? updatedPedido : p))
        );
      },
    });

    // Escuchar actualizaciones de paquetes sorpresa en tiempo real
    this.wsPaquetesSubscription = this.paqueteService.listenPaquetes().subscribe({
      next: (updatedPack) => {
        this.paquetes.update((list) => {
          const idx = list.findIndex((p) => p.id === updatedPack.id);
          if (idx > -1) {
            const copy = [...list];
            copy[idx] = updatedPack;
            return copy;
          }
          return [...list, updatedPack];
        });
      },
    });

    // Temporizador cada 1 segundo para cuentas regresivas
    this.timerInterval = setInterval(() => {
      this.tickTemporizadores();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
    this.wsPaquetesSubscription?.unsubscribe();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // --- PERSISTENCIA DE CARRITO EN LOCALSTORAGE ---
  private loadCartFromStorage(): void {
    try {
      const stored = localStorage.getItem('pos_cart_items');
      if (stored) {
        this.cartItems.set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error al leer carrito local', e);
    }
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem('pos_cart_items', JSON.stringify(this.cartItems()));
    } catch (e) {
      console.error('Error al guardar carrito local', e);
    }
  }

  private tickTemporizadores(): void {
    const map: { [id: number]: string } = {};
    const now = new Date();
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    this.paquetes.update((packs) =>
      packs.map((p) => {
        if (!p.horaInicioVisibilidad) return p;
        const parts = p.horaInicioVisibilidad.split(':').map(Number);
        const targetSecs = parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
        const diff = targetSecs - nowSecs;

        if (diff > 0) {
          const h = Math.floor(diff / 3600);
          const m = Math.floor((diff % 3600) / 60);
          const s = diff % 60;
          map[p.id] = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          return { ...p, disponibleAhora: false, segundosParaApertura: diff };
        } else {
          map[p.id] = '00:00:00';
          const finParts = (p.horaFinRecogida || '23:59:59').split(':').map(Number);
          const finSecs = finParts[0] * 3600 + finParts[1] * 60 + (finParts[2] || 0);
          const dentroHorario = nowSecs <= finSecs;
          const tieneStock = p.cantidadDisponible > 0;
          return {
            ...p,
            disponibleAhora: dentroHorario && tieneStock && p.estado !== 'FINALIZADO' && p.estado !== 'AGOTADO',
            segundosParaApertura: 0,
          };
        }
      })
    );
    this.temporizadores.set(map);
  }

  loadPaquetes(): void {
    this.loadingPaquetes.set(true);
    this.paqueteService.getDisponibles().subscribe({
      next: (packs) => {
        this.paquetes.set(packs);
        this.loadingPaquetes.set(false);
        this.tickTemporizadores();
      },
      error: () => this.loadingPaquetes.set(false),
    });
  }

  openRescateModal(pack: PaqueteSorpresa): void {
    this.selectedPaquete.set(pack);
    this.rescateCantidad.set(1);
    this.rescateObservaciones.set('');
    this.rescateModalOpen.set(true);
  }

  closeRescateModal(): void {
    this.rescateModalOpen.set(false);
    this.selectedPaquete.set(null);
  }

  confirmarRescate(): void {
    const pack = this.selectedPaquete();
    if (!pack) return;

    // Si NO está autenticado, guardar acción pendiente y pedir login/registro
    if (!this.authService.isAuthenticated() || this.authService.currentRol() !== 'CLIENTE') {
      const pending = {
        type: 'PACK_SORPRESA',
        packId: pack.id,
        cantidad: this.rescateCantidad(),
        observaciones: this.rescateObservaciones().trim() || undefined,
      };
      localStorage.setItem('pos_pending_action', JSON.stringify(pending));
      this.closeRescateModal();
      this.openAuthModal('Para rescatar este paquete sorpresa, por favor inicia sesión o crea tu cuenta.');
      return;
    }

    this.executeRescate(pack.id, this.rescateCantidad(), this.rescateObservaciones().trim() || undefined);
  }

  private executeRescate(packId: number, cantidad: number, observaciones?: string): void {
    this.loadingRescate.set(true);
    this.paqueteService
      .rescatar(packId, {
        cantidad,
        observaciones,
      })
      .subscribe({
        next: (res) => {
          this.loadingRescate.set(false);
          this.closeRescateModal();
          localStorage.removeItem('pos_pending_action');

          this.successMessage.set(
            `🌱 ¡Paquete "${res.tituloPaquete}" rescatado con éxito! Pedido #${res.idPedido}. Retíralo antes de las ${res.horaFinRecogida}.`
          );
          this.loadMisPedidos();
          setTimeout(() => {
            this.activeTab.set('historial');
            this.successMessage.set(null);
          }, 2000);
        },
        error: (err) => {
          this.loadingRescate.set(false);
          alert(err.error?.message || 'No fue posible rescatar el paquete sorpresa.');
        },
      });
  }

  loadCategorias(): void {
    this.platoService.getCategorias().subscribe((res: any) => {
      this.categorias.set(res.content ? res.content : res);
    });
  }

  loadPlatos(): void {
    if (this.selectedCategoriaId()) {
      this.platoService.getPlatosByCategoria(this.selectedCategoriaId()!).subscribe((res) => {
        this.platos.set(res.content);
      });
    } else {
      this.platoService.getPlatos().subscribe((res) => {
        this.platos.set(res.content);
      });
    }
  }

  filterCategoria(id: number | null): void {
    this.selectedCategoriaId.set(id);
    this.loadPlatos();
  }

  onAddToCart(plato: Plato): void {
    const current = [...this.cartItems()];
    const index = current.findIndex((i) => i.plato.id === plato.id);

    if (index > -1) {
      current[index].cantidad += 1;
      this.cartItems.set(current);
    } else {
      this.cartItems.set([...current, { plato, cantidad: 1, notasPreparacion: '' }]);
    }
    this.saveCartToStorage();
  }

  onQuantityChange(event: { index: number; delta: number }): void {
    const current = [...this.cartItems()];
    const item = current[event.index];
    if (!item) return;

    item.cantidad += event.delta;
    if (item.cantidad <= 0) {
      current.splice(event.index, 1);
    }
    this.cartItems.set(current);
    this.saveCartToStorage();
  }

  onRemoveItem(index: number): void {
    const current = [...this.cartItems()];
    current.splice(index, 1);
    this.cartItems.set(current);
    this.saveCartToStorage();
  }

  onNotesChange(event: { index: number; notes: string }): void {
    const current = [...this.cartItems()];
    if (current[event.index]) {
      current[event.index].notasPreparacion = event.notes;
      this.cartItems.set(current);
      this.saveCartToStorage();
    }
  }

  onSubmitTakeoutOrder(): void {
    if (this.cartItems().length === 0) return;

    // Si NO está autenticado, guardar acción pendiente y pedir login/registro
    if (!this.authService.isAuthenticated() || this.authService.currentRol() !== 'CLIENTE') {
      const pending = {
        type: 'PEDIDO',
        observaciones: this.observaciones().trim() || undefined,
      };
      localStorage.setItem('pos_pending_action', JSON.stringify(pending));
      this.saveCartToStorage();
      this.openAuthModal('Para confirmar tu pedido para llevar, por favor inicia sesión o regístrate como cliente.');
      return;
    }

    this.executeTakeoutOrder(this.observaciones().trim() || undefined);
  }

  private executeTakeoutOrder(observaciones?: string): void {
    if (this.cartItems().length === 0) return;

    this.loadingOrder.set(true);
    this.successMessage.set(null);

    const req = {
      observaciones: observaciones || this.observaciones().trim() || undefined,
      detalles: this.cartItems().map((i) => ({
        idPlato: i.plato.id,
        cantidad: i.cantidad,
        notasPreparacion: i.notasPreparacion.trim() || undefined,
      })),
    };

    this.pedidoService.createPedidoCliente(req).subscribe({
      next: (created) => {
        this.loadingOrder.set(false);
        this.cartItems.set([]);
        this.observaciones.set('');
        localStorage.removeItem('pos_cart_items');
        localStorage.removeItem('pos_pending_action');

        this.successMessage.set(`¡Pedido #${created.id} enviado exitosamente a la cocina!`);
        this.loadMisPedidos();
        setTimeout(() => {
          this.activeTab.set('historial');
          this.successMessage.set(null);
        }, 1800);
      },
      error: (err) => {
        this.loadingOrder.set(false);
        alert(err.error?.message || 'Error al procesar el pedido para llevar.');
      },
    });
  }

  // --- MODAL DE AUTENTICACIÓN / REGISTRO AL COMPLETAR ORDEN ---
  openAuthModal(mensaje?: string): void {
    this.authModalMessage.set(mensaje || 'Identifícate para continuar con tu pedido.');
    this.authTab.set('login');
    this.authError.set(null);
    this.authLoginInput.set('');
    this.authPasswordInput.set('');
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
    this.authError.set(null);
  }

  onAuthLogin(): void {
    this.authError.set(null);
    const loginVal = this.authLoginInput().trim();
    const passVal = this.authPasswordInput();

    if (!loginVal || !passVal) {
      this.authError.set('Por favor ingresa tu correo o identificación y contraseña.');
      return;
    }

    this.authLoading.set(true);
    this.authService
      .loginCliente({
        login: loginVal,
        password: passVal,
      })
      .subscribe({
        next: () => {
          this.handlePostAuthSuccess();
        },
        error: (err) => {
          this.authLoading.set(false);
          this.authError.set(
            err.error?.message || 'Credenciales inválidas. Verifica tu correo o identificación.'
          );
        },
      });
  }

  onAuthRegister(): void {
    this.authError.set(null);
    const idVal = this.regIdentificacion().trim();
    const razonVal = this.regRazonSocial().trim();
    const emailVal = this.regEmail().trim().toLowerCase();
    const passVal = this.regPassword();

    if (!idVal || !razonVal || !emailVal || !passVal) {
      this.authError.set('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (passVal.length < 6) {
      this.authError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.authLoading.set(true);
    this.authService
      .registerCliente({
        tipoIdentificacion: this.regTipoId(),
        identificacion: idVal,
        razonSocial: razonVal,
        email: emailVal,
        telefono: this.regTelefono().trim() || undefined,
        direccion: this.regDireccion().trim() || undefined,
        password: passVal,
      })
      .subscribe({
        next: () => {
          this.handlePostAuthSuccess();
        },
        error: (err) => {
          this.authLoading.set(false);
          this.authError.set(
            err.error?.message || 'Error al crear la cuenta. Verifica que los datos no estén registrados.'
          );
        },
      });
  }

  private handlePostAuthSuccess(): void {
    this.authModalOpen.set(false);
    this.authLoading.set(false);
    this.authError.set(null);

    this.loadMisPedidos();
    this.loadMisFacturas();
    this.checkAndExecutePendingAction();
  }

  private checkAndExecutePendingAction(): void {
    const raw = localStorage.getItem('pos_pending_action');
    if (!raw) return;

    try {
      const pending = JSON.parse(raw);
      if (pending.type === 'PEDIDO') {
        if (this.cartItems().length > 0) {
          this.executeTakeoutOrder(pending.observaciones);
        }
      } else if (pending.type === 'PACK_SORPRESA' && pending.packId) {
        this.executeRescate(pending.packId, pending.cantidad || 1, pending.observaciones);
      }
    } catch (e) {
      console.error('Error al procesar acción pendiente de localStorage', e);
      localStorage.removeItem('pos_pending_action');
    }
  }

  loadMisPedidos(): void {
    if (!this.authService.isAuthenticated()) {
      this.misPedidos.set([]);
      return;
    }
    this.loadingList.set(true);
    this.pedidoService.getMisPedidos().subscribe({
      next: (res) => {
        this.misPedidos.set(res.content);
        this.loadingList.set(false);
      },
      error: () => this.loadingList.set(false),
    });
  }

  loadMisFacturas(): void {
    if (!this.authService.isAuthenticated()) {
      this.misFacturas.set([]);
      return;
    }
    this.facturaService.getMisFacturas().subscribe({
      next: (res) => {
        this.misFacturas.set(res.content);
      },
    });
  }

  getEstadoVariant(estado: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    switch (estado) {
      case 'ABIERTO':
        return 'info';
      case 'EN_PREPARACION':
        return 'warning';
      case 'SERVIDO':
        return 'success';
      case 'FACTURADO':
        return 'success';
      case 'ANULADO':
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
