import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../service/pedido-service';
import { FacturaService } from '../../service/factura-service';
import { Pedido } from '../../models/pedido';
import { Factura, MetodoPago } from '../../models/factura';
import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';
import { Modal } from '../../shared/modal/modal';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Modal],
  templateUrl: './caja.html',
})
export class Caja implements OnInit {
  private pedidoService = inject(PedidoService);
  private facturaService = inject(FacturaService);

  pedidosPorCobrar = signal<Pedido[]>([]);
  facturasRecientes = signal<Factura[]>([]);
  loading = signal<boolean>(true);

  // Modal Facturar
  facturaModalOpen = signal<boolean>(false);
  selectedPedido = signal<Pedido | null>(null);
  numeroSecuencial = signal<string>('');
  propina = signal<number>(0);
  loadingFactura = signal<boolean>(false);

  // Modal Pago
  pagoModalOpen = signal<boolean>(false);
  selectedFactura = signal<Factura | null>(null);
  metodoPago = signal<MetodoPago>('EFECTIVO');
  montoPago = signal<number>(0);
  referenciaPago = signal<string>('');
  loadingPago = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.pedidoService.getPedidos(0, 50).subscribe({
      next: (res) => {
        // Pedidos listos para cobrar (SERVIDOS o ABIERTOS para llevar)
        const porCobrar = res.content.filter((p) => p.estado === 'SERVIDO' || (p.tipo === 'LLEVAR' && p.estado !== 'FACTURADO' && p.estado !== 'ANULADO'));
        this.pedidosPorCobrar.set(porCobrar);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.facturaService.getFacturas(0, 10).subscribe({
      next: (res) => {
        this.facturasRecientes.set(res.content);
      },
    });
  }

  openFacturarModal(pedido: Pedido): void {
    this.selectedPedido.set(pedido);
    // Generar secuencial sugerido basado en timestamp
    const randomSec = String(Math.floor(100000 + Math.random() * 900000));
    this.numeroSecuencial.set(`001-001-000${randomSec}`);
    this.propina.set(0);
    this.facturaModalOpen.set(true);
  }

  get subtotalPedido(): number {
    const p = this.selectedPedido();
    if (!p) return 0;
    return p.detalles.reduce((acc, d) => acc + d.subtotal, 0);
  }

  get ivaPedido(): number {
    return Number((this.subtotalPedido * 0.15).toFixed(2));
  }

  get totalPedido(): number {
    return Number((this.subtotalPedido + this.ivaPedido + (this.propina() || 0)).toFixed(2));
  }

  emitirFactura(): void {
    const p = this.selectedPedido();
    if (!p) return;

    this.loadingFactura.set(true);
    const req = {
      idPedido: p.id,
      idCliente: p.idCliente || '9960cfbb-50ec-4caa-bad3-1c0fb0b2a43e', // Default o asociado
      numeroSecuencial: this.numeroSecuencial().trim(),
      propina: this.propina() || 0,
    };

    this.facturaService.emitirFactura(req).subscribe({
      next: (factura) => {
        this.loadingFactura.set(false);
        this.facturaModalOpen.set(false);
        this.loadData();
        // Abrir de inmediato el modal de pago para cobrar
        this.openPagoModal(factura);
      },
      error: (err) => {
        this.loadingFactura.set(false);
        alert(err.error?.message || 'Error al emitir factura');
      },
    });
  }

  openPagoModal(factura: Factura): void {
    this.selectedFactura.set(factura);
    this.montoPago.set(factura.total);
    this.metodoPago.set('EFECTIVO');
    this.referenciaPago.set('');
    this.pagoModalOpen.set(true);
  }

  registrarPago(): void {
    const f = this.selectedFactura();
    if (!f) return;

    this.loadingPago.set(true);
    const req = {
      idFactura: f.id,
      metodoPago: this.metodoPago(),
      monto: this.montoPago(),
      referenciaTransaccion: this.referenciaPago().trim() || undefined,
    };

    this.facturaService.registrarPago(req).subscribe({
      next: () => {
        this.loadingPago.set(false);
        this.pagoModalOpen.set(false);
        alert(`¡Pago de $${f.total.toFixed(2)} registrado exitosamente!`);
        this.loadData();
      },
      error: (err) => {
        this.loadingPago.set(false);
        alert(err.error?.message || 'Error al registrar el pago');
      },
    });
  }
}
