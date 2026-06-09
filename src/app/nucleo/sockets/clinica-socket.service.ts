import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { enviroment } from '../../enviroment/enviroment';

export interface ClinicaSocketMessage<T = any> {
  event: string;
  data: T;
}

/**
 * Servicio WebSocket dedicado al microservicio Clínica (ws://localhost:3000).
 * Maneja eventos de sesiones en tiempo real: asignación, inicio, cierre.
 * Reconecta automáticamente cada 5 segundos si se pierde la conexión.
 */
@Injectable({ providedIn: 'root' })
export class ClinicaSocketService {
  private socket$!: WebSocketSubject<any>;
  private messages$ = new Subject<ClinicaSocketMessage>();
  private isConnected = false;
  private readonly reconnectInterval = 5000;

  constructor() {
    this.connect();
  }

  private connect(): void {
    const url = enviroment.socketUrlClinica;
    const token = localStorage.getItem('token');
    const socketUrl = token ? `${url}?token=${token}` : url;

    this.socket$ = webSocket({
      url: socketUrl,
      openObserver: {
        next: () => {
          this.isConnected = true;
        },
      },
      closeObserver: {
        next: () => {
          this.isConnected = false;
          this.reconnect();
        },
      },
    });

    this.socket$.subscribe({
      next: (message: ClinicaSocketMessage) => {
        if (message?.event) this.messages$.next(message);
      },
      error: () => {
        this.isConnected = false;
        this.reconnect();
      },
    });
  }

  private reconnect(): void {
    timer(this.reconnectInterval).subscribe(() => {
      if (!this.isConnected) this.connect();
    });
  }

  /** Escucha un evento específico del MS Clínica */
  listen<T = any>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      const sub = this.messages$.subscribe((msg) => {
        if (msg.event === event) observer.next(msg.data as T);
      });
      return () => sub.unsubscribe();
    });
  }

  /** Envía un mensaje al servidor WebSocket */
  emit<T = any>(event: string, data: T): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.next({ event, data });
    }
  }
}
