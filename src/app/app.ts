import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { ToastContainer } from './shared/toast/toast';
import { OrderNotificationService } from './service/order-notification-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Eagerly starts the app-wide new-order alerts for staff.
  private readonly orderNotifications = inject(OrderNotificationService);
}
