import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Button],
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTab = signal<'cliente' | 'staff'>('cliente');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Form Staff
  staffEmail = signal<string>('');
  staffPassword = signal<string>('');

  // Form Cliente
  clienteLogin = signal<string>('');
  clientePassword = signal<string>('');

  setTab(tab: 'cliente' | 'staff') {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  onStaffLogin() {
    this.errorMessage.set(null);
    if (!this.staffEmail().trim() || !this.staffPassword()) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    this.loading.set(true);
    this.authService
      .login({
        email: this.staffEmail().trim(),
        password: this.staffPassword(),
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.redirectByRole(res.rol);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Credenciales inválidas de personal. Verifica tus datos.'
          );
        },
      });
  }

  onClienteLogin() {
    this.errorMessage.set(null);
    if (!this.clienteLogin().trim() || !this.clientePassword()) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    this.loading.set(true);
    this.authService
      .loginCliente({
        login: this.clienteLogin().trim(),
        password: this.clientePassword(),
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.redirectByRole(res.rol);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Credenciales inválidas. Verifica tu correo o cédula y contraseña.'
          );
        },
      });
  }

  private redirectByRole(rol: string) {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    if (rol === 'COCINA') {
      this.router.navigate(['/cocina']);
    } else if (rol === 'MESERO') {
      this.router.navigate(['/mesas']);
    } else if (rol === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/cliente/pedidos']);
    }
  }
}
