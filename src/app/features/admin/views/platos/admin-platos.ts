import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatoService } from '../../../../service/plato-service';
import { CategoriaPlato, Plato } from '../../../../models/plato';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-platos',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-platos.html',
})
export class AdminPlatos implements OnInit {
  private platoService = inject(PlatoService);

  platos = signal<Plato[]>([]);
  categorias = signal<CategoriaPlato[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  platoModalOpen = signal<boolean>(false);
  editPlatoId = signal<number | null>(null);
  platoForm = signal({
    nombre: '',
    descripcion: '',
    precioUnitario: 0,
    idCategoria: 1,
    aplicaIva: true,
    disponible: true,
    urlImagen: '',
  });

  ngOnInit(): void {
    this.loadCategorias();
    this.loadPlatos();
  }

  loadCategorias(): void {
    this.platoService.getCategorias().subscribe({
      next: (res: any) => {
        const items = res.content ? res.content : Array.isArray(res) ? res : [];
        this.categorias.set(items);
      },
      error: () => {},
    });
  }

  loadPlatos(): void {
    this.loading.set(true);
    this.platoService.getPlatos(0, 100).subscribe({
      next: (res) => {
        this.platos.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCrearPlato(): void {
    this.editPlatoId.set(null);
    const catId = this.categorias().length > 0 ? this.categorias()[0].id : 1;
    this.platoForm.set({
      nombre: '',
      descripcion: '',
      precioUnitario: 0,
      idCategoria: catId,
      aplicaIva: true,
      disponible: true,
      urlImagen: '',
    });
    this.platoModalOpen.set(true);
  }

  openEditarPlato(p: Plato): void {
    this.editPlatoId.set(p.id);
    this.platoForm.set({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precioUnitario: p.precioUnitario,
      idCategoria: p.idCategoria,
      aplicaIva: p.aplicaIva,
      disponible: p.disponible,
      urlImagen: p.urlImagen || '',
    });
    this.platoModalOpen.set(true);
  }

  toggleDisponibilidad(plato: Plato): void {
    const updated = !plato.disponible;
    this.platoService.updatePlato(plato.id, { disponible: updated }).subscribe({
      next: () => {
        plato.disponible = updated;
      },
      error: (e) => alert(e.error?.message || 'Error al actualizar disponibilidad'),
    });
  }

  onSubmitPlato(): void {
    const f = this.platoForm();
    if (!f.nombre.trim() || f.precioUnitario <= 0) {
      alert('Ingresa un nombre y precio válido');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      idCategoria: Number(f.idCategoria),
      nombre: f.nombre.trim(),
      descripcion: f.descripcion.trim() || undefined,
      precioUnitario: Number(f.precioUnitario),
      aplicaIva: f.aplicaIva,
      disponible: f.disponible,
      urlImagen: f.urlImagen.trim() || undefined,
    };

    const action$ = this.editPlatoId()
      ? this.platoService.updatePlato(this.editPlatoId()!, req)
      : this.platoService.createPlato(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.platoModalOpen.set(false);
        this.loadPlatos();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al procesar el plato');
      },
    });
  }

  deletePlato(p: Plato): void {
    if (!confirm(`¿Eliminar el plato "${p.nombre}"?`)) return;
    this.platoService.deletePlato(p.id).subscribe({
      next: () => this.loadPlatos(),
      error: (e) => alert(e.error?.message || 'Error al eliminar plato'),
    });
  }
}
