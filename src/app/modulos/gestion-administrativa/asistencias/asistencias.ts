import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AsistenciasService } from '../../../nucleo/graphql/gestion-administrativa/asistencias';
import { TurnosService } from '../../../nucleo/graphql/gestion-administrativa/turnos';
import { EmpleadosService } from '../../../nucleo/graphql/gestion-administrativa/empleados';
import { LoginService } from '../../../nucleo/rest/login.service';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { Paginacion, PaginaInfo } from '../../../compartido/paginacion/paginacion';
import { SelectorEmpleado } from '../../../compartido/selector-empleado/selector-empleado';
import { KpiCard } from '../../../compartido/kpi-card/kpi-card';
import { CrearAsistencias } from './crear-asistencias/crear-asistencias';
import { EditarAsistencias } from './editar-asistencias/editar-asistencias';
import { VerAsistencias } from './ver-asistencias/ver-asistencias';

/** Mapea el número de día JS (0=dom, 1=lun, ...) al valor del enum DiaSemana del backend */
const DIA_JS_A_BACKEND: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

@Component({
  selector: 'app-asistencias',
  imports: [Tabla, Modal, Paginacion, SelectorEmpleado, KpiCard, CrearAsistencias, EditarAsistencias, VerAsistencias],
  templateUrl: './asistencias.html',
})
export class Asistencias implements OnInit {
  private asistenciasService = inject(AsistenciasService);
  private turnosService = inject(TurnosService);
  private empleadosService = inject(EmpleadosService);
  private loginService = inject(LoginService);

  asistencias = signal<any[]>([]);
  cargando = signal(false);
  paginaInfo = signal<PaginaInfo | null>(null);
  paginaActual = signal(0);

  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  asistenciaSeleccionada = signal<any | null>(null);

  empleadosMapa = signal<Record<string, string>>({});
  empleadoFiltro = signal<string | null>(null);
  todasAsistenciasFiltro = signal<any[]>([]);

  /** Turnos del empleado actualmente seleccionado/propio */
  turnosEmpleado = signal<any[]>([]);
  /** true = solo muestra asistencias en días con turno asignado */
  filtroSoloDiasTurno = signal(false);

  /** Conjunto de nombres de días con turno activo */
  diasConTurno = computed(() =>
    new Set(this.turnosEmpleado().filter(t => t.activo).map(t => t.diaSemana))
  );

  /** Lista de turnos activos ordenada para mostrar el horario */
  horarioSemanal = computed(() => {
    const orden = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
    return [...this.turnosEmpleado()]
      .filter(t => t.activo)
      .sort((a, b) => orden.indexOf(a.diaSemana) - orden.indexOf(b.diaSemana));
  });

  kpiTotal = computed(() => this.todasAsistenciasFiltro().length);
  kpiPresentes = computed(() => this.todasAsistenciasFiltro().filter(a => a.estado === 'presente').length);
  kpiTardanzas = computed(() => this.todasAsistenciasFiltro().filter(a => a.estado === 'tardanza').length);
  kpiFaltas = computed(() => this.todasAsistenciasFiltro().filter(a => a.estado === 'ausente').length);
  /** Días de turno cumplidos (asistencia presente o tardanza en un día con turno) */
  kpiCumplidos = computed(() =>
    this.todasAsistenciasFiltro().filter(a =>
      (a.estado === 'presente' || a.estado === 'tardanza') && a.esDiaDeTurno
    ).length
  );

  empleadoIdPropio = signal<string | null>(null);

  readonly esAdministrador = this.loginService.tieneRoles('administrador');
  readonly esDirector = this.loginService.tieneRoles('director');
  readonly esFisioterapeuta = this.loginService.tieneRoles('fisioterapeuta');
  readonly esRecepcionista = this.loginService.tieneRoles('recepcionista');

  get modo(): 'todos' | 'propio' | 'solo-crear' {
    if (this.esAdministrador || this.esDirector) return 'todos';
    if (this.esFisioterapeuta) return 'propio';
    return 'solo-crear';
  }

