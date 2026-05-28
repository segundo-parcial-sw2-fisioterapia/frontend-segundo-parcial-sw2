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
  tokenAcceso: string;
  tokenRefresco: string;
  usuario?: any;
}

export interface UsuarioAutenticado {
  nombre: string;
  correo: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'token';

  autenticado = signal<boolean>(this.tieneToken());

  /**
   * Envía las credenciales al endpoint REST y almacena el tokenAcceso recibido.
   */
  login(credenciales: LoginCredenciales): Observable<LoginRespuesta> {
    return this.http.post<LoginRespuesta>(`${enviroment.apiUrl}/auth/login`, credenciales).pipe(
      tap((respuesta) => {
        localStorage.setItem(this.TOKEN_KEY, respuesta.tokenAcceso);
        this.autenticado.set(true);
      }),
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

  /**
   * Decodifica el JWT y retorna los datos del usuario autenticado.
   * Extrae nombre completo, correo y array de roles del payload.
   */
  obtenerUsuario(): UsuarioAutenticado | null {
    const token = this.obtenerToken();
    if (!token) return null;
    try {
      const partes = token.split('.');
      if (partes.length !== 3) return null;
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64)) as {
        sub: number;
        correo?: string;
        roles?: string[];
        persona?: { nombre: string; apellido: string };
      };
      const nombre = payload.persona
        ? `${payload.persona.nombre} ${payload.persona.apellido}`.trim()
        : String(payload.sub);
      return {
        nombre,
        correo: payload.correo ?? '',
        roles: payload.roles ?? [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Comprueba de manera estricta y literal si el usuario posee al menos uno
   * de los roles indicados. No aplica bypass de administrador.
   *
   * @example
   * auth.tieneRoles('administrador')               // true solo si es administrador
   * auth.tieneRoles('administrador', 'fisioterapeuta') // true si tiene cualquiera de los dos
   */
  tieneRoles(...rolesRequeridos: string[]): boolean {
    const token = this.obtenerToken();
    if (!token) return false;
    try {
      const partes = token.split('.');
      if (partes.length !== 3) return false;
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64)) as { roles?: string[] };
      const rolesUsuario: string[] = payload.roles ?? [];
      return rolesRequeridos.some((rol) => rolesUsuario.includes(rol));
    } catch {
      return false;
    }
  }

  private tieneToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
