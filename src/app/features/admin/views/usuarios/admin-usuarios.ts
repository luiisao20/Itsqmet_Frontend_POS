import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../../service/usuario-service';
import { Usuario } from '../../../../models/usuario';
import { RolUsuario } from '../../../../models/auth';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-usuarios.html',
})
export class AdminUsuarios implements OnInit {
  private usuarioService = inject(UsuarioService);

  usuarios = signal<Usuario[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  usuarioModalOpen = signal<boolean>(false);
  editUsuarioUuid = signal<string | null>(null);
  usuarioForm = signal<{
    nombre: string;
    apellido: string;
    cedula: string;
    email: string;
    password: string;
    rol: RolUsuario;
    activo: boolean;
  }>({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    password: '',
    rol: 'MESERO',
    activo: true,
  });

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading.set(true);
    this.usuarioService.getUsuarios(0, 100).subscribe({
      next: (res) => {
        this.usuarios.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCrearUsuario(): void {
    this.editUsuarioUuid.set(null);
    this.usuarioForm.set({
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      password: '',
      rol: 'MESERO',
      activo: true,
    });
    this.usuarioModalOpen.set(true);
  }

  openEditarUsuario(u: Usuario): void {
    this.editUsuarioUuid.set(u.uuid);
    this.usuarioForm.set({
      nombre: u.nombre,
      apellido: u.apellido,
      cedula: u.cedula,
      email: u.email,
      password: '',
      rol: u.rol,
      activo: u.activo,
    });
    this.usuarioModalOpen.set(true);
  }

  onSubmitUsuario(): void {
    const f = this.usuarioForm();
    if (!f.nombre.trim() || !f.apellido.trim() || !f.email.trim() || !f.cedula.trim()) {
      alert('Completa los campos obligatorios del usuario');
      return;
    }
    if (!this.editUsuarioUuid() && (!f.password || f.password.length < 4)) {
      alert('La contraseña temporal debe tener al menos 4 caracteres');
      return;
    }

    this.loadingSubmit.set(true);
    const req: any = {
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      cedula: f.cedula.trim(),
      email: f.email.trim(),
      rol: f.rol,
      activo: f.activo,
    };
    if (f.password && f.password.trim()) {
      req.password = f.password.trim();
    }

    const action$ = this.editUsuarioUuid()
      ? this.usuarioService.updateUsuario(this.editUsuarioUuid()!, req)
      : this.usuarioService.createUsuario(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.usuarioModalOpen.set(false);
        this.loadUsuarios();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar personal');
      },
    });
  }

  toggleActivoUsuario(u: Usuario): void {
    const nuevoEstado = !u.activo;
    this.usuarioService.updateUsuario(u.uuid, { activo: nuevoEstado }).subscribe({
      next: () => (u.activo = nuevoEstado),
      error: (e) => alert(e.error?.message || 'Error al cambiar estado'),
    });
  }

  deleteUsuario(u: Usuario): void {
    if (!confirm(`¿Eliminar al empleado ${u.nombre} ${u.apellido}?`)) return;
    this.usuarioService.deleteUsuario(u.uuid).subscribe({
      next: () => this.loadUsuarios(),
      error: (e) => alert(e.error?.message || 'Error al eliminar usuario'),
    });
  }
}
