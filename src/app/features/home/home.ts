import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlatoService } from '../../service/plato-service';
import { AuthService } from '../../service/auth-service';
import { CategoriaPlato, Plato } from '../../models/plato';
import { PlatoCard } from '../../shared/plato-card/plato-card';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, PlatoCard, Button],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private platoService = inject(PlatoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  categorias = signal<CategoriaPlato[]>([]);
  platos = signal<Plato[]>([]);
  loading = signal<boolean>(true);
  selectedCategoriaId = signal<number | null>(null);
  searchTerm = signal<string>('');

  ngOnInit(): void {
    this.loadCategorias();
    this.loadPlatos();
  }

  loadCategorias(): void {
    this.platoService.getCategorias().subscribe({
      next: (res: any) => {
        const items = res.content ? res.content : res;
        this.categorias.set(items);
      },
      error: (e) => console.error('Error cargando categorías', e),
    });
  }

  loadPlatos(): void {
    this.loading.set(true);
    if (this.selectedCategoriaId()) {
      this.platoService.getPlatosByCategoria(this.selectedCategoriaId()!).subscribe({
        next: (res) => {
          this.platos.set(res.content);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.platoService.getPlatos().subscribe({
        next: (res) => {
          this.platos.set(res.content);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  filterByCategoria(id: number | null): void {
    this.selectedCategoriaId.set(id);
    this.searchTerm.set('');
    this.loadPlatos();
  }

  onSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) {
      this.loadPlatos();
      return;
    }

    this.loading.set(true);
    this.platoService.searchPlatos(term, this.selectedCategoriaId() || undefined).subscribe({
      next: (res) => {
        this.platos.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onAddToCart(plato: Plato): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cliente/pedidos' } });
    } else if (this.authService.currentRol() === 'CLIENTE') {
      this.router.navigate(['/cliente/pedidos']);
    } else if (this.authService.currentRol() === 'MESERO' || this.authService.currentRol() === 'ADMIN') {
      this.router.navigate(['/mesas']);
    }
  }

  goToOrder(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else if (this.authService.currentRol() === 'CLIENTE') {
      this.router.navigate(['/cliente/pedidos']);
    } else {
      this.router.navigate(['/mesas']);
    }
  }
}
