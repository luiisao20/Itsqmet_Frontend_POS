import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of, lastValueFrom } from 'rxjs';
import { APP_CONFIG } from '../configs/config';
import { AuthResponse, ClienteLoginRequest, ClienteRegisterRequest, LoginRequest, RolUsuario } from '../models/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly AUTH_URL = `${APP_CONFIG.API_URL}${APP_CONFIG.ENDPOINTS.AUTH}`;

  isAuthenticated = signal<boolean>(false);
  currentRol = signal<RolUsuario | null>(null);
  currentUser = signal<AuthResponse | null>(null);

  private pendingAuthCheck: Promise<boolean> | null = null;

  /**
   * Indica si hay una sesión activa guardada localmente
   */
  hasSessionHint(): boolean {
    return localStorage.getItem('pos_logged_in') === 'true';
  }

  /**
   * Role saved by the last session, or null when there is no session hint.
   * Never throws: blocked or missing storage counts as "no session hint".
   */
  sessionHintRol(): RolUsuario | null {
    try {
      if (localStorage.getItem('pos_logged_in') !== 'true') {
        return null;
      }
      return localStorage.getItem('pos_user_rol') as RolUsuario | null;
    } catch {
      return null;
    }
  }

  /**
   * Inicio de sesión para Personal (Admin, Mesero, Cocina)
   */
  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/login`, req).pipe(
      tap((res) => {
        this.setUserState(res);
      })
    );
  }

  /**
   * Inicio de sesión para Clientes (email o identificación)
   */
  loginCliente(req: ClienteLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/cliente/login`, req).pipe(
      tap((res) => {
        this.setUserState(res);
      })
    );
  }

  /**
   * Registro de un nuevo Cliente
   */
  registerCliente(req: ClienteRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_URL}/cliente/registro`, req).pipe(
      tap((res) => {
        this.setUserState(res);
      })
    );
  }

  /**
   * Cierre de sesión (elimina la cookie HttpOnly en el backend y limpia signals)
   */
  logout(): Observable<any> {
    return this.http.post(`${this.AUTH_URL}/logout`, {}).pipe(
      tap(() => this.clearUserState()),
      catchError(() => {
        this.clearUserState();
        return of(null);
      })
    );
  }

  /**
   * Valida la sesión activa en cookies mediante /auth/me
   */
  async checkAuthStatus(): Promise<boolean> {
    if (this.isAuthenticated() && this.currentUser()) {
      return true;
    }

    // Si no hay indicio de sesión previa en localStorage, retornar false de inmediato sin peticiones
    if (!this.hasSessionHint()) {
      this.clearUserState();
      return false;
    }

    // Si ya hay una verificación en curso, compartir la misma promesa
    if (this.pendingAuthCheck) {
      return this.pendingAuthCheck;
    }

    this.pendingAuthCheck = (async () => {
      try {
        const user = await lastValueFrom(
          this.http.get<AuthResponse>(`${this.AUTH_URL}/me`)
        );

        if (user && user.uuid) {
          this.setUserState(user);
          return true;
        }
        this.clearUserState();
        return false;
      } catch {
        this.clearUserState();
        return false;
      } finally {
        this.pendingAuthCheck = null;
      }
    })();

    return this.pendingAuthCheck;
  }

  private setUserState(user: AuthResponse) {
    this.isAuthenticated.set(true);
    this.currentRol.set(user.rol);
    this.currentUser.set(user);
    localStorage.setItem('pos_logged_in', 'true');
    localStorage.setItem('pos_user_rol', user.rol);
    localStorage.setItem('pos_user_name', `${user.nombre} ${user.apellido || ''}`.trim());
  }

  private clearUserState() {
    this.isAuthenticated.set(false);
    this.currentRol.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('pos_logged_in');
    localStorage.removeItem('pos_user_rol');
    localStorage.removeItem('pos_user_name');
  }
}