  readonly puedeCrear = this.loginService.tieneRoles('recepcionista', 'administrador', 'fisioterapeuta');
  readonly puedeEditar = this.loginService.tieneRoles('administrador', 'fisioterapeuta');

  columnas: ColumnaTabla[] = [
    { key: 'empleadoNombre', titulo: 'Empleado' },
    { key: 'fecha', titulo: 'Fecha' },
    { key: 'diaSemanaLabel', titulo: 'Día' },
    { key: 'horaEntrada', titulo: 'Entrada' },
    { key: 'horaSalida', titulo: 'Salida' },
    { key: 'estado', titulo: 'Estado', tipo: 'enum' },
    { key: 'turnoLabel', titulo: 'En turno' },
  ];

  ngOnInit(): void {
    this.empleadosService.listarEmpleados(0, 1000).subscribe({
      next: (res: any) => {
        const mapa: Record<string, string> = {};
        for (const emp of res.contenido || []) {
          mapa[emp.id] = `${emp.persona?.nombre ?? ''} ${emp.persona?.apellido ?? ''}`.trim() || emp.cargo || `Empleado #${emp.id}`;
        }
        this.empleadosMapa.set(mapa);
        this.iniciarCarga();
      },
      error: () => this.iniciarCarga(),
    });
  }

  private iniciarCarga(): void {
    if (this.modo === 'propio') {
      this.resolverEmpleadoPropio();
    } else if (this.modo === 'todos') {
      this.cargarAsistencias();
    }
  }

  /**
   * Enriquece cada asistencia con: nombre del empleado, etiqueta del día de la semana,
   * y si la fecha cae en un día con turno asignado.
   */
  private mapearAsistencias(lista: any[]): any[] {
    const mapa = this.empleadosMapa();
    const diasTurno = this.diasConTurno();
    return lista.map(a => {
      const fecha = new Date(a.fecha);
      const diaSemana = DIA_JS_A_BACKEND[fecha.getDay()] ?? '';
      const esDiaDeTurno = diasTurno.has(diaSemana);
      return {
        ...a,
        empleadoNombre: mapa[a.empleadoId] || `Empleado #${a.empleadoId}`,
        diaSemanaLabel: this.formatearDia(diaSemana),
        esDiaDeTurno,
        turnoLabel: diasTurno.size > 0 ? (esDiaDeTurno ? '✓ Sí' : '— No') : '—',
      };
    });
  }

  private formatearDia(dia: string): string {
    const etiquetas: Record<string, string> = {
      lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
      jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
    };
    return etiquetas[dia] ?? dia;
  }

