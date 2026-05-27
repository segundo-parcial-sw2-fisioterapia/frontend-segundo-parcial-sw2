import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription, timer } from 'rxjs';
import { delayWhen, retryWhen, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { enviroment } from '../../enviroment/enviroment';

export interface SocketMessage<T = any> {
  event: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket$!: WebSocketSubject<any>;
  private messages$ = new Subject<SocketMessage>();
  private reconnectInterval = 5000; // 5 segundos de espera para reconectar
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Inicializa la conexión del WebSocket.
   */
  private connect(): void {
    const url = enviroment.socketUrl;
    
    // Obtener token para enviarlo como parámetro de consulta opcional para autenticación
    const token = localStorage.getItem('token');
    const socketUrl = token ? `${url}?token=${token}` : url;

    this.socket$ = webSocket({
      url: socketUrl,
      openObserver: {
        next: () => {
          console.log('Conexión WebSocket establecida con éxito.');
          this.isConnected = true;
        }
      },
      closeObserver: {
        next: () => {
          console.warn('Conexión WebSocket cerrada. Intentando reconectar...');
          this.isConnected = false;
          this.reconnect();
        }
      }
    });

    this.socket$.subscribe({
      next: (message: SocketMessage) => {
        if (message && message.event) {
          this.messages$.next(message);
        }
      },
      error: (err) => {
        console.error('Error en conexión de WebSocket:', err);
        this.isConnected = false;
        this.reconnect();
      }
    });
  }

  /**
   * Intenta reconectarse al servidor tras una desconexión.
   */
  private reconnect(): void {
    timer(this.reconnectInterval).subscribe(() => {
      if (!this.isConnected) {
        console.log('Reintentando conectar al servidor de WebSocket...');
        this.connect();
      }
    });
  }

  /**
   * Escucha eventos específicos provenientes del servidor WebSocket.
   * 
   * @param event El nombre del evento a escuchar (ej. 'pose_analisis_completado', 'notificacion_recibida').
   */
  listen<T = any>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (message.event === event) {
          observer.next(message.data as T);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Envía un evento con datos al servidor WebSocket.
   * 
   * @param event El nombre del evento.
   * @param data Los datos a enviar en el cuerpo.
   */
  emit<T = any>(event: string, data: T): void {
    if (this.socket$ && !this.socket$.closed) {
      const message: SocketMessage<T> = { event, data };
      this.socket$.next(message);
    } else {
      console.error('No se pudo enviar el mensaje, el WebSocket está cerrado.', { event, data });
    }
  }

  /**
   * Cierra manualmente la conexión.
   */
  close(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}
