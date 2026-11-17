import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
}

/**
 * Non-blocking toast messages rendered by the app-level ToastContainer.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  static readonly DEFAULT_DURATION_MS = 5000;

  private readonly items = signal<Toast[]>([]);
  readonly toasts = this.items.asReadonly();
  private nextId = 1;

  show(message: string, durationMs = ToastService.DEFAULT_DURATION_MS): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}
