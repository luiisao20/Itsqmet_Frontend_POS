import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MesaService } from '../../service/mesa-service';
import { PlatoService } from '../../service/plato-service';
import { PedidoService } from '../../service/pedido-service';
import { EstadoMesa, Mesa } from '../../models/mesa';
import { CategoriaPlato, Plato } from '../../models/plato';
import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';
import { Modal } from '../../shared/modal/modal';
import { OrderSummary, CartItem } from '../../shared/order-summary/order-summary';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal, OrderSummary],
  templateUrl: './mesas.html',
})
export class Mesas implements OnInit {
  private mesaService = inject(MesaService);
  private platoService = inject(PlatoService);
  private pedidoService = inject(PedidoService);

  mesas = signal<Mesa[]>([]);
  loadingMesas = signal<boolean>(true);

  // Modal para tomar pedido en mesa
  modalOpen = signal<boolean>(false);
  selectedMesa = signal<Mesa | null>(null);

  // Catálogo para seleccionar
  categorias = signal<CategoriaPlato[]>([]);
  platos = signal<Plato[]>([]);
  selectedCategoriaId = signal<number | null>(null);

  // Items de comanda para la mesa
  comandaItems = signal<CartItem[]>([]);
  observaciones = signal<string>('');
  loadingOrder = signal<boolean>(false);

  ngOnInit(): void {
    this.loadMesas();
    this.loadCatalog();
  }

  loadMesas(): void {
    this.loadingMesas.set(true);
    this.mesaService.getMesas().subscribe({
      next: (res) => {
        this.mesas.set(res.content);
        this.loadingMesas.set(false);
      },
      error: () => this.loadingMesas.set(false),
    });
  }

  loadCatalog(): void {
    this.platoService.getCategorias().subscribe((res: any) => {
      this.categorias.set(res.content ? res.content : res);
    });
    this.platoService.getPlatos().subscribe((res) => {
      this.platos.set(res.content);
    });
  }

  openComandaModal(mesa: Mesa): void {
    this.selectedMesa.set(mesa);
    this.comandaItems.set([]);
    this.observaciones.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedMesa.set(null);
  }

  addPlatoToComanda(plato: Plato): void {
    const current = [...this.comandaItems()];
    const index = current.findIndex((i) => i.plato.id === plato.id);

    if (index > -1) {
      current[index].cantidad += 1;
      this.comandaItems.set(current);
    } else {
      this.comandaItems.set([...current, { plato, cantidad: 1, notasPreparacion: '' }]);
    }
  }

  onQuantityChange(event: { index: number; delta: number }): void {
    const current = [...this.comandaItems()];
    const item = current[event.index];
    if (!item) return;

    item.cantidad += event.delta;
    if (item.cantidad <= 0) current.splice(event.index, 1);
    this.comandaItems.set(current);
  }

  onRemoveItem(index: number): void {
    const current = [...this.comandaItems()];
    current.splice(index, 1);
    this.comandaItems.set(current);
  }

  onNotesChange(event: { index: number; notes: string }): void {
    const current = [...this.comandaItems()];
    if (current[event.index]) {
      current[event.index].notasPreparacion = event.notes;
      this.comandaItems.set(current);
    }
  }

  submitComanda(): void {
    const mesa = this.selectedMesa();
    if (!mesa || this.comandaItems().length === 0) return;

    this.loadingOrder.set(true);
    const req = {
      idMesa: mesa.id,
      tipo: 'SALON' as const,
      observaciones: this.observaciones().trim() || undefined,
      detalles: this.comandaItems().map((i) => ({
        idPlato: i.plato.id,
        cantidad: i.cantidad,
        notasPreparacion: i.notasPreparacion.trim() || undefined,
      })),
    };

    this.pedidoService.createPedido(req).subscribe({
      next: () => {
        this.loadingOrder.set(false);
        this.closeModal();
        this.loadMesas();
      },
      error: (err) => {
        this.loadingOrder.set(false);
        alert(err.error?.message || 'Error al enviar la comanda de la mesa');
      },
    });
  }

  cambiarEstadoMesa(mesa: Mesa, nuevoEstado: EstadoMesa, event: MouseEvent): void {
    event.stopPropagation();
    this.mesaService.updateEstado(mesa.id, nuevoEstado).subscribe({
      next: () => this.loadMesas(),
      error: (err) => alert(err.error?.message || 'Error al cambiar estado de mesa'),
    });
  }

  getMesaColor(estado: EstadoMesa): string {
    switch (estado) {
      case 'LIBRE':
        return 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-400';
      case 'OCUPADA':
        return 'border-amber-200 bg-amber-50/40 hover:border-amber-400';
      case 'CUENTA':
        return 'border-sky-200 bg-sky-50/40 hover:border-sky-400';
    }
  }
}
