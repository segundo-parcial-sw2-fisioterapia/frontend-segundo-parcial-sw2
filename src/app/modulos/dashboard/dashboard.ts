import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, KeyValuePipe, DatePipe, NgIf } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { LoginService } from '../../nucleo/rest/login.service';
import { BiGraphQLService } from '../../nucleo/graphql/bi-automatizacion/bi-graphql.service';
import { SesionesService } from '../../nucleo/graphql/gestion-clinica/sesiones';
import { EvaluacionesInicialesService } from '../../nucleo/graphql/gestion-clinica/evaluaciones-iniciales';
import { EmpleadosService } from '../../nucleo/graphql/gestion-administrativa/empleados';
import { ReportesAdminService } from '../../nucleo/graphql/gestion-administrativa/reportes';
import { BiLogsService, LogAutomatizacion } from '../../nucleo/http/bi-logs.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, KeyValuePipe, DatePipe, NgIf],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private loginService = inject(LoginService);
  private biGql = inject(BiGraphQLService);
  private sesionesService = inject(SesionesService);
  private evaluacionesService = inject(EvaluacionesInicialesService);
  private empleadosService = inject(EmpleadosService);
  private reportesAdmin = inject(ReportesAdminService);
  private biLogsService = inject(BiLogsService);
  /**
   * Vista del dashboard según el rol:
   * - estratégica: administrador, director, contador (motor BI + financiero global).
   * - operativa: recepcionista, fisioterapeuta, paciente (sus sesiones y evaluaciones del día).
   */
  vista: 'estrategica' | 'operativa' =
    this.loginService.tieneRoles('administrador', 'director', 'contador') ? 'estrategica' : 'operativa';

  /** Datos de la vista estratégica (BI + financiero). */
  datos = signal<any>(null);
  /** Datos de la vista operativa (agenda del día). */
  operativo = signal<any>(null);
  cargando = signal(true);
  
  /** Logs de n8n para vista estratégica */
  logsBot = signal<LogAutomatizacion[]>([]);

  saludo = signal(this.calcularSaludo());
  fechaHoy = signal(
    new Intl.DateTimeFormat('es-BO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date()),
  );

  nombreUsuario = computed(() => {
    const u = this.loginService.obtenerUsuario();
    return u?.nombre ?? 'Usuario';
  });

  /** Segmentos calculados para el gráfico donut del semáforo (vista estratégica). */
  donutSegments = computed(() => {
    const d = this.datos();
    if (!d?.distribucionSemaforo) return [];
    const { verde, amarillo, rojo } = d.distribucionSemaforo;
    const total = verde + amarillo + rojo || 1;
    const v = (verde / total) * 100;
    const a = (amarillo / total) * 100;
    const r = (rojo / total) * 100;
    return [
      { color: 'var(--color-semaforo-verde)', label: 'Verde', valor: verde, pct: Math.round(v), dasharray: `${v.toFixed(1)} ${(100 - v).toFixed(1)}`, dashoffset: 25 },
      { color: 'var(--color-semaforo-amarillo)', label: 'Amarillo', valor: amarillo, pct: Math.round(a), dasharray: `${a.toFixed(1)} ${(100 - a).toFixed(1)}`, dashoffset: 25 - v },
      { color: 'var(--color-semaforo-rojo)', label: 'Rojo', valor: rojo, pct: Math.round(r), dasharray: `${r.toFixed(1)} ${(100 - r).toFixed(1)}`, dashoffset: 25 - v - a },
    ];
  });

  totalSemaforo = computed(() => {
    const d = this.datos();
    if (!d?.distribucionSemaforo) return 0;
    const { verde, amarillo, rojo } = d.distribucionSemaforo;
    return verde + amarillo + rojo;
  });

  /** Barras del gráfico de sesiones por diagnóstico (vista estratégica). */
  barras = computed(() => {
    const d = this.datos();
    if (!d?.sesionesPorMes?.length) return [];
    const max = Math.max(...d.sesionesPorMes.map((c: any) => c.valor), 1);
    return d.sesionesPorMes.map((c: any, i: number) => ({
      mes: c.mes,
      valor: c.valor,
      altura: Math.round((c.valor / max) * 78),
      esUltimo: i === d.sesionesPorMes.length - 1,
    }));
  });

  /** Barras de ingresos mensuales reales (vista estratégica). */
  barrasIngresos = computed(() => {
    const d = this.datos();
    if (!d?.ingresosPorMes?.length) return [];
    const max = Math.max(...d.ingresosPorMes.map((m: any) => m.totalIngresos), 1);
    return d.ingresosPorMes.map((m: any, i: number) => ({
      etiqueta: m.etiqueta,
      valor: m.totalIngresos,
      altura: Math.round((m.totalIngresos / max) * 78),
      esActual: i === new Date().getMonth(),
    }));
  });

  ngOnInit(): void {
    if (this.vista === 'estrategica') {
      this.cargarEstrategico();
    } else {
      this.cargarOperativo();
    }
  }

  // ─────────────────────────────── Vista Estratégica ───────────────────────────────

  /**
   * Carga el motor BI (5 KPIs de Django) y el reporte financiero real (Spring Boot)
   * para la vista gerencial. Los ingresos del card provienen de facturas reales.
   */
  private cargarEstrategico(): void {
    const hoy = new Date();
    const periodo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    forkJoin({
      bi: this.biGql.dashboardKpis(periodo).pipe(catchError(() => of(null))),
      financiero: this.reportesAdmin.reporteFinanciero(hoy.getFullYear()).pipe(catchError(() => of(null))),
      logs: this.biLogsService.listarLogs(10).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ bi, financiero, logs }) => {
        if (logs?.logs) {
          this.logsBot.set(logs.logs);
        }
        const res = bi?.dashboardKpis;
        const mesIdx = hoy.getMonth();

        // Ingresos reales del mes en curso desde las facturas de Spring Boot.
        const ingresosMes = financiero?.ingresosPorMes?.[mesIdx]?.totalIngresos ?? 0;
        const ingresosMesPrev = mesIdx > 0 ? (financiero?.ingresosPorMes?.[mesIdx - 1]?.totalIngresos ?? 0) : 0;
        const proyeccion = res?.ingresos?.proyeccion ?? 0;

        const total = res?.tasaAltaMedica?.total ?? 0;
        const abandono = res?.tasaAltaMedica?.abandono ?? 0;

        this.datos.set({
          kpis: {
            pacientesActivos: res?.tasaAltaMedica?.enCurso ?? 0,
            tasaAltaMedica: res?.tasaAltaMedica?.tasaAltaMedicaPct ?? 0,
            tasaAbandono: total > 0 ? Math.round((abandono / total) * 100) : 0,
            ingresosMes,
            ingresosMes_variacion: this.variacionPct(ingresosMes, ingresosMesPrev),
            proyeccion,
            superaProyeccion: ingresosMes >= proyeccion,
            totalFacturas: financiero?.totalFacturas ?? 0,
          },
          distribucionSemaforo: {
            verde: res?.distribucionSemaforo?.verde?.cantidad ?? 0,
            amarillo: res?.distribucionSemaforo?.amarillo?.cantidad ?? 0,
            rojo: res?.distribucionSemaforo?.rojo?.cantidad ?? 0,
          },
          ocupacionFisioterapeutas: (res?.tasaOcupacion?.datos ?? []).map((z: any) => {
            const nombreZona = this.formatearEtiqueta(z.zona);
            return {
              nombre: nombreZona,
              iniciales: nombreZona.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
              ocupacion: z.tasaOcupacionPct,
            };
          }),
          sesionesPorMes: (res?.sesionesPorEnfermedad?.datos ?? []).slice(0, 6).map((e: any) => ({
            mes: this.abreviar(this.formatearEtiqueta(e.enfermedad)),
            valor: Math.round(e.promedioSesiones),
          })),
          ingresosPorMes: financiero?.ingresosPorMes ?? [],
        });
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el dashboard estratégico:', err);
        this.cargando.set(false);
      },
    });
  }

  // ─────────────────────────────── Vista Operativa ───────────────────────────────

  /**
   * Carga la agenda del día para roles operativos. El fisioterapeuta ve solo sus
   * sesiones asignadas; recepcionista ve todas. Las evaluaciones se filtran por rol
   * en el backend (RLS). Sin información financiera ni gerencial.
   */
  private cargarOperativo(): void {
    const usuario = this.loginService.obtenerUsuario();
    const esFisioSolo =
      this.loginService.tieneRoles('fisioterapeuta') &&
      !this.loginService.tieneRoles('administrador', 'recepcionista', 'director');

    // Fisioterapeuta: resolver su empleadoId desde el personaId del JWT y traer solo lo suyo.
    const sesiones$ =
      esFisioSolo && usuario?.personaId
        ? this.empleadosService.verEmpleadoPorPersonaId(String(usuario.personaId)).pipe(
            switchMap((emp) =>
              emp?.id ? this.sesionesService.listarSesionesPorEmpleado(Number(emp.id)) : of([] as any[]),
            ),
            catchError(() => of([] as any[])),
          )
        : this.sesionesService.listarSesiones().pipe(catchError(() => of([] as any[])));

    forkJoin({
      sesiones: sesiones$,
      evaluaciones: this.evaluacionesService.listarEvaluacionesIniciales().pipe(catchError(() => of([] as any[]))),
    }).subscribe({
      next: ({ sesiones, evaluaciones }) => {
        this.operativo.set(this.construirAgenda(sesiones ?? [], evaluaciones ?? []));
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el dashboard operativo:', err);
        this.cargando.set(false);
      },
    });
  }

  /** Arma las listas y el resumen del día a partir de sesiones y evaluaciones reales. */
  private construirAgenda(sesiones: any[], evaluaciones: any[]) {
    const inicioHoy = this.inicioDelDia(new Date());
    const finHoy = new Date(inicioHoy.getTime() + 86_400_000);
    const esHoy = (raw: string | null | undefined) => {
      if (!raw) return false;
      const d = new Date(raw);
      return !isNaN(d.getTime()) && d >= inicioHoy && d < finHoy;
    };

    const sesionesHoy = sesiones
      .filter((s) => esHoy(s?.fecha_hora_programada ?? s?.fecha_hora_inicio))
      .map((s) => {
        const ev = s?.plan_tratamiento?.evaluacion_inicial;
        const persona = ev?.paciente?.persona;
        return {
          hora: this.formatearHora(s?.fecha_hora_programada ?? s?.fecha_hora_inicio),
          paciente: persona ? `${persona.nombre} ${persona.apellido}` : 'Paciente',
          detalle: `Sesión N° ${s?.numero_sesion ?? '—'}`,
          estado: String(s?.estado_sesion ?? '').toLowerCase(),
        };
      })
      .sort((a, b) => a.hora.localeCompare(b.hora));

    const evaluacionesHoy = evaluaciones
      .filter((e) => esHoy(e?.fecha_evaluacion))
      .map((e) => {
        const persona = e?.paciente?.persona;
        return {
          paciente: persona ? `${persona.nombre} ${persona.apellido}` : 'Paciente',
          detalle: this.formatearEtiqueta(e?.categoria_enfermedad ?? 'Evaluación'),
          semaforo: String(e?.categoria_semaforo ?? '').toLowerCase(),
          estado: String(e?.estado ?? '').toLowerCase(),
        };
      });

    return {
      resumen: {
        sesionesHoy: sesionesHoy.length,
        evaluacionesHoy: evaluacionesHoy.length,
        sesionesPendientes: sesiones.filter((s) =>
          ['programada', 'habilitada'].includes(String(s?.estado_sesion ?? '').toLowerCase()),
        ).length,
        evaluacionesPendientes: evaluaciones.filter(
          (e) => String(e?.estado ?? '').toLowerCase() === 'programada',
        ).length,
      },
      sesionesHoy,
      evaluacionesHoy,
    };
  }

  // ─────────────────────────────── Utilidades ───────────────────────────────

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valor ?? 0);
  }

  /** Variación porcentual entera de un valor contra su período anterior. */
  private variacionPct(actual: number, previo: number): number {
    if (previo <= 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - previo) / previo) * 100);
  }

  /** Normaliza snake_case a Título legible (ej. "extremidad_superior" → "Extremidad Superior"). */
  private formatearEtiqueta(texto: string): string {
    return (texto ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Acorta una etiqueta para las barras del gráfico de diagnósticos. */
  private abreviar(texto: string): string {
    return texto.length > 9 ? texto.substring(0, 8) + '.' : texto;
  }

  private inicioDelDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private formatearHora(raw: string | null | undefined): string {
    if (!raw) return '--:--';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '--:--';
    return new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  }

  private calcularSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