  private resolverEmpleadoPropio(): void {
    const usuario = this.loginService.obtenerUsuario();
    if (!usuario?.personaId) return;
    this.cargando.set(true);
    this.empleadosService.verEmpleadoPorPersonaId(String(usuario.personaId)).subscribe({
      next: (emp) => {
        if (emp?.id) {
          this.empleadoIdPropio.set(String(emp.id));
          this.cargarDatosEmpleado(String(emp.id));
        } else {
          this.cargando.set(false);
        }
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Carga asistencias y turnos del empleado en paralelo. */
  private cargarDatosEmpleado(empleadoId: string): void {
    this.cargando.set(true);
    this.turnosService.listarTurnosPorEmpleado(empleadoId).subscribe({
      next: (turnos) => {
        this.turnosEmpleado.set(turnos);
        this.asistenciasService.listarAsistenciasPorEmpleado(empleadoId).subscribe({
          next: (lista) => {
            this.todasAsistenciasFiltro.set(this.mapearAsistencias(lista));
            this.aplicarFiltroYPaginacion();
            this.cargando.set(false);
          },
          error: () => this.cargando.set(false),
        });
      },
      error: () => {
        this.asistenciasService.listarAsistenciasPorEmpleado(empleadoId).subscribe({
          next: (lista) => {
            this.todasAsistenciasFiltro.set(this.mapearAsistencias(lista));
            this.aplicarFiltroYPaginacion();
            this.cargando.set(false);
          },
          error: () => this.cargando.set(false),
        });
      },
    });
  }

  cargarAsistencias(): void {
    this.cargando.set(true);
    this.asistenciasService.listarAsistencias(this.paginaActual()).subscribe({
      next: (res) => {
        this.asistencias.set(this.mapearAsistencias(res.contenido));
        this.paginaInfo.set(res.paginaInfo);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Aplica filtro "solo días de turno" y calcula paginación local. */
  aplicarFiltroYPaginacion(): void {
    let base = this.todasAsistenciasFiltro();
    if (this.filtroSoloDiasTurno() && this.diasConTurno().size > 0) {
      base = base.filter(a => a.esDiaDeTurno);
    }
    const tamano = 20;
    const total = base.length;
    const totalPaginas = Math.max(1, Math.ceil(total / tamano));
    if (this.paginaActual() >= totalPaginas) this.paginaActual.set(0);
    const inicio = this.paginaActual() * tamano;
    this.asistencias.set(base.slice(inicio, inicio + tamano));
    this.paginaInfo.set(
      total > 0
        ? { totalElementos: total, totalPaginas, paginaActual: this.paginaActual(),
            tamano, primero: this.paginaActual() === 0, ultimo: this.paginaActual() === totalPaginas - 1 }
        : null
    );
  }

  toggleFiltroTurno(): void {
    this.filtroSoloDiasTurno.update(v => !v);
    this.paginaActual.set(0);
    this.aplicarFiltroYPaginacion();
  }

  filtrarPorEmpleado(id: number | null): void {
    if (id) {
      this.empleadoFiltro.set(String(id));
      this.turnosEmpleado.set([]);
      this.filtroSoloDiasTurno.set(false);
      this.paginaActual.set(0);
      this.cargarDatosEmpleado(String(id));
    } else {
      this.empleadoFiltro.set(null);
      this.turnosEmpleado.set([]);
      this.todasAsistenciasFiltro.set([]);
      this.filtroSoloDiasTurno.set(false);
      this.paginaActual.set(0);
      this.cargarAsistencias();
    }
  }

  recargar(): void {
    if (this.modo === 'propio' && this.empleadoIdPropio()) {
      this.cargarDatosEmpleado(this.empleadoIdPropio()!);
    } else if (this.modo === 'todos') {
      if (this.empleadoFiltro()) {
        this.cargarDatosEmpleado(this.empleadoFiltro()!);
      } else {
        this.cargarAsistencias();
      }
    }
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    if ((this.modo === 'todos' && this.empleadoFiltro()) || this.modo === 'propio') {
      this.aplicarFiltroYPaginacion();
    } else {
      this.cargarAsistencias();
    }
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(a: any): void { this.asistenciaSeleccionada.set(a); this.modalEditar.set(true); }
  abrirVer(a: any): void { this.asistenciaSeleccionada.set(a); this.modalVer.set(true); }

  cerrarModalCrear(): void { this.modalCrear.set(false); }

  crearAsistencia(datos: any): void {
    this.asistenciasService.crearAsistencia({
      empleadoId: String(datos.empleadoId),
      fecha: datos.fecha,
      horaEntrada: datos.horaEntrada,
      horaSalida: datos.horaSalida ?? null,
      estado: datos.estado,
    }).subscribe({
      next: () => { this.cerrarModalCrear(); this.recargar(); },
    });
  }

  editarAsistencia(datos: any): void {
    this.asistenciasService.editarAsistencia(String(datos.id), {
      horaEntrada: datos.horaEntrada,
      horaSalida: datos.horaSalida ?? null,
      estado: datos.estado,
    }).subscribe({
      next: () => { this.modalEditar.set(false); this.recargar(); },
    });
  }

  eliminarAsistencia(id: any): void {
    if (!confirm('¿Desea eliminar este registro de asistencia?')) return;
    this.asistenciasService.eliminarAsistencia(String(id)).subscribe({
      next: () => this.recargar(),
    });
  }
}
