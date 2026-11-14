import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PlatoService } from '../../service/plato-service';
import { MesaService } from '../../service/mesa-service';
import { UsuarioService } from '../../service/usuario-service';
import { InsumoService } from '../../service/insumo-service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  private platoService = inject(PlatoService);
  private mesaService = inject(MesaService);
  private usuarioService = inject(UsuarioService);
  private insumoService = inject(InsumoService);

  platosCount = signal<number>(0);
  mesasCount = signal<number>(0);
  usuariosCount = signal<number>(0);
  insumosCount = signal<number>(0);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.platoService.getPlatos(0, 1).subscribe({
      next: (res) => this.platosCount.set(res.totalElements),
      error: () => {},
    });
    this.mesaService.getMesas(0, 1).subscribe({
      next: (res) => this.mesasCount.set(res.totalElements),
      error: () => {},
    });
    this.usuarioService.getUsuarios(0, 1).subscribe({
      next: (res) => this.usuariosCount.set(res.totalElements),
      error: () => {},
    });
    this.insumoService.getInsumos(0, 1).subscribe({
      next: (res) => this.insumosCount.set(res.totalElements),
      error: () => {},
    });
  }
}
