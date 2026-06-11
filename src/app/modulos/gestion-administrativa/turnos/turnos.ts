import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TurnosService } from '../../../nucleo/graphql/gestion-administrativa/turnos';
import { EmpleadosService } from '../../../nucleo/graphql/gestion-administrativa/empleados';
import { LoginService } from '../../../nucleo/rest/login.service';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { Paginacion, PaginaInfo } from '../../../compartido/paginacion/paginacion';
import { SelectorEmpleado } from '../../../compartido/selector-empleado/selector-empleado';
import { KpiCard } from '../../../compartido/kpi-card/kpi-card';
import { EditarTurnos } from './editar-turnos/editar-turnos';
import { VerTurnos } from './ver-turnos/ver-turnos';

@Component({
  selector: 'app-turnos',
  imports: [Tabla, Modal, Paginacion, SelectorEmpleado, KpiCard, EditarTurnos, VerTurnos, RouterLink],
  templateUrl: './turnos.html',
})
export class Turnos implements OnInit {
  private turnosService = inject(TurnosService);
  private empleadosService = inject(EmpleadosService);
  private loginService = inject(LoginService);

  turnos = signal<any[]>([]);
  cargando = signal(false);
  paginaInfo = signal<PaginaInfo | null>(null);
  paginaActual = signal(0);

  modalEditar = signal(false);
  modalVer = signal(false);
  turnoSeleccionado = signal<any | null>(null);



  empleadosMapa = signal<Record<string, string>>({});
  empleadoFiltro = signal<string | null>(null);
  todasTurnosFiltro = signal<any[]>([]);

  kpiTotal = computed(() => this.todasTurnosFiltro().length);
  kpiActivos = computed(() => this.todasTurnosFiltro().filter(t => t.activo).length);
  kpiInactivos = computed(() => this.todasTurnosFiltro().filter(t => !t.activo).length);

  /** empleadoId del usuario autenticado (fisioterapeuta o recepcionista) */
  private empleadoIdPropio = signal<string | null>(null);
  /** true = solo ve sus propios turnos (no admin/director) */
  readonly esModoPropio = !this.loginService.tieneRoles('administrador', 'director');
  readonly esAdministrador = this.loginService.tieneRoles('administrador');

  columnas: ColumnaTabla[] = [
    { key: 'empleadoNombre', titulo: 'Empleado' },
    { key: 'diaSemana', titulo: 'Día', tipo: 'enum' },
    { key: 'horaInicio', titulo: 'Hora inicio' },
    { key: 'horaFin', titulo: 'Hora fin' },
    { key: 'activo', titulo: 'Activo' },
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
      error: () => this.iniciarCarga()
    });
  }

  private iniciarCarga(): void {
    if (this.esModoPropio) {
      this.resolverEmpleadoPropio();
    } else {
      this.cargarTurnos();
    }
  }

  private mapearTurnos(lista: any[]): any[] {
    const mapa = this.empleadosMapa();
    return lista.map(t => ({
      ...t,
      empleadoNombre: mapa[t.empleadoId] || `Empleado #${t.empleadoId}`
    }));
  }

  /**
   * Resuelve el empleadoId del usuario autenticado a partir de su personaId en el JWT.
   * Usado por fisioterapeuta y recepcionista para ver únicamente sus propios turnos.
   */
  private resolverEmpleadoPropio(): void {
    const usuario = this.loginService.obtenerUsuario();
    if (!usuario?.personaId) return;
    this.cargando.set(true);
    this.empleadosService.verEmpleadoPorPersonaId(String(usuario.personaId)).subscribe({
      next: (emp) => {
        if (emp?.id) {
          this.empleadoIdPropio.set(String(emp.id));
          this.cargarTurnosPropios(String(emp.id));
        } else {
          this.cargando.set(false);
        }
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Carga todos los turnos paginados (administrador / director). */
  cargarTurnos(): void {
    this.cargando.set(true);
    this.turnosService.listarTurnos(this.paginaActual()).subscribe({
      next: (res) => {
        this.turnos.set(this.mapearTurnos(res.contenido));
        this.paginaInfo.set(res.paginaInfo);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Carga los turnos del empleado autenticado (fisioterapeuta / recepcionista). */
  private cargarTurnosPropios(empleadoId: string): void {
    this.cargando.set(true);
    this.turnosService.listarTurnosPorEmpleado(empleadoId).subscribe({
      next: (lista) => {
        this.todasTurnosFiltro.set(this.mapearTurnos(lista));
        this.aplicarPaginacionLocal();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  aplicarPaginacionLocal(): void {
    const tamano = 20;
    const total = this.todasTurnosFiltro().length;
    const totalPaginas = Math.ceil(total / tamano);
    
    if (this.paginaActual() >= totalPaginas && totalPaginas > 0) {
      this.paginaActual.set(0);
    }
    
    const inicio = this.paginaActual() * tamano;
    const fin = Math.min(inicio + tamano, total);
    
    this.turnos.set(this.todasTurnosFiltro().slice(inicio, fin));
    
    if (total > 0) {
      this.paginaInfo.set({
        totalElementos: total,
        totalPaginas: totalPaginas,
        paginaActual: this.paginaActual(),
        tamano: tamano,
        primero: this.paginaActual() === 0,
        ultimo: this.paginaActual() === totalPaginas - 1
      });
    } else {
      this.paginaInfo.set(null);
    }
  }

  filtrarPorEmpleado(id: number | null): void {
    if (id) {
      this.empleadoFiltro.set(String(id));
      this.paginaActual.set(0);
      this.cargarTurnosPropios(String(id));
    } else {
      this.empleadoFiltro.set(null);
      this.todasTurnosFiltro.set([]);
      this.paginaActual.set(0);
      this.cargarTurnos();
    }
  }

  /** Recarga la lista según el modo activo. */
  recargar(): void {
    if (this.esModoPropio && this.empleadoIdPropio()) {
      this.cargarTurnosPropios(this.empleadoIdPropio()!);
    } else {
      if (this.empleadoFiltro()) {
        this.cargarTurnosPropios(this.empleadoFiltro()!);
      } else {
        this.cargarTurnos();
      }
    }
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    if ((!this.esModoPropio && this.empleadoFiltro()) || this.esModoPropio) {
      this.aplicarPaginacionLocal();
    } else {
      this.cargarTurnos();
    }
  }

  abrirEditar(turno: any): void { this.turnoSeleccionado.set(turno); this.modalEditar.set(true); }
  abrirVer(turno: any): void { this.turnoSeleccionado.set(turno); this.modalVer.set(true); }

  /** Actualiza los datos de un turno existente y recarga el listado. */
  editarTurno(datos: any): void {
    this.turnosService.editarTurno(String(datos.id), {
      diaSemana: datos.diaSemana,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      activo: datos.activo,
    }).subscribe({
      next: () => { this.modalEditar.set(false); this.recargar(); },
    });
  }

  /** Elimina un turno tras confirmación del usuario. */
  eliminarTurno(id: any): void {
    if (!confirm('¿Desea eliminar este turno?')) return;
    this.turnosService.eliminarTurno(String(id)).subscribe({
      next: () => this.recargar(),
    });
  }
}
