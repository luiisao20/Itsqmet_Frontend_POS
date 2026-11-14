import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PaqueteSorpresaService } from '../../../../service/paquete-sorpresa.service';
import {
  EstadoPaqueteSorpresa,
  PaqueteSorpresa,
  PaqueteSorpresaRequest,
} from '../../../../models/paquete-sorpresa';
import { Badge } from '../../../../shared/badge/badge';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Modal],
  templateUrl: './admin-paquetes.html',
})
export class AdminPaquetes implements OnInit, OnDestroy {
  private paqueteService = inject(PaqueteSorpresaService);

  paquetes = signal<PaqueteSorpresa[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  paqueteModalOpen = signal<boolean>(false);
  editPaqueteId = signal<number | null>(null);
  filtroFechaPaquetes = signal<string>(new Date().toISOString().split('T')[0]);

  paqueteForm = signal<PaqueteSorpresaRequest>({
    titulo: '',
    descripcion: '',
    precioEstimadoOriginal: 9.5,
    precioRescate: 3.5,
    cantidadTotal: 5,
    fechaDisponible: new Date().toISOString().split('T')[0],
    horaInicioVisibilidad: '20:00:00',
    horaFinRecogida: '21:30:00',
    urlImagen: '',
    estado: 'ACTIVO',
  });

  private wsPaquetesSub?: Subscription;

  ngOnInit(): void {
    this.loadPaquetes();

    // Escuchar actualizaciones de paquetes sorpresa por WebSocket
    this.wsPaquetesSub = this.paqueteService.listenPaquetes().subscribe({
      next: (pack) => {
        this.paquetes.update((list) => {
          const idx = list.findIndex((p) => p.id === pack.id);
          if (idx > -1) {
            const copy = [...list];
            copy[idx] = pack;
            return copy;
          }
          return [pack, ...list];
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.wsPaquetesSub?.unsubscribe();
  }

  loadPaquetes(): void {
    this.loading.set(true);
    this.paqueteService.getGestion(this.filtroFechaPaquetes() || undefined).subscribe({
      next: (res) => {
        this.paquetes.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openNuevoPaqueteModal(): void {
    this.editPaqueteId.set(null);
    this.paqueteForm.set({
      titulo: '',
      descripcion: '',
      precioEstimadoOriginal: 9.5,
      precioRescate: 3.5,
      cantidadTotal: 5,
      fechaDisponible: new Date().toISOString().split('T')[0],
      horaInicioVisibilidad: '20:00:00',
      horaFinRecogida: '21:30:00',
      urlImagen: '',
      estado: 'ACTIVO',
    });
    this.paqueteModalOpen.set(true);
  }

  openEditPaqueteModal(p: PaqueteSorpresa): void {
    this.editPaqueteId.set(p.id);
    this.paqueteForm.set({
      titulo: p.titulo,
      descripcion: p.descripcion || '',
      precioEstimadoOriginal: p.precioEstimadoOriginal,
      precioRescate: p.precioRescate,
      cantidadTotal: p.cantidadTotal,
      fechaDisponible: p.fechaDisponible,
      horaInicioVisibilidad: p.horaInicioVisibilidad,
      horaFinRecogida: p.horaFinRecogida,
      urlImagen: p.urlImagen || '',
      estado: p.estado,
    });
    this.paqueteModalOpen.set(true);
  }

  onSubmitPaquete(): void {
    const form = this.paqueteForm();
    if (!form.titulo.trim()) {
      alert('El título del paquete es obligatorio');
      return;
    }

    this.loadingSubmit.set(true);
    const id = this.editPaqueteId();

    if (id) {
      this.paqueteService.actualizar(id, form).subscribe({
        next: () => {
          this.loadingSubmit.set(false);
          this.paqueteModalOpen.set(false);
          this.loadPaquetes();
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          alert(err.error?.message || 'Error al actualizar paquete');
        },
      });
    } else {
      this.paqueteService.crear(form).subscribe({
        next: () => {
          this.loadingSubmit.set(false);
          this.paqueteModalOpen.set(false);
          this.loadPaquetes();
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          alert(err.error?.message || 'Error al crear paquete sorpresa');
        },
      });
    }
  }

  cambiarEstadoPaquete(p: PaqueteSorpresa, nuevoEstado: EstadoPaqueteSorpresa): void {
    this.paqueteService.cambiarEstado(p.id, nuevoEstado).subscribe({
      next: () => this.loadPaquetes(),
      error: (e) => alert(e.error?.message || 'Error al cambiar estado'),
    });
  }
}
