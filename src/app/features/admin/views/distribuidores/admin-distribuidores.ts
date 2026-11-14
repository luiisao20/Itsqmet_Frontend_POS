import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DistribuidorService } from '../../../../service/distribuidor-service';
import { Distribuidor } from '../../../../models/distribuidor';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-distribuidores',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-distribuidores.html',
})
export class AdminDistribuidores implements OnInit {
  private distribuidorService = inject(DistribuidorService);

  distribuidores = signal<Distribuidor[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  distribuidorModalOpen = signal<boolean>(false);
  editDistribuidorId = signal<number | null>(null);
  distribuidorForm = signal({
    ruc: '',
    razonSocial: '',
    nombreContacto: '',
    telefono: '',
    email: '',
    direccion: '',
    categoriaProveedor: 'Alimentos',
    esProveedorLocal: false,
  });

  ngOnInit(): void {
    this.loadDistribuidores();
  }

  loadDistribuidores(): void {
    this.loading.set(true);
    this.distribuidorService.getDistribuidores(0, 100).subscribe({
      next: (res) => {
        this.distribuidores.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCrearDistribuidor(): void {
    this.editDistribuidorId.set(null);
    this.distribuidorForm.set({
      ruc: '',
      razonSocial: '',
      nombreContacto: '',
      telefono: '',
      email: '',
      direccion: '',
      categoriaProveedor: 'Alimentos',
      esProveedorLocal: false,
    });
    this.distribuidorModalOpen.set(true);
  }

  openEditarDistribuidor(d: Distribuidor): void {
    this.editDistribuidorId.set(d.id);
    this.distribuidorForm.set({
      ruc: d.ruc,
      razonSocial: d.razonSocial,
      nombreContacto: d.nombreContacto || '',
      telefono: d.telefono || '',
      email: d.email || '',
      direccion: d.direccion || '',
      categoriaProveedor: d.categoriaProveedor || 'General',
      esProveedorLocal: d.esProveedorLocal ?? false,
    });
    this.distribuidorModalOpen.set(true);
  }

  onSubmitDistribuidor(): void {
    const f = this.distribuidorForm();
    if (!f.ruc.trim() || !f.razonSocial.trim()) {
      alert('RUC y Razón Social son obligatorios');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      ruc: f.ruc.trim(),
      razonSocial: f.razonSocial.trim(),
      nombreContacto: f.nombreContacto.trim() || undefined,
      telefono: f.telefono.trim() || undefined,
      email: f.email.trim() || undefined,
      direccion: f.direccion.trim() || undefined,
      categoriaProveedor: f.categoriaProveedor.trim() || undefined,
      esProveedorLocal: f.esProveedorLocal,
    };

    const action$ = this.editDistribuidorId()
      ? this.distribuidorService.updateDistribuidor(this.editDistribuidorId()!, req)
      : this.distribuidorService.createDistribuidor(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.distribuidorModalOpen.set(false);
        this.loadDistribuidores();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar distribuidor');
      },
    });
  }

  deleteDistribuidor(d: Distribuidor): void {
    if (!confirm(`¿Eliminar al proveedor "${d.razonSocial}"?`)) return;
    this.distribuidorService.deleteDistribuidor(d.id).subscribe({
      next: () => this.loadDistribuidores(),
      error: (e) => alert(e.error?.message || 'Error al eliminar distribuidor'),
    });
  }
}
