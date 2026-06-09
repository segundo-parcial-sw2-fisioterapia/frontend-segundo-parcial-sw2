import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SesionesService } from '../../../../nucleo/graphql/gestion-clinica/sesiones';
import { LoginService } from '../../../../nucleo/rest/login.service';

@Component({
  selector: 'app-ver-sesiones',
  imports: [],
  templateUrl: './ver-sesiones.html',
  styleUrl: './ver-sesiones.css',
})
export class VerSesiones implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sesionesService = inject(SesionesService);
  private auth = inject(LoginService);

  sesion = signal<any | null>(null);
  cargando = signal(true);
  iniciando = signal(false);

  esFisioterapeuta = this.auth.tieneRoles('fisioterapeuta');
  esAdmin = this.auth.tieneRoles('administrador');
  esRecepcionista = this.auth.tieneRoles('recepcionista');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (!id) { this.volver(); return; }
    this.cargarSesion(id);
  }

  private cargarSesion(id: number): void {
    this.cargando.set(true);
    this.sesionesService.verSesion(id).subscribe({
      next: (s) => {
        if (!s) { this.volver(); return; }
        this.sesion.set({
          ...s,
          estado_sesion: String(s.estado_sesion ?? 'programada').toUpperCase(),
        });
        this.cargando.set(false);
      },
      error: () => this.volver(),
    });
  }

  get estadoLabel(): string {
    const map: Record<string, string> = {
      PROGRAMADA: 'Pago Pendiente',
      HABILITADA: 'Habilitada para Atención',
      ABIERTA: 'En Atención',
      CERRADA: 'Cerrada',
      FIRMADA: 'Firmada (Blockchain)',
      CANCELADA: 'Cancelada',
    };
    return map[this.sesion()?.estado_sesion] ?? this.sesion()?.estado_sesion ?? '—';
  }

  /** Inicia la sesión HABILITADA y recarga la vista */
  iniciarSesion(): void {
    const sesion = this.sesion();
    if (!sesion || sesion.estado_sesion !== 'HABILITADA') return;
    this.iniciando.set(true);
    this.sesionesService.iniciarSesion(sesion.id).subscribe({
      next: () => this.cargarSesion(sesion.id),
      error: () => this.iniciando.set(false),
    });
  }

  /** Navega a la página de edición (tomar sesión) */
  tomarSesion(): void {
    const id = this.sesion()?.id;
    if (id) this.router.navigate(['/app/sesiones/editar', id]);
  }

  volver(): void {
    this.router.navigate(['/app/sesiones']);
  }

  formatFecha(valor: string | null | undefined): string {
    if (!valor) return '—';
    try {
      const d = new Date(valor);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return valor;
    }
  }
}
