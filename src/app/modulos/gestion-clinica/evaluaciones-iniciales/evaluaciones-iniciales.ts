import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { EvaluacionesInicialesService } from '../../../nucleo/graphql/gestion-clinica/evaluaciones-iniciales';
import { PacientesService } from '../../../nucleo/graphql/gestion-clinica/pacientes';
import { LoginService } from '../../../nucleo/rest/login.service';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearEvaluacionesIniciales } from './crear-evaluaciones-iniciales/crear-evaluaciones-iniciales';
import { VerEvaluacionesIniciales } from './ver-evaluaciones-iniciales/ver-evaluaciones-iniciales';

@Component({
  selector: 'app-evaluaciones-iniciales',
  imports: [Tabla, Modal, CrearEvaluacionesIniciales, VerEvaluacionesIniciales],
  templateUrl: './evaluaciones-iniciales.html',
  styleUrl: './evaluaciones-iniciales.css',
})
export class EvaluacionesIniciales implements OnInit {
  private evaluacionesInicialesService = inject(EvaluacionesInicialesService);
  private pacientesService = inject(PacientesService);
  private loginService = inject(LoginService);
  private router = inject(Router);

  evaluaciones = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  evaluacionSeleccionada = signal<any | null>(null);
  pacientesBuscados = signal<any[]>([]);
  buscandoPaciente = signal(false);

  evaluacionesHoy = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return this.evaluaciones().filter((e) => e.fecha_evaluacion.startsWith(hoy)).length;
  });

  columnas: ColumnaTabla[] = [
    { key: 'paciente.persona.nombre', titulo: 'Paciente' },
    { key: 'fecha_evaluacion', titulo: 'Fecha y Hora', tipo: 'fecha-hora' },
    { key: 'categoria_enfermedad', titulo: 'Enfermedad' },
    { key: 'categoria_semaforo', titulo: 'Semáforo' },
    { key: 'nivel', titulo: 'Nivel' },
  ];

  ngOnInit(): void { this.cargarEvaluaciones(); }

  /**
   * Carga las evaluaciones del usuario autenticado.
   * El filtrado por rol y asignación de empleado se realiza enteramente en el backend.
   */
  cargarEvaluaciones(): void {
    this.cargando.set(true);
    this.evaluacionesInicialesService.listarEvaluacionesIniciales().subscribe({
      next: (data) => {
        this.evaluaciones.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(item: any): void { this.router.navigate(['/app/evaluaciones-iniciales/editar', item.id]); }
  abrirVer(item: any): void { this.evaluacionSeleccionada.set(item); this.modalVer.set(true); }

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


  /** Crea una nueva evaluación inicial */
  crearEvaluacion(datos: any): void {
    this.evaluacionesInicialesService.crearEvaluacionInicial(datos).subscribe({
      next: () => { this.cerrarModalCrear(); this.cargarEvaluaciones(); },
    });
  }

  /** Actualiza una evaluación inicial existente */
  editarEvaluacion(datos: any): void {
    this.evaluacionesInicialesService.editarEvaluacionInicial(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarEvaluaciones(); },
    });
  }

  /** Elimina una evaluación inicial tras confirmación */
  eliminarEvaluacion(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.evaluacionesInicialesService.eliminarEvaluacionInicial(id).subscribe({
      next: () => this.cargarEvaluaciones(),
    });
  }
}
