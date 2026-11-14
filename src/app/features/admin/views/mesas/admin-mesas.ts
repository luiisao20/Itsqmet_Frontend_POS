import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MesaService } from '../../../../service/mesa-service';
import { EstadoMesa, Mesa } from '../../../../models/mesa';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-mesas.html',
})
export class AdminMesas implements OnInit {
  private mesaService = inject(MesaService);

  mesas = signal<Mesa[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  mesaModalOpen = signal<boolean>(false);
  editMesaId = signal<number | null>(null);
  mesaForm = signal<{
    numeroMesa: number;
    capacidad: number;
    ubicacion: string;
    estado: EstadoMesa;
  }>({
    numeroMesa: 1,
    capacidad: 4,
    ubicacion: 'Salón Principal',
    estado: 'LIBRE',
  });

  ngOnInit(): void {
    this.loadMesas();
  }

  loadMesas(): void {
    this.loading.set(true);
    this.mesaService.getMesas(0, 100).subscribe({
      next: (res) => {
        this.mesas.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCrearMesa(): void {
    this.editMesaId.set(null);
    const nextNum =
      this.mesas().length > 0
        ? Math.max(...this.mesas().map((m) => m.numeroMesa)) + 1
        : 1;
    this.mesaForm.set({
      numeroMesa: nextNum,
      capacidad: 4,
      ubicacion: 'Salón Principal',
      estado: 'LIBRE',
    });
    this.mesaModalOpen.set(true);
  }

  openEditarMesa(m: Mesa): void {
    this.editMesaId.set(m.id);
    this.mesaForm.set({
      numeroMesa: m.numeroMesa,
      capacidad: m.capacidad,
      ubicacion: m.ubicacion || 'Salón Principal',
      estado: m.estado,
    });
    this.mesaModalOpen.set(true);
  }

  onSubmitMesa(): void {
    const f = this.mesaForm();
    if (f.numeroMesa <= 0 || f.capacidad <= 0) {
      alert('Número de mesa y capacidad deben ser mayores a 0');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      numeroMesa: Number(f.numeroMesa),
      capacidad: Number(f.capacidad),
      ubicacion: f.ubicacion.trim() || undefined,
      estado: f.estado,
    };

    const action$ = this.editMesaId()
      ? this.mesaService.updateMesa(this.editMesaId()!, req)
      : this.mesaService.createMesa(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.mesaModalOpen.set(false);
        this.loadMesas();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar mesa');
      },
    });
  }

  deleteMesa(m: Mesa): void {
    if (!confirm(`¿Eliminar la Mesa #${m.numeroMesa}?`)) return;
    this.mesaService.deleteMesa(m.id).subscribe({
      next: () => this.loadMesas(),
      error: (e) => alert(e.error?.message || 'Error al eliminar mesa'),
    });
  }
}
