import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompraService } from '../../../../service/compra-service';
import { DistribuidorService } from '../../../../service/distribuidor-service';
import { InsumoService } from '../../../../service/insumo-service';
import {
  CompraInsumo,
  CompraInsumoRequest,
  EstadoCompra,
} from '../../../../models/compra';
import { Distribuidor } from '../../../../models/distribuidor';
import { Insumo } from '../../../../models/insumo';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-compras.html',
})
export class AdminCompras implements OnInit {
  private compraService = inject(CompraService);
  private distribuidorService = inject(DistribuidorService);
  private insumoService = inject(InsumoService);

  compras = signal<CompraInsumo[]>([]);
  distribuidores = signal<Distribuidor[]>([]);
  insumos = signal<Insumo[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  filtroNumeroFacturaCompra = signal<string>('');
  filtroDistribuidorCompra = signal<number | null>(null);

  compraDetalleModalOpen = signal<boolean>(false);
  selectedCompra = signal<CompraInsumo | null>(null);

  compraCrearModalOpen = signal<boolean>(false);
  compraForm = signal<{
    idDistribuidor: number | null;
    numeroFacturaProveedor: string;
    estado: EstadoCompra;
    detalles: { idInsumo: number; cantidad: number; costoUnitario: number }[];
  }>({
    idDistribuidor: null,
    numeroFacturaProveedor: '',
    estado: 'RECIBIDA',
    detalles: [],
  });

  ngOnInit(): void {
    this.loadDistribuidores();
    this.loadInsumos();
    this.loadCompras();
  }

  loadDistribuidores(): void {
    this.distribuidorService.getDistribuidores(0, 100).subscribe({
      next: (res) => this.distribuidores.set(res.content),
      error: () => {},
    });
  }

  loadInsumos(): void {
    this.insumoService.getInsumos(0, 100).subscribe({
      next: (res) => this.insumos.set(res.content),
      error: () => {},
    });
  }

  loadCompras(): void {
    this.loading.set(true);
    this.compraService
      .searchCompras(
        this.filtroNumeroFacturaCompra() || undefined,
        this.filtroDistribuidorCompra()
          ? Number(this.filtroDistribuidorCompra())
          : undefined,
        undefined,
        0,
        100,
      )
      .subscribe({
        next: (res) => {
          this.compras.set(res.content);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openVerDetalleCompra(c: CompraInsumo): void {
    this.selectedCompra.set(c);
    this.compraDetalleModalOpen.set(true);
  }

  openCrearCompra(): void {
    const distId =
      this.distribuidores().length > 0 ? this.distribuidores()[0].id : null;
    const insId = this.insumos().length > 0 ? this.insumos()[0].id : 1;
    this.compraForm.set({
      idDistribuidor: distId,
      numeroFacturaProveedor: '',
      estado: 'RECIBIDA',
      detalles: [{ idInsumo: insId, cantidad: 10, costoUnitario: 1.5 }],
    });
    this.compraCrearModalOpen.set(true);
  }

  addDetalleCompraRow(): void {
    const insId = this.insumos().length > 0 ? this.insumos()[0].id : 1;
    const f = this.compraForm();
    this.compraForm.set({
      ...f,
      detalles: [
        ...f.detalles,
        { idInsumo: insId, cantidad: 1, costoUnitario: 1.0 },
      ],
    });
  }

  removeDetalleCompraRow(index: number): void {
    const f = this.compraForm();
    if (f.detalles.length <= 1) return;
    this.compraForm.set({
      ...f,
      detalles: f.detalles.filter((_, i) => i !== index),
    });
  }

  get totalCalculadoCompra(): number {
    return this.compraForm().detalles.reduce(
      (acc, d) =>
        acc + (Number(d.cantidad) || 0) * (Number(d.costoUnitario) || 0),
      0,
    );
  }

  submitCrearCompra(): void {
    const f = this.compraForm();
    if (!f.idDistribuidor) {
      alert('Debe seleccionar un distribuidor');
      return;
    }
    if (!f.numeroFacturaProveedor?.trim()) {
      alert('Ingrese el número de factura del proveedor');
      return;
    }
    if (f.detalles.length === 0) {
      alert('Debe agregar al menos un insumo');
      return;
    }

    this.loadingSubmit.set(true);
    const req: CompraInsumoRequest = {
      idDistribuidor: Number(f.idDistribuidor),
      numeroFacturaProveedor: f.numeroFacturaProveedor.trim(),
      estado: f.estado,
      detalles: f.detalles.map((d) => ({
        idInsumo: Number(d.idInsumo),
        cantidad: Number(d.cantidad),
        costoUnitario: Number(d.costoUnitario),
      })),
    };

    this.compraService.registrarCompra(req).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.compraCrearModalOpen.set(false);
        this.loadCompras();
        this.loadInsumos();
        alert(
          'Factura de compra registrada con éxito. Se actualizó el stock y costo promedio.',
        );
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al registrar la compra');
      },
    });
  }

  cambiarEstadoCompra(c: CompraInsumo, nuevoEstado: EstadoCompra): void {
    this.compraService.updateEstado(c.id, nuevoEstado).subscribe({
      next: () => this.loadCompras(),
      error: (e) => alert(e.error?.message || 'Error al cambiar estado'),
    });
  }
}
