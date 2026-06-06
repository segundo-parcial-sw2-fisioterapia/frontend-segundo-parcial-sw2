import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { SesionesService } from '../../../nucleo/graphql/gestion-clinica/sesiones';
import { EmpleadosService } from '../../../nucleo/graphql/gestion-administrativa/empleados';
import { MensualidadesService } from '../../../nucleo/graphql/gestion-administrativa/mensualidades';
import { LoginService } from '../../../nucleo/rest/login.service';
import { ClinicaSocketService } from '../../../nucleo/sockets/clinica-socket.service';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { KpiCard } from '../../../compartido/kpi-card/kpi-card';
import { Modal } from '../../../compartido/modal/modal';

@Component({
  selector: 'app-sesiones',
  imports: [Tabla, KpiCard, Modal],
  templateUrl: './sesiones.html',
  styleUrl: './sesiones.css',
})
export class Sesiones implements OnInit, OnDestroy {
  private sesionesService = inject(SesionesService);
  private empleadosService = inject(EmpleadosService);
  private mensualidadesService = inject(MensualidadesService);
  private auth = inject(LoginService);
  private socketClinica = inject(ClinicaSocketService);
  private router = inject(Router);

  // ── Estado ──────────────────────────────────────────────────────────────
  sesiones = signal<any[]>([]);
  fisioterapeutas = signal<any[]>([]);
  cargando = signal(false);
  cargandoFisios = signal(false);

  // Modal reasignación
  sesionReasignar = signal<any | null>(null);
  fisioSeleccionadoId = signal<number | null>(null);
  modalReasignar = signal(false);

  // ── Roles del usuario autenticado ────────────────────────────────────────
  private readonly usuario = this.auth.obtenerUsuario();
  esFisioterapeuta = signal(this.auth.tieneRoles('fisioterapeuta'));
  esRecepcionista = signal(this.auth.tieneRoles('recepcionista'));
  esAdmin = signal(this.auth.tieneRoles('administrador'));
  esDirector = signal(this.auth.tieneRoles('director'));

  /** ID de empleado del fisioterapeuta autenticado (null hasta resolver) */
  miEmpleadoId = signal<number | null>(null);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  kpiEnEspera = computed(() =>
    this.sesiones().filter(
      (s) => s.estado_sesion === 'HABILITADA' && !s.empleado_id,
    ).length,
  );

  kpiEnAtencion = computed(() =>
    this.sesiones().filter((s) => s.estado_sesion === 'ABIERTA').length,
  );

  kpiCerradasHoy = computed(() => {
    const hoy = new Date().toDateString();
    return this.sesiones().filter(
      (s) =>
        s.estado_sesion === 'CERRADA' &&
        s.fecha_hora_fin &&
        new Date(s.fecha_hora_fin).toDateString() === hoy,
    ).length;
  });

  // ── Panel carga de fisioterapeutas ────────────────────────────────────────
  cargaFisioterapeutas = computed(() => {
    const sesiones = this.sesiones();
    return this.fisioterapeutas().map((fisio) => {
      // Obtenemos todas las sesiones activas (no terminadas) de este fisioterapeuta
      const pendientes = sesiones.filter(
        (s) => Number(s.empleado_id) === Number(fisio.id) && 
               ['PROGRAMADA', 'HABILITADA', 'ABIERTA'].includes(s.estado_sesion)
      ).length;

      return {
        ...fisio,
        pendientes,
        estadoTexto: pendientes === 0 ? 'Libre' : `${pendientes} asignada(s)`,
        libre: pendientes === 0,
      };
    });
  });

  kpiLibres = computed(
    () => this.cargaFisioterapeutas().filter((f) => f.libre).length,
  );

  // ── Subscriptions ─────────────────────────────────────────────────────────
  private subs: Subscription[] = [];

