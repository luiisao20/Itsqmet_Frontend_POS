import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PlatoService } from '../../service/plato-service';
import { PedidoService } from '../../service/pedido-service';
import { FacturaService } from '../../service/factura-service';
import { WebSocketService } from '../../service/websocket-service';
import { CategoriaPlato, Plato } from '../../models/plato';
import { Pedido } from '../../models/pedido';
import { Factura } from '../../models/factura';
import { PlatoCard } from '../../shared/plato-card/plato-card';
import { OrderSummary, CartItem } from '../../shared/order-summary/order-summary';
import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-cliente-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, PlatoCard, OrderSummary, Badge, Button],
  templateUrl: './cliente-pedidos.html',
})
export class ClientePedidos implements OnInit, OnDestroy {
  private platoService = inject(PlatoService);
  private pedidoService = inject(PedidoService);
  private facturaService = inject(FacturaService);
  private wsService = inject(WebSocketService);

  activeTab = signal<'nuevo' | 'historial' | 'facturas'>('nuevo');

  // Catálogo
  categorias = signal<CategoriaPlato[]>([]);
  platos = signal<Plato[]>([]);
  selectedCategoriaId = signal<number | null>(null);

  // Carrito
  cartItems = signal<CartItem[]>([]);
  observaciones = signal<string>('');
  loadingOrder = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  // Historial
  misPedidos = signal<Pedido[]>([]);
  misFacturas = signal<Factura[]>([]);
  loadingList = signal<boolean>(false);

  private wsSubscription?: Subscription;

  ngOnInit(): void {
    this.loadCategorias();
    this.loadPlatos();
    this.loadMisPedidos();
    this.loadMisFacturas();

    // Escuchar actualizaciones en vivo del pedido por WebSocket
    this.wsSubscription = this.wsService.listen<Pedido>('/topic/pedidos').subscribe({
      next: (updatedPedido) => {
        // Si el pedido pertenece a los míos, actualizarlo en la lista
        this.misPedidos.update((list) =>
          list.map((p) => (p.id === updatedPedido.id ? updatedPedido : p))
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
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
  }

  onRemoveItem(index: number): void {
    const current = [...this.cartItems()];
    current.splice(index, 1);
    this.cartItems.set(current);
  }

  onNotesChange(event: { index: number; notes: string }): void {
    const current = [...this.cartItems()];
    if (current[event.index]) {
      current[event.index].notasPreparacion = event.notes;
      this.cartItems.set(current);
    }
  }

  onSubmitTakeoutOrder(): void {
    if (this.cartItems().length === 0) return;

    this.loadingOrder.set(true);
    this.successMessage.set(null);

    const req = {
      observaciones: this.observaciones().trim() || undefined,
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
        this.successMessage.set(`¡Pedido #${created.id} enviado exitosamente a la cocina!`);

        // Recargar pedidos y cambiar a pestaña historial
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

  loadMisPedidos(): void {
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
