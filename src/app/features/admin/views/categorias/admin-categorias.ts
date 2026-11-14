import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatoService } from '../../../../service/plato-service';
import { AreaImpresion, CategoriaPlato } from '../../../../models/plato';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Modal],
  templateUrl: './admin-categorias.html',
})
export class AdminCategorias implements OnInit {
  private platoService = inject(PlatoService);

  categorias = signal<CategoriaPlato[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  categoriaModalOpen = signal<boolean>(false);
  editCategoriaId = signal<number | null>(null);
  categoriaForm = signal<{
    nombre: string;
    areaImpresion: AreaImpresion;
    ordenVisual: number;
  }>({
    nombre: '',
    areaImpresion: 'COCINA',
    ordenVisual: 1,
  });

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading.set(true);
    this.platoService.getCategorias().subscribe({
      next: (res: any) => {
        const items = res.content ? res.content : Array.isArray(res) ? res : [];
        this.categorias.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCrearCategoria(): void {
    this.editCategoriaId.set(null);
    this.categoriaForm.set({
      nombre: '',
      areaImpresion: 'COCINA',
      ordenVisual: this.categorias().length + 1,
    });
    this.categoriaModalOpen.set(true);
  }

  openEditarCategoria(c: CategoriaPlato): void {
    this.editCategoriaId.set(c.id);
    this.categoriaForm.set({
      nombre: c.nombre,
      areaImpresion: c.areaImpresion,
      ordenVisual: c.ordenVisual || 1,
    });
    this.categoriaModalOpen.set(true);
  }

  onSubmitCategoria(): void {
    const f = this.categoriaForm();
    if (!f.nombre.trim()) {
      alert('Ingresa el nombre de la categoría');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      nombre: f.nombre.trim(),
      areaImpresion: f.areaImpresion,
      ordenVisual: Number(f.ordenVisual),
    };

    const action$ = this.editCategoriaId()
      ? this.platoService.updateCategoria(this.editCategoriaId()!, req)
      : this.platoService.createCategoria(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.categoriaModalOpen.set(false);
        this.loadCategorias();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar categoría');
      },
    });
  }

  deleteCategoria(c: CategoriaPlato): void {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    this.platoService.deleteCategoria(c.id).subscribe({
      next: () => this.loadCategorias(),
      error: (e) => alert(e.error?.message || 'Error al eliminar categoría'),
    });
  }
}
