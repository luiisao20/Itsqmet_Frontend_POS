import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../service/reporte-service';
import { GastosProveedor, MargenPlato, PlatoPopular, VentaResumen } from '../../models/reporte';
import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button],
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {
  private reporteService = inject(ReporteService);

  fechaDesde = signal<string>(this.getDefaultStartDate());
  fechaHasta = signal<string>(this.getDefaultEndDate());

  loading = signal<boolean>(false);
  resumen = signal<VentaResumen | null>(null);
  platosPopulares = signal<PlatoPopular[]>([]);
  gastosProveedores = signal<GastosProveedor[]>([]);
  margenes = signal<MargenPlato[]>([]);

  // Cálculos ODS 8: Compras Locales
  totalGastoLocal = computed(() => {
    return this.gastosProveedores()
      .filter((g) => g.esProveedorLocal)
      .reduce((acc, curr) => acc + Number(curr.totalCompras), 0);
  });

  totalGastoTotal = computed(() => {
    return this.gastosProveedores().reduce((acc, curr) => acc + Number(curr.totalCompras), 0);
  });

  porcentajeComprasLocales = computed(() => {
    const total = this.totalGastoTotal();
    if (total === 0) return 0;
    return (this.totalGastoLocal() / total) * 100;
  });

  ngOnInit(): void {
    this.loadReportes();
  }

  loadReportes(): void {
    this.loading.set(true);

    const desdeIso = this.fechaDesde() ? `${this.fechaDesde()}T00:00:00Z` : undefined;
    const hastaIso = this.fechaHasta() ? `${this.fechaHasta()}T23:59:59Z` : undefined;

    this.reporteService.getResumenVentas(desdeIso, hastaIso).subscribe({
      next: (res) => this.resumen.set(res),
      error: (e) => console.error('Error cargando ventas', e),
    });

    this.reporteService.getPlatosPopulares(desdeIso, hastaIso, 10).subscribe({
      next: (res) => this.platosPopulares.set(res),
      error: (e) => console.error('Error cargando platos populares', e),
    });

    this.reporteService.getGastosProveedores(desdeIso, hastaIso).subscribe({
      next: (res) => this.gastosProveedores.set(res),
      error: (e) => console.error('Error cargando proveedores', e),
    });

    this.reporteService.getMargenes().subscribe({
      next: (res) => {
        this.margenes.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private getDefaultStartDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
