import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsumoService } from '../../../../service/insumo-service';
import { Insumo, UnidadMedida } from '../../../../models/insumo';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-insumos.html',
})
export class AdminInsumos implements OnInit {
  private insumoService = inject(InsumoService);

  insumos = signal<Insumo[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  insumoModalOpen = signal<boolean>(false);
  editInsumoId = signal<number | null>(null);
  insumoForm = signal<{
    nombre: string;
    unidadMedida: UnidadMedida;
    stockActual: number;
    stockMinimo: number;
    costoPromedio: number;
  }>({
    nombre: '',
    unidadMedida: 'UNIDAD',
    stockActual: 10,
    stockMinimo: 5,
    costoPromedio: 1.0,
  });

  ngOnInit(): void {
    this.loadInsumos();
  }

  loadInsumos(): void {
    this.loading.set(true);
    this.insumoService.getInsumos(0, 100).subscribe({
      next: (res) => {
        this.insumos.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCrearInsumo(): void {
    this.editInsumoId.set(null);
    this.insumoForm.set({
      nombre: '',
      unidadMedida: 'UNIDAD',
      stockActual: 10,
      stockMinimo: 5,
      costoPromedio: 1.0,
    });
    this.insumoModalOpen.set(true);
  }

  openEditarInsumo(i: Insumo): void {
    this.editInsumoId.set(i.id);
    this.insumoForm.set({
      nombre: i.nombre,
      unidadMedida: i.unidadMedida,
      stockActual: i.stockActual,
      stockMinimo: i.stockMinimo,
      costoPromedio: i.costoPromedio,
    });
    this.insumoModalOpen.set(true);
  }

  onSubmitInsumo(): void {
    const f = this.insumoForm();
    if (!f.nombre.trim() || f.stockActual < 0 || f.stockMinimo < 0) {
      alert('Ingresa un nombre y cantidades válidas');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      nombre: f.nombre.trim(),
      unidadMedida: f.unidadMedida,
      stockActual: Number(f.stockActual),
      stockMinimo: Number(f.stockMinimo),
      costoPromedio: Number(f.costoPromedio),
    };

    const action$ = this.editInsumoId()
      ? this.insumoService.updateInsumo(this.editInsumoId()!, req)
      : this.insumoService.createInsumo(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.insumoModalOpen.set(false);
        this.loadInsumos();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar insumo');
      },
    });
  }

  deleteInsumo(i: Insumo): void {
    if (!confirm(`¿Eliminar el insumo "${i.nombre}"?`)) return;
    this.insumoService.deleteInsumo(i.id).subscribe({
      next: () => this.loadInsumos(),
      error: (e) => alert(e.error?.message || 'Error al eliminar insumo'),
    });
  }
}
