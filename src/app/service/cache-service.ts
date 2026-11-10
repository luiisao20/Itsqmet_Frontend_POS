import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Obtiene un valor en caché si no ha expirado.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda un valor en caché con tiempo de vida (TTL).
   */
  set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data, expiry });
  }

  /**
   * Verifica si una clave está en caché y sigue vigente.
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Elimina una clave específica o limpia todo el caché.
   * Si se pasa un prefijo (ej: '/platos'), elimina todas las claves que coincidan.
   */
  clear(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}
