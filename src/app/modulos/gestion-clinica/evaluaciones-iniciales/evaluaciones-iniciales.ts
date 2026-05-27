import { Component, inject, OnInit, signal } from '@angular/core';
import { EvaluacionesInicialesService } from '../../../nucleo/graphql/gestion-clinica/evaluaciones-iniciales';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearEvaluacionesIniciales } from './crear-evaluaciones-iniciales/crear-evaluaciones-iniciales';
import { EditarEvaluacionesIniciales } from './editar-evaluaciones-iniciales/editar-evaluaciones-iniciales';
import { VerEvaluacionesIniciales } from './ver-evaluaciones-iniciales/ver-evaluaciones-iniciales';

@Component({
  selector: 'app-evaluaciones-iniciales',
  imports: [Tabla, Modal, CrearEvaluacionesIniciales, EditarEvaluacionesIniciales, VerEvaluacionesIniciales],
  templateUrl: './evaluaciones-iniciales.html',
  styleUrl: './evaluaciones-iniciales.css',
})
export class EvaluacionesIniciales implements OnInit {
  private evaluacionesInicialesService = inject(EvaluacionesInicialesService);

  evaluaciones = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  evaluacionSeleccionada = signal<any | null>(null);

  columnas: ColumnaTabla[] = [
    { key: 'paciente.persona.nombre', titulo: 'Paciente' },
    { key: 'fecha_evaluacion', titulo: 'Fecha' },
    { key: 'categoria_enfermedad', titulo: 'Enfermedad' },
    { key: 'categoria_semaforo', titulo: 'Semáforo' },
    { key: 'es_vigente', titulo: 'Vigente' },
  ];

  ngOnInit(): void { this.cargarEvaluaciones(); }

  /** Carga el listado completo de evaluaciones iniciales desde el backend */
  cargarEvaluaciones(): void {
    this.cargando.set(true);
    this.evaluacionesInicialesService.listarEvaluacionesIniciales().subscribe({
      next: d => { this.evaluaciones.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(item: any): void { this.evaluacionSeleccionada.set(item); this.modalEditar.set(true); }
  abrirVer(item: any): void { this.evaluacionSeleccionada.set(item); this.modalVer.set(true); }

  /** Crea una nueva evaluación inicial */
  crearEvaluacion(datos: any): void {
    this.evaluacionesInicialesService.crearEvaluacionInicial(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarEvaluaciones(); },
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
