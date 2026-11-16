import { Component, inject } from '@angular/core';
import { ToastService } from '../../service/toast-service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast.html',
})
export class ToastContainer {
  toastService = inject(ToastService);
}
