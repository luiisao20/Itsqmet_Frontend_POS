import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { APP_CONFIG } from '../configs/config';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private client: Client;
  private isConnected = false;
  private messageSubjects = new Map<string, Subject<any>>();

  constructor() {
    this.client = new Client({
      brokerURL: APP_CONFIG.WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg: string) => {
        // En desarrollo silenciamos o mostramos logs detallados
      },
    });

    this.client.onConnect = () => {
      this.isConnected = true;
      // Re-suscribir a todos los tópicos registrados
      for (const [topic, subject] of this.messageSubjects.entries()) {
        this.subscribeTopic(topic, subject);
      }
    };

    this.client.onDisconnect = () => {
      this.isConnected = false;
    };

    this.client.activate();
  }

  /**
   * Escucha mensajes en tiempo real de un tópico STOMP (ej: /topic/pedidos, /topic/cocina)
   */
  listen<T>(topic: string): Observable<T> {
    if (!this.messageSubjects.has(topic)) {
      const subject = new Subject<T>();
      this.messageSubjects.set(topic, subject);

      if (this.isConnected) {
        this.subscribeTopic(topic, subject);
      }
    }

    return this.messageSubjects.get(topic)!.asObservable();
  }

  private subscribeTopic(topic: string, subject: Subject<any>) {
    this.client.subscribe(topic, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        subject.next(payload);
      } catch (e) {
        subject.next(message.body);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
