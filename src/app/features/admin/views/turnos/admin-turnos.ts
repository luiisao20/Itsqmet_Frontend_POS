import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnoService } from '../../../../service/turno-service';
import { UsuarioService } from '../../../../service/usuario-service';
import { Turno } from '../../../../models/turno';
import { Usuario } from '../../../../models/usuario';

@Component({
  selector: 'app-admin-turnos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-turnos.html',
})
export class AdminTurnos implements OnInit {
  private turnoService = inject(TurnoService);
  private usuarioService = inject(UsuarioService);

  turnos = signal<Turno[]>([]);
  usuarios = signal<Usuario[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadTurnos();
  }

  loadUsuarios(): void {
    this.usuarioService.getUsuarios(0, 100).subscribe({
      next: (res) => this.usuarios.set(res.content),
      error: () => {},
    });
  }

  loadTurnos(): void {
    this.loading.set(true);
    this.turnoService.getAll(0, 100).subscribe({
      next: (res) => {
        this.turnos.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  iniciarTurnoEmpleado(u: Usuario): void {
    if (!confirm(`¿Iniciar turno laboral para ${u.nombre} ${u.apellido}?`)) return;
    this.turnoService
      .iniciarTurno({
        idUsuario: u.uuid,
        observaciones: 'Fichaje desde panel administrativo',
      })
      .subscribe({
        next: () => {
          alert(`Turno iniciado para ${u.nombre} ${u.apellido}`);
          this.loadTurnos();
        },
        error: (e) => alert(e.error?.message || 'Error al iniciar turno'),
      });
  }

  cerrarTurnoEmpleado(u: Usuario): void {
    if (!confirm(`¿Finalizar turno de ${u.nombre} ${u.apellido}?`)) return;
    this.turnoService
      .cerrarTurno({
        idUsuario: u.uuid,
        observaciones: 'Cierre registrado por administración',
      })
      .subscribe({
        next: (t) => {
          alert(
            `Turno cerrado para ${u.nombre}. Total registrado: ${t.totalHoras || 0} horas`,
          );
          this.loadTurnos();
        },
        error: (e) => alert(e.error?.message || 'Error al cerrar turno'),
      });
  }
}
