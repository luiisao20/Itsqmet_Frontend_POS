import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService } from '../../../../service/factura-service';
import { Factura } from '../../../../models/factura';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-facturas.html',
})
export class AdminFacturas implements OnInit {
  private facturaService = inject(FacturaService);

  facturas = signal<Factura[]>([]);
  loading = signal<boolean>(false);

  filtroSecuencialFactura = signal<string>('');
  filtroClienteFactura = signal<string>('');

  facturaDetalleModalOpen = signal<boolean>(false);
  selectedFactura = signal<Factura | null>(null);

  ngOnInit(): void {
    this.loadFacturas();
  }

  loadFacturas(): void {
    this.loading.set(true);
    this.facturaService
      .searchFacturas(
        this.filtroSecuencialFactura() || undefined,
        this.filtroClienteFactura() || undefined,
        undefined,
        0,
        100
      )
      .subscribe({
        next: (res) => {
          this.facturas.set(res.content);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openVerDetalleFactura(f: Factura): void {
    this.selectedFactura.set(f);
    this.facturaDetalleModalOpen.set(true);
  }

  anularFacturaAdmin(f: Factura): void {
    if (!confirm(`¿Seguro que deseas anular la factura "${f.numeroSecuencial}"?`)) return;
    this.facturaService.anularFactura(f.id).subscribe({
      next: () => {
        alert('Factura anulada con éxito');
        this.loadFacturas();
      },
      error: (e) => alert(e.error?.message || 'Error al anular factura'),
    });
  }
}
