import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../service/pedido-service';
import { WebSocketService } from '../../service/websocket-service';
import { EstadoPedido, Pedido } from '../../models/pedido';
import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './cocina.html',
})
export class Cocina implements OnInit, OnDestroy {
  private pedidoService = inject(PedidoService);
  private wsService = inject(WebSocketService);

  pedidos = signal<Pedido[]>([]);
  loading = signal<boolean>(true);
  wsConnected = signal<boolean>(true);
  filtroEstado = signal<'TODOS' | 'ABIERTO' | 'EN_PREPARACION' | 'SERVIDO'>('TODOS');

  private wsSubscription?: Subscription;

  ngOnInit(): void {
    this.loadActiveOrders();

    // Escuchar pedidos entrantes en tiempo real por WebSocket
    this.wsSubscription = this.wsService.listen<Pedido>('/topic/cocina').subscribe({
      next: (pedido) => {
        this.handleIncomingPedido(pedido);
      },
    });

    // También escuchar actualizaciones generales de pedidos
    this.wsService.listen<Pedido>('/topic/pedidos').subscribe({
      next: (pedido) => {
        this.handleIncomingPedido(pedido);
      },
    });
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  loadActiveOrders(): void {
    this.loading.set(true);
    this.pedidoService.getPedidos(0, 50).subscribe({
      next: (res) => {
        // Filtrar pedidos no cerrados / no facturados
        const active = res.content.filter(
          (p) => p.estado !== 'FACTURADO' && p.estado !== 'ANULADO'
        );
        this.pedidos.set(active);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private handleIncomingPedido(pedido: Pedido): void {
    const current = [...this.pedidos()];
    const index = current.findIndex((p) => p.id === pedido.id);

    if (index > -1) {
      if (pedido.estado === 'FACTURADO' || pedido.estado === 'ANULADO') {
        current.splice(index, 1);
      } else {
        current[index] = pedido;
      }
    } else {
      if (pedido.estado !== 'FACTURADO' && pedido.estado !== 'ANULADO') {
        current.unshift(pedido); // Poner al inicio de la cola
        this.playKitchenBellSound();
      }
    }

    this.pedidos.set(current);
  }

  updateEstado(pedido: Pedido, nuevoEstado: EstadoPedido): void {
    this.pedidoService.updateEstado(pedido.id, nuevoEstado).subscribe({
      next: (updated) => {
        this.handleIncomingPedido(updated);
      },
      error: (err) => {
        alert(err.error?.message || 'Error al actualizar estado del pedido');
      },
    });
  }

  private playKitchenBellSound(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // AudioContext bloqueado si no hubo interacción previa
    }
  }

  get filteredPedidos(): Pedido[] {
    const f = this.filtroEstado();
    if (f === 'TODOS') return this.pedidos();
    return this.pedidos().filter((p) => p.estado === f);
  }

  getEstadoVariant(estado: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    switch (estado) {
      case 'ABIERTO':
        return 'info';
      case 'EN_PREPARACION':
        return 'warning';
      case 'SERVIDO':
        return 'success';
      default:
        return 'neutral';
    }
  }
}
