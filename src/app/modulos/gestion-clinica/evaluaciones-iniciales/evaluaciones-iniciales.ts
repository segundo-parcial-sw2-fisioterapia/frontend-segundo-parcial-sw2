import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { EvaluacionesInicialesService } from '../../../nucleo/graphql/gestion-clinica/evaluaciones-iniciales';
import { PacientesService } from '../../../nucleo/graphql/gestion-clinica/pacientes';
import { EmpleadosService } from '../../../nucleo/graphql/gestion-administrativa/empleados';
import { BiGraphQLService } from '../../../nucleo/graphql/bi-automatizacion/bi-graphql.service';
import { LoginService } from '../../../nucleo/rest/login.service';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { KpiCard } from '../../../compartido/kpi-card/kpi-card';
import { CrearEvaluacionesIniciales } from './crear-evaluaciones-iniciales/crear-evaluaciones-iniciales';
import { VerEvaluacionesIniciales } from './ver-evaluaciones-iniciales/ver-evaluaciones-iniciales';

@Component({
  selector: 'app-evaluaciones-iniciales',
  imports: [Tabla, Modal, KpiCard, CrearEvaluacionesIniciales, VerEvaluacionesIniciales],
  templateUrl: './evaluaciones-iniciales.html',
  styleUrl: './evaluaciones-iniciales.css',
})
export class EvaluacionesIniciales implements OnInit {
  private evaluacionesInicialesService = inject(EvaluacionesInicialesService);
  private pacientesService = inject(PacientesService);
  private empleadosService = inject(EmpleadosService);
  private loginService = inject(LoginService);
  private biGql = inject(BiGraphQLService);
  private router = inject(Router);

  evaluaciones = signal<any[]>([]);
  fisioterapeutas = signal<any[]>([]);
  cargando = signal(false);
  cargandoFisios = signal(false);

  // Modals
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  modalReasignar = signal(false);
  
  evaluacionSeleccionada = signal<any | null>(null);
  evaluacionReasignar = signal<any | null>(null);
  fisioSeleccionadoId = signal<number | null>(null);

  pacientesBuscados = signal<any[]>([]);
  buscandoPaciente = signal(false);

  // Roles
  esFisioterapeuta = signal(this.loginService.tieneRoles('fisioterapeuta'));
  esRecepcionista = signal(this.loginService.tieneRoles('recepcionista'));
  esAdmin = signal(this.loginService.tieneRoles('administrador'));

  // KPIs
  evaluacionesHoy = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return this.evaluaciones().filter((e) => e.fecha_evaluacion?.startsWith(hoy)).length;
  });

  kpiEnEspera = computed(() => 
    this.evaluaciones().filter(e => !e.empleado_id && e.estado?.toLowerCase() === 'programada').length
  );

  cargaFisioterapeutas = computed(() => {
    const evaluaciones = this.evaluaciones();
    return this.fisioterapeutas().map((fisio) => {
      const pendientes = evaluaciones.filter(
        (e) => Number(e.empleado_id) === Number(fisio.id) && 
               ['programada', 'iniciada'].includes(e.estado?.toLowerCase() || '')
      ).length;

      return {
        ...fisio,
        pendientes,
        estadoTexto: pendientes === 0 ? 'Libre' : `${pendientes} asignada(s)`,
        libre: pendientes === 0,
      };
    });
  });

  columnas: ColumnaTabla[] = [
    { key: 'paciente.persona.nombre', titulo: 'Paciente' },
    { key: 'fecha_evaluacion', titulo: 'Fecha y Hora', tipo: 'fecha-hora' },
    {
      key: 'estado',
      titulo: 'Estado',
      tipo: 'badge',
      badgeMap: {
        PROGRAMADA: { texto: 'Programada', clases: 'badge-amarillo' },
        INICIADA: { texto: 'Iniciada', clases: 'bg-blue-100 text-blue-800' },
        TERMINADA: { texto: 'Terminada', clases: 'badge-verde' },
        CANCELADA: { texto: 'Cancelada', clases: 'badge-rojo' },
      },
    },
    { key: 'empleado_id', titulo: 'Fisio ID' },
  ];

  ngOnInit(): void { 
    this.cargarEvaluaciones(); 
    if (this.esRecepcionista() || this.esAdmin()) {
      this.cargarFisioterapeutas();
    }
  }

  cargarEvaluaciones(): void {
    this.cargando.set(true);
    this.evaluacionesInicialesService.listarEvaluacionesIniciales().subscribe({
      next: (data) => {
        // Normalizar estado a uppercase para badgeMap
        const normalizadas = (data || []).map(e => ({
          ...e,
          estado: (e.estado || 'PROGRAMADA').toUpperCase()
        }));
        this.evaluaciones.set(normalizadas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

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

  abrirCrear(): void { this.modalCrear.set(true); }
  
  iniciarEvaluacion(evaluacion: any): void {
    if (evaluacion.estado === 'PROGRAMADA') {
      // Cambiar estado a INICIADA y luego redirigir
      this.evaluacionesInicialesService.editarEvaluacionInicial({
        id: evaluacion.id,
        estado: 'INICIADA'
      }).subscribe({
        next: () => this.router.navigate(['/app/evaluaciones-iniciales/editar', evaluacion.id])
      });
    } else {
      this.router.navigate(['/app/evaluaciones-iniciales/editar', evaluacion.id]);
    }
  }

  abrirVer(item: any): void { this.evaluacionSeleccionada.set(item); this.modalVer.set(true); }

  abrirReasignar(evaluacion: any): void {
    this.evaluacionReasignar.set(evaluacion);
    this.fisioSeleccionadoId.set(evaluacion.empleado_id ?? null);
    this.modalReasignar.set(true);
  }

  confirmarReasignar(): void {
    const evaluacion = this.evaluacionReasignar();
    const fisioId = this.fisioSeleccionadoId();
    if (!evaluacion || !fisioId) return;

    this.evaluacionesInicialesService.editarEvaluacionInicial({
      id: Number(evaluacion.id),
      empleadoId: Number(fisioId)
    }).subscribe({
      next: () => {
        this.modalReasignar.set(false);
        this.evaluacionReasignar.set(null);
        this.cargarEvaluaciones();
      },
    });
  }

  cerrarModalCrear(): void {
    this.modalCrear.set(false);
    this.pacientesBuscados.set([]);
  }

  buscarPaciente(termino: string): void {
    if (!termino || termino.length < 2) { this.pacientesBuscados.set([]); return; }
    this.buscandoPaciente.set(true);
    this.pacientesService.buscarPacientes(termino).subscribe({
      next: d => { this.pacientesBuscados.set(d); this.buscandoPaciente.set(false); },
      error: () => this.buscandoPaciente.set(false),
    });
  }

  crearEvaluacion(datos: any): void {
    this.evaluacionesInicialesService.crearEvaluacionInicial(datos).subscribe({
      next: () => { 
        this.cerrarModalCrear(); 
        this.cargarEvaluaciones(); 
      },
    });
  }

  eliminarEvaluacion(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.evaluacionesInicialesService.eliminarEvaluacionInicial(id).subscribe({
      next: () => this.cargarEvaluaciones(),
    });
  }
}
