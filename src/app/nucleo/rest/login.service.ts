import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { enviroment } from '../../enviroment/enviroment';

export interface LoginCredenciales {
  correo: string;
  contrasena: string;
}

export interface LoginRespuesta {
  token: string;
  usuario?: any;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'token';

  /** Estado reactivo de autenticación */
  autenticado = signal<boolean>(this.tieneToken());

  /**
   * Envía las credenciales al endpoint REST y almacena el token recibido.
   */
  login(credenciales: LoginCredenciales): Observable<LoginRespuesta> {
    return this.http
      .post<LoginRespuesta>(`${enviroment.apiUrl}/auth/login`, credenciales)
      .pipe(
        tap((respuesta) => {
          localStorage.setItem(this.TOKEN_KEY, respuesta.token);
          this.autenticado.set(true);
        })
      );
  }

  /**
   * Elimina el token y redirige al login.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.autenticado.set(false);
    this.router.navigate(['/login']);
  }

  /**
   * Devuelve el token JWT almacenado, o null si no existe.
   */
  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Decodifica el JWT y retorna los datos básicos del usuario autenticado */
  obtenerUsuario(): { nombre: string; correo: string; rol?: string } | null {
    const token = this.obtenerToken();
    if (!token) return null;
    try {
      const partes = token.split('.');
      if (partes.length !== 3) return null;
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return {
        nombre: payload.nombre ?? payload.name ?? payload.sub ?? 'Administrador',
        correo: payload.correo ?? payload.email ?? '',
        rol: payload.rol ?? payload.role,
      };
    } catch {
      return null;
    }
  }

  private tieneToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
