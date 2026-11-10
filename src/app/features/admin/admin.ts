import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatoService } from '../../service/plato-service';
import { MesaService } from '../../service/mesa-service';
import { FacturaService } from '../../service/factura-service';
import { CategoriaPlato, Plato } from '../../models/plato';
import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';
import { Modal } from '../../shared/modal/modal';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  private platoService = inject(PlatoService);
  private mesaService = inject(MesaService);
  private facturaService = inject(FacturaService);

  platos = signal<Plato[]>([]);
  categorias = signal<CategoriaPlato[]>([]);
  totalMesas = signal<number>(0);
  totalFacturas = signal<number>(0);
  loading = signal<boolean>(true);

  // Modal Crear Plato
  modalOpen = signal<boolean>(false);
  nombrePlato = signal<string>('');
  descripcionPlato = signal<string>('');
  precioPlato = signal<number>(0);
  idCategoriaPlato = signal<number>(1);
  aplicaIvaPlato = signal<boolean>(true);
  urlImagenPlato = signal<string>('');
  loadingSubmit = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.platoService.getPlatos(0, 100).subscribe({
      next: (res) => {
        this.platos.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.platoService.getCategorias().subscribe((res: any) => {
      const items = res.content ? res.content : res;
      this.categorias.set(items);
      if (items.length > 0) {
        this.idCategoriaPlato.set(items[0].id);
      }
    });

    this.mesaService.getMesas().subscribe((res) => {
      this.totalMesas.set(res.totalElements);
    });

    this.facturaService.getFacturas().subscribe((res) => {
      this.totalFacturas.set(res.totalElements);
    });
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

  openCrearModal(): void {
    this.nombrePlato.set('');
    this.descripcionPlato.set('');
    this.precioPlato.set(0);
    this.aplicaIvaPlato.set(true);
    this.urlImagenPlato.set('');
    this.modalOpen.set(true);
  }

  onSubmitPlato(): void {
    if (!this.nombrePlato().trim() || this.precioPlato() <= 0) {
      alert('Ingresa un nombre y precio válido');
      return;
    }

    this.loadingSubmit.set(true);
    const nuevoPlato: Partial<Plato> = {
      idCategoria: this.idCategoriaPlato(),
      nombre: this.nombrePlato().trim(),
      descripcion: this.descripcionPlato().trim() || undefined,
      precioUnitario: this.precioPlato(),
      aplicaIva: this.aplicaIvaPlato(),
      disponible: true,
      urlImagen: this.urlImagenPlato().trim() || undefined,
    };

    this.platoService.createPlato(nuevoPlato).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.modalOpen.set(false);
        this.loadData();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar el plato');
      },
    });
  }
}
