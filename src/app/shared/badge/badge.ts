import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.html',
})
export class Badge {
  text = input.required<string>();
  variant = input<'success' | 'warning' | 'danger' | 'info' | 'neutral'>('neutral');

  get classes(): string {
    switch (this.variant()) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'info':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }
}
