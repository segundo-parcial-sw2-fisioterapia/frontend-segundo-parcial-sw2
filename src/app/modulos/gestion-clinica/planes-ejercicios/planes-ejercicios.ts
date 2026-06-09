import { Component, inject, OnInit, signal } from '@angular/core';
import { PlanesEjerciciosService } from '../../../nucleo/graphql/gestion-clinica/planes-ejercicios';
import { EjerciciosService } from '../../../nucleo/graphql/gestion-clinica/ejercicios';
import { PlanesTratamientosService } from '../../../nucleo/graphql/gestion-clinica/planes-tratamientos';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearPlanesEjercicios } from './crear-planes-ejercicios/crear-planes-ejercicios';
import { EditarPlanesEjercicios } from './editar-planes-ejercicios/editar-planes-ejercicios';
import { VerPlanesEjercicios } from './ver-planes-ejercicios/ver-planes-ejercicios';

@Component({
  selector: 'app-planes-ejercicios',
  imports: [Tabla, Modal, CrearPlanesEjercicios, EditarPlanesEjercicios, VerPlanesEjercicios],
  templateUrl: './planes-ejercicios.html',
  styleUrl: './planes-ejercicios.css',
})
export class PlanesEjercicios implements OnInit {
  private planesEjerciciosService = inject(PlanesEjerciciosService);
  private ejerciciosService = inject(EjerciciosService);
  private planesTratamientosService = inject(PlanesTratamientosService);

  planes = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  planSeleccionado = signal<any | null>(null);

  ejerciciosFiltrados = signal<any[]>([]);
  planesTratamientoFiltrados = signal<any[]>([]);
  private todosEjercicios: any[] = [];
  private todosPlanesTratamiento: any[] = [];

  columnas: ColumnaTabla[] = [
    { key: 'ejercicio.nombre', titulo: 'Ejercicio' },
    { key: 'frecuencia', titulo: 'Frecuencia' },
    { key: 'repeticiones', titulo: 'Repeticiones' },
    { key: 'series', titulo: 'Series' },
    { key: 'activo', titulo: 'Activo' },
  ];

  ngOnInit(): void { this.cargarPlanes(); }

  /** Carga el listado completo de planes de ejercicios desde el backend */
  cargarPlanes(): void {
    this.cargando.set(true);
    this.planesEjerciciosService.listarPlanesEjercicios().subscribe({
      next: d => { this.planes.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void {
    this.modalCrear.set(true);
    if (this.todosEjercicios.length === 0) {
      this.ejerciciosService.listarEjercicios().subscribe(d => { this.todosEjercicios = d; });
    }
    if (this.todosPlanesTratamiento.length === 0) {
      this.planesTratamientosService.listarPlanesTratamientos().subscribe(d => { this.todosPlanesTratamiento = d; });
    }
  }

  abrirEditar(item: any): void { this.planSeleccionado.set(item); this.modalEditar.set(true); }
  abrirVer(item: any): void { this.planSeleccionado.set(item); this.modalVer.set(true); }

  cerrarModalCrear(): void {
    this.modalCrear.set(false);
    this.ejerciciosFiltrados.set([]);
    this.planesTratamientoFiltrados.set([]);
  }

  buscarEjercicio(termino: string): void {
    if (!termino || termino.length < 2) { this.ejerciciosFiltrados.set([]); return; }
    const lower = termino.toLowerCase();
    this.ejerciciosFiltrados.set(
      this.todosEjercicios.filter(e => e.nombre?.toLowerCase().includes(lower))
    );
  }

  buscarPlanTratamiento(termino: string): void {
    if (!termino || termino.length < 2) { this.planesTratamientoFiltrados.set([]); return; }
    const lower = termino.toLowerCase();
    this.planesTratamientoFiltrados.set(
      this.todosPlanesTratamiento.filter(p => {
        const nombrePaciente = `${p.paciente?.persona?.nombre ?? ''} ${p.paciente?.persona?.apellido ?? ''}`.toLowerCase();
        const objetivo = p.objetivo_terapeutico?.toLowerCase() ?? '';
        return nombrePaciente.includes(lower) || objetivo.includes(lower);
      })
    );
  }

  /** Crea un nuevo plan de ejercicio */
  crearPlan(datos: any): void {
    this.planesEjerciciosService.crearPlanEjercicio(datos).subscribe({
      next: () => { this.cerrarModalCrear(); this.cargarPlanes(); },
    });
  }

  /** Actualiza un plan de ejercicio existente */
  editarPlan(datos: any): void {
    this.planesEjerciciosService.editarPlanEjercicio(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarPlanes(); },
    });
  }

  /** Elimina un plan de ejercicio tras confirmación */
  eliminarPlan(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.planesEjerciciosService.eliminarPlanEjercicio(id).subscribe({
      next: () => this.cargarPlanes(),
    });
  }
}
