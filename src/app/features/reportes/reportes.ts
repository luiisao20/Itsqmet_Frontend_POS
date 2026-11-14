import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../service/reporte-service';
import { PaqueteSorpresaService } from '../../service/paquete-sorpresa.service';
import { GastosProveedor, MargenPlato, PlatoPopular, VentaResumen } from '../../models/reporte';
import { PaqueteSorpresa } from '../../models/paquete-sorpresa';
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
  private paqueteService = inject(PaqueteSorpresaService);

  fechaDesde = signal<string>(this.getDefaultStartDate());
  fechaHasta = signal<string>(this.getDefaultEndDate());

  loading = signal<boolean>(false);
  resumen = signal<VentaResumen | null>(null);
  platosPopulares = signal<PlatoPopular[]>([]);
  gastosProveedores = signal<GastosProveedor[]>([]);
  margenes = signal<MargenPlato[]>([]);
  paquetes = signal<PaqueteSorpresa[]>([]);

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

  // Cálculos ODS 12: Rescate de Comida y Reducción de Desperdicio
  totalPacksRescatados = computed(() => {
    return this.paquetes().reduce((acc, p) => acc + (p.unidadesVendidas || 0), 0);
  });

  comidaSalvadaKg = computed(() => {
    return this.totalPacksRescatados() * 0.9;
  });

  co2EvitadoKg = computed(() => {
    return this.totalPacksRescatados() * 2.5;
  });

  dineroRecuperado = computed(() => {
    return this.paquetes().reduce(
      (acc, p) => acc + (p.unidadesVendidas || 0) * p.precioRescate,
      0
    );
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

    this.paqueteService.getGestion().subscribe({
      next: (res) => this.paquetes.set(res),
      error: () => {},
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