  // ── Columnas de tabla ─────────────────────────────────────────────────────
  columnas: ColumnaTabla[] = [
    {
      key: 'plan_tratamiento.evaluacion_inicial.paciente.persona.nombre',
      titulo: 'Paciente',
    },
    { key: 'numero_sesion', titulo: 'Sesión #' },
    {
      key: 'fecha_hora_programada',
      titulo: 'Fecha Programada',
      tipo: 'fecha-hora',
    },
    {
      key: 'estado_sesion',
      titulo: 'Estado',
      tipo: 'badge',
      badgeMap: {
        PROGRAMADA: { texto: 'Pago Pendiente', clases: 'badge-amarillo' },
        HABILITADA: { texto: 'Habilitada', clases: 'badge-verde' },
        ABIERTA: { texto: 'En Atención', clases: 'bg-blue-100 text-blue-800' },
        CERRADA: { texto: 'Cerrada', clases: 'bg-gray-100 text-gray-600' },
        FIRMADA: { texto: 'Firmada', clases: 'bg-purple-100 text-purple-700' },
        CANCELADA: { texto: 'Cancelada', clases: 'badge-rojo' },
      },
    },
    { key: 'empleado_id', titulo: 'Fisio ID' },
    { key: 'mensualidad_id', titulo: 'Mensualidad #' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.inicializarSegunRol();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  /** Determina el query a usar y si se carga el panel de fisioterapeutas */
  private inicializarSegunRol(): void {
    if (this.esFisioterapeuta()) {
      const personaId = this.usuario?.personaId;
      if (personaId) {
        this.empleadosService
          .verEmpleadoPorPersonaId(String(personaId))
          .subscribe({
            next: (emp) => {
              if (emp?.id) {
                this.miEmpleadoId.set(Number(emp.id));
                this.cargarSesiones();
                this.suscribirWebSocket();
              }
            },
          });
      }
    } else {
      this.cargarSesiones();
      if (this.esRecepcionista() || this.esAdmin()) {
        this.cargarFisioterapeutas();
      }
      this.suscribirWebSocket();
    }
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  /** Carga sesiones según el rol: fisioterapeuta → solo las suyas, resto → todas */
  cargarSesiones(): void {
    this.cargando.set(true);

    if (this.esFisioterapeuta() && this.miEmpleadoId()) {
      forkJoin({
        sesiones: this.sesionesService.listarSesionesPorEmpleado(this.miEmpleadoId()!),
        mensualidades: this.mensualidadesService.listarMensualidades(0, 500),
      }).subscribe({
        next: ({ sesiones, mensualidades }) => {
          const pagosMap = new Map<string, string>();
          (mensualidades?.contenido ?? []).forEach((m: any) => {
            if (m.id) pagosMap.set(String(m.id), String(m.estado).toLowerCase());
          });
          this.sesiones.set(this.normalizarEstados(sesiones, pagosMap));
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
      return;
    }

    // admin / recepcionista / director: listado completo cruzado con mensualidades
    forkJoin({
      sesiones: this.sesionesService.listarSesiones(),
      mensualidades: this.mensualidadesService.listarMensualidades(0, 500),
    }).subscribe({
      next: ({ sesiones, mensualidades }) => {
        const pagosMap = new Map<string, string>();
        (mensualidades?.contenido ?? []).forEach((m: any) => {
          if (m.id) pagosMap.set(String(m.id), String(m.estado).toLowerCase());
        });
        this.sesiones.set(this.normalizarEstados(sesiones, pagosMap));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Carga los fisioterapeutas para el panel de carga de trabajo */
  cargarFisioterapeutas(): void {
    this.cargandoFisios.set(true);
    this.empleadosService.listarFisioterapeutas().subscribe({
      next: (lista) => {
        this.fisioterapeutas.set(lista ?? []);
        this.cargandoFisios.set(false);
      },
      error: () => this.cargandoFisios.set(false),
    });
  }

  /**
   * Convierte estados del backend (minúsculas) a mayúsculas para el badgeMap,
   * y aplica la lógica de PROGRAMADA → HABILITADA al cruzar con mensualidades pagadas.
   */
  private normalizarEstados(
    sesiones: any[],
    pagosMap: Map<string, string>,
  ): any[] {
    return (sesiones ?? []).map((s) => {
      let estado = String(s.estado_sesion ?? 'programada').toUpperCase();
      if (estado === 'PROGRAMADA' && s.mensualidad_id) {
        if (pagosMap.get(String(s.mensualidad_id)) === 'pagada') {
          estado = 'HABILITADA';
        }
      }
      return { ...s, estado_sesion: estado };
    });
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────

  private suscribirWebSocket(): void {
    // sesion_asignada
    const subAsignada = this.socketClinica
      .listen<{
        sesionId: number;
        empleadoId: number;
        pacienteNombre: string;
        numeroSesion: number;
      }>('sesion_asignada')
      .subscribe((data) => {
        const esParaMi =
          this.esFisioterapeuta() && Number(data.empleadoId) === Number(this.miEmpleadoId());
        
        if (esParaMi) {
          // El fisio necesita todos los detalles de su nueva sesión, así que recarga.
          this.cargarSesiones();
        } else {
          // Admin y Recepcionista actualizan la señal en memoria instantáneamente
          this.sesiones.update((sesiones) =>
            sesiones.map((s) =>
              Number(s.id) === Number(data.sesionId)
                ? { ...s, empleado_id: Number(data.empleadoId) }
                : s
            )
          );
        }
      });

    // sesion_habilitada / sesion_iniciada / sesion_cerrada → actualizar señal
    const eventosSimples = [
      { ev: 'sesion_habilitada', estado: 'HABILITADA', fecha: null },
      { ev: 'sesion_iniciada', estado: 'ABIERTA', fecha: 'fecha_hora_inicio' },
      { ev: 'sesion_cerrada', estado: 'CERRADA', fecha: 'fecha_hora_fin' },
    ];

    eventosSimples.forEach(({ ev, estado, fecha }) => {
      const sub = this.socketClinica
        .listen<{ sesionId: number; empleadoId: number | null }>(ev)
        .subscribe((data) => {
          this.sesiones.update((sesiones) =>
            sesiones.map((s) => {
              if (Number(s.id) === Number(data.sesionId)) {
                const nueva = { ...s, estado_sesion: estado };
                if (fecha) nueva[fecha] = new Date().toISOString();
                return nueva;
              }
              return s;
            })
          );
        });
      this.subs.push(sub);
    });

    this.subs.push(subAsignada);
  }

  // ── Acciones de tabla ─────────────────────────────────────────────────────

  verDetalle(id: number): void {
    this.router.navigate(['/app/sesiones/ver', id]);
  }

  tomarSesion(id: number): void {
    this.router.navigate(['/app/sesiones/editar', id]);
  }

  /** Inicia una sesión HABILITADA (fisioterapeuta) */
  iniciarSesion(sesion: any): void {
    this.sesionesService.iniciarSesion(sesion.id).subscribe({
      next: () => this.cargarSesiones(),
    });
  }

  /** Abre el modal de reasignación para una sesión */
  abrirReasignar(sesion: any): void {
    this.sesionReasignar.set(sesion);
    this.fisioSeleccionadoId.set(sesion.empleado_id ?? null);
    this.modalReasignar.set(true);
  }

  /** Confirma la reasignación del fisioterapeuta */
  confirmarReasignar(): void {
    const sesion = this.sesionReasignar();
    const fisioId = this.fisioSeleccionadoId();
    if (!sesion || !fisioId) return;

    this.sesionesService.asignarFisioterapeuta(sesion.id, fisioId).subscribe({
      next: () => {
        this.modalReasignar.set(false);
        this.sesionReasignar.set(null);
        this.cargarSesiones();
      },
    });
  }

  /** Elimina una sesión tras confirmación (solo administrador) */
  eliminarSesion(id: number): void {
    if (!confirm('¿Desea eliminar esta sesión? Esta acción es permanente.')) return;
    this.sesionesService.eliminarSesion(id).subscribe({
      next: () => this.cargarSesiones(),
    });
  }

  // ── Utilidades de template ────────────────────────────────────────────────

  semaforo(sesion: any): string {
    return (
      sesion.plan_tratamiento?.evaluacion_inicial?.categoria_semaforo ?? ''
    );
  }
}
