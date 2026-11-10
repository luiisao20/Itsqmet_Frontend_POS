import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plato } from '../../models/plato';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';

@Component({
  selector: 'app-plato-card',
  standalone: true,
  imports: [CommonModule, Badge, Button],
  templateUrl: './plato-card.html',
})
export class PlatoCard {
  plato = input.required<Plato>();
  addToCart = output<Plato>();
}
