import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetallePedidoRequest } from '../../models/pedido';
import { Plato } from '../../models/plato';
import { Button } from '../button/button';

export interface CartItem {
  plato: Plato;
  cantidad: number;
  notasPreparacion: string;
}

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './order-summary.html',
})
export class OrderSummary {
  items = input.required<CartItem[]>();
  observaciones = input<string>('');
  loading = input<boolean>(false);
  title = input<string>('Resumen del Pedido');
  submitLabel = input<string>('Confirmar Pedido');

  quantityChange = output<{ index: number; delta: number }>();
  removeItem = output<number>();
  notesChange = output<{ index: number; notes: string }>();
  observacionesChange = output<string>();
  submitOrder = output<void>();

  get subtotal(): number {
    return this.items().reduce((acc, item) => acc + item.plato.precioUnitario * item.cantidad, 0);
  }

  get iva(): number {
    // 15% IVA sobre los platos con aplicaIva
    const baseIva = this.items()
      .filter((i) => i.plato.aplicaIva)
      .reduce((acc, item) => acc + item.plato.precioUnitario * item.cantidad, 0);
    return Number((baseIva * 0.15).toFixed(2));
  }

  get total(): number {
    return Number((this.subtotal + this.iva).toFixed(2));
  }
}
