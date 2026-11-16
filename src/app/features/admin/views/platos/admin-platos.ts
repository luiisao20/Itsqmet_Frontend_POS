import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatoService } from '../../../../service/plato-service';
import { RecetaService } from '../../../../service/receta-service';
import { InsumoService } from '../../../../service/insumo-service';
import { CategoriaPlato, Plato } from '../../../../models/plato';
import { Receta } from '../../../../models/receta';
import { Insumo } from '../../../../models/insumo';
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
  private recetaService = inject(RecetaService);
  private insumoService = inject(InsumoService);

  platos = signal<Plato[]>([]);
  categorias = signal<CategoriaPlato[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  // Modal Plato (CRUD básico)
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

  // Modal Receta / Ficha Técnica (ODS 8.4)
  recetaModalOpen = signal<boolean>(false);
  selectedPlato = signal<Plato | null>(null);
  recetasActuales = signal<Receta[]>([]);
  insumosDisponibles = signal<Insumo[]>([]);
  loadingRecetas = signal<boolean>(false);
  loadingAgregarInsumo = signal<boolean>(false);

  recetaForm = signal({
    idInsumo: 0,
    cantidadRequerida: 0.1,
  });

  // Mapa reactivo de insumos por ID para cálculo rápido de costos
  insumoMap = computed(() => {
    const map = new Map<number, Insumo>();
    for (const i of this.insumosDisponibles()) {
      map.set(i.id, i);
    }
    return map;
  });

  // Costo total de los insumos según la receta actual
  costoTotalReceta = computed(() => {
    const map = this.insumoMap();
    return this.recetasActuales().reduce((sum, r) => {
      const insumo = map.get(r.idInsumo);
      const costoUnitario = insumo ? insumo.costoPromedio : 0;
      return sum + r.cantidadRequerida * costoUnitario;
    }, 0);
  });

  // Margen bruto en dólares ($)
  margenBruto = computed(() => {
    const p = this.selectedPlato();
    if (!p) return 0;
    return p.precioUnitario - this.costoTotalReceta();
  });

  // Rentabilidad (%)
  porcentajeMargen = computed(() => {
    const p = this.selectedPlato();
    if (!p || p.precioUnitario <= 0) return 0;
    return (this.margenBruto() / p.precioUnitario) * 100;
  });

  ngOnInit(): void {
    this.loadCategorias();
    this.loadPlatos();
    this.loadInsumos();
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

  loadInsumos(): void {
    this.insumoService.getInsumos(0, 100).subscribe({
      next: (res) => {
        this.insumosDisponibles.set(res.content);
        if (res.content.length > 0 && this.recetaForm().idInsumo === 0) {
          this.recetaForm.update((f) => ({ ...f, idInsumo: res.content[0].id }));
        }
      },
      error: () => {},
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

  // ==========================================
  // GESTIÓN DE RECETAS (FICHA TÉCNICA)
  // ==========================================

  abrirRecetaModal(p: Plato): void {
    this.selectedPlato.set(p);
    this.recetaModalOpen.set(true);
    if (this.insumosDisponibles().length === 0) {
      this.loadInsumos();
    }
    this.loadRecetasDelPlato(p.id);
  }

  loadRecetasDelPlato(idPlato: number): void {
    this.loadingRecetas.set(true);
    this.recetaService.getByPlato(idPlato).subscribe({
      next: (res) => {
        this.recetasActuales.set(res.content);
        this.loadingRecetas.set(false);
      },
      error: () => this.loadingRecetas.set(false),
    });
  }

  agregarInsumoAReceta(): void {
    const p = this.selectedPlato();
    const f = this.recetaForm();
    if (!p) return;

    if (!f.idInsumo || f.cantidadRequerida <= 0) {
      alert('Selecciona un insumo y una cantidad válida mayor a 0');
      return;
    }

    this.loadingAgregarInsumo.set(true);
    this.recetaService
      .create({
        idPlato: p.id,
        idInsumo: Number(f.idInsumo),
        cantidadRequerida: Number(f.cantidadRequerida),
      })
      .subscribe({
        next: () => {
          this.loadingAgregarInsumo.set(false);
          this.recetaForm.update((cur) => ({ ...cur, cantidadRequerida: 0.1 }));
          this.loadRecetasDelPlato(p.id);
        },
        error: (err) => {
          this.loadingAgregarInsumo.set(false);
          alert(err.error?.message || 'Error al agregar insumo a la receta');
        },
      });
  }

  eliminarInsumoDeReceta(r: Receta): void {
    const insumo = this.insumoMap().get(r.idInsumo);
    const nombre = insumo ? insumo.nombre : r.nombreInsumo || 'este insumo';
    if (!confirm(`¿Retirar "${nombre}" de la receta?`)) return;

    this.recetaService.delete(r.id).subscribe({
      next: () => {
        if (this.selectedPlato()) {
          this.loadRecetasDelPlato(this.selectedPlato()!.id);
        }
      },
      error: (e) => alert(e.error?.message || 'Error al eliminar ingrediente'),
    });
  }

  getInsumoInfo(idInsumo: number): Insumo | undefined {
    return this.insumoMap().get(idInsumo);
  }
}
