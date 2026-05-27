import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LoginService } from '../../nucleo/rest/login.service';

interface Breadcrumb { subsistema: string; modulo: string; }

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private loginService = inject(LoginService);
  private router = inject(Router);

  private readonly mapaRutas: Record<string, Breadcrumb> = {
    '/app/dashboard':              { subsistema: 'Inicio', modulo: 'Dashboard' },
    '/app/pacientes':              { subsistema: 'Gestión Clínica', modulo: 'Pacientes' },
    '/app/citas':                  { subsistema: 'Gestión Clínica', modulo: 'Citas' },
    '/app/evaluaciones-iniciales': { subsistema: 'Gestión Clínica', modulo: 'Evaluaciones Iniciales' },
    '/app/planes-tratamiento':     { subsistema: 'Gestión Clínica', modulo: 'Planes de Tratamiento' },
    '/app/planes-ejercicios':      { subsistema: 'Gestión Clínica', modulo: 'Planes de Ejercicios' },
    '/app/ejercicios':             { subsistema: 'Gestión Clínica', modulo: 'Ejercicios' },
    '/app/sesiones':               { subsistema: 'Gestión Clínica', modulo: 'Sesiones Clínicas' },
    '/app/sesiones-domiciliarias': { subsistema: 'Gestión Clínica', modulo: 'Sesiones Domiciliarias' },
    '/app/personas':               { subsistema: 'Personas y Acceso', modulo: 'Personas' },
    '/app/usuarios':               { subsistema: 'Personas y Acceso', modulo: 'Usuarios' },
    '/app/admin/empleados':        { subsistema: 'Gestión Administrativa', modulo: 'Empleados' },
    '/app/admin/inventario':       { subsistema: 'Gestión Administrativa', modulo: 'Inventario' },
    '/app/admin/facturacion':      { subsistema: 'Gestión Administrativa', modulo: 'Facturación' },
    '/app/bi/reportes':            { subsistema: 'Inteligencia de Negocio', modulo: 'Reportes' },
    '/app/bi/predictivo':          { subsistema: 'Inteligencia de Negocio', modulo: 'Análisis Predictivo' },
  };

  private rutaActual = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  breadcrumb = computed<Breadcrumb>(() => {
    return this.mapaRutas[this.rutaActual()] ?? { subsistema: 'ERP', modulo: 'Inicio' };
  });

  usuario = computed(() => this.loginService.obtenerUsuario());

  iniciales = computed(() => {
    const nombre = this.usuario()?.nombre ?? 'Administrador';
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  /** Cierra la sesión del usuario actual y redirige al login */
  cerrarSesion(): void {
    this.loginService.logout();
  }
}
