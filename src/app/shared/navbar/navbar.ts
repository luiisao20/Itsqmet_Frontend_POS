import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth-service';
import { Badge } from '../badge/badge';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, Badge],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class Navbar {
  private router = inject(Router);
  authService = inject(AuthService);

  dropdownOpen = signal(false);
  mobileMenuOpen = signal(false);

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get rol() {
    return this.authService.currentRol();
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  toggleDropdown() {
    this.dropdownOpen.update((v) => !v);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('#user-menu-button') && !target.closest('#user-dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  logout() {
    this.dropdownOpen.set(false);
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
