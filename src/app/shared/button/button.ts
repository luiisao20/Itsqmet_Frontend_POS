import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
})
export class Button {
  variant = input<'primary' | 'secondary' | 'outline' | 'danger'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  btnClick = output<MouseEvent>();

  get variantClasses(): string {
    switch (this.variant()) {
      case 'primary':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500';
      case 'secondary':
        return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 focus-visible:ring-emerald-400';
      case 'outline':
        return 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus-visible:ring-emerald-500';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500';
    }
  }

  get sizeClasses(): string {
    switch (this.size()) {
      case 'sm':
        return 'px-2.5 py-1.5 text-xs';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-5 py-2.5 text-base';
    }
  }
}
