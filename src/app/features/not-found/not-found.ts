import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, Button],
  templateUrl: './not-found.html',
})
export class NotFound {}
