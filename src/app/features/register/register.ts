import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { TipoIdentificacion } from '../../models/auth';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Button],
  templateUrl: './register.html',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  tipoIdentificacion = signal<TipoIdentificacion>('CEDULA');
  identificacion = signal<string>('');
  razonSocial = signal<string>('');
  direccion = signal<string>('');
  telefono = signal<string>('');
  email = signal<string>('');
  password = signal<string>('');

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onRegister() {
    this.errorMessage.set(null);

    if (
      !this.identificacion().trim() ||
      !this.razonSocial().trim() ||
      !this.email().trim() ||
      !this.password()
    ) {
      this.errorMessage.set('Por favor completa todos los campos requeridos');
      return;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.loading.set(true);
    this.authService
      .registerCliente({
        tipoIdentificacion: this.tipoIdentificacion(),
        identificacion: this.identificacion().trim(),
        razonSocial: this.razonSocial().trim(),
        direccion: this.direccion().trim() || undefined,
        telefono: this.telefono().trim() || undefined,
        email: this.email().trim().toLowerCase(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/cliente/pedidos']);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Error al registrar la cuenta. Verifica que la cédula y correo no estén registrados.'
          );
        },
      });
  }
}
