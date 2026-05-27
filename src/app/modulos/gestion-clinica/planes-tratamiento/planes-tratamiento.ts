import { Component, inject, OnInit, signal } from '@angular/core';
import { PlanesTratamientosService } from '../../../nucleo/graphql/gestion-clinica/planes-tratamientos';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearPlanesTratamiento } from './crear-planes-tratamiento/crear-planes-tratamiento';
import { EditarPlanesTratamiento } from './editar-planes-tratamiento/editar-planes-tratamiento';
import { VerPlanesTratamiento } from './ver-planes-tratamiento/ver-planes-tratamiento';

@Component({
  selector: 'app-planes-tratamiento',
  imports: [Tabla, Modal, CrearPlanesTratamiento, EditarPlanesTratamiento, VerPlanesTratamiento],
  templateUrl: './planes-tratamiento.html',
  styleUrl: './planes-tratamiento.css',
})
export class PlanesTratamiento implements OnInit {
  private planesTratamientosService = inject(PlanesTratamientosService);

  planes = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  planSeleccionado = signal<any | null>(null);

  columnas: ColumnaTabla[] = [
    { key: 'paciente.persona.nombre', titulo: 'Paciente' },
    { key: 'estado', titulo: 'Estado' },
    { key: 'fecha_inicio', titulo: 'Fecha Inicio' },
    { key: 'fecha_fin_estimada', titulo: 'Fecha Fin Estimada' },
  ];

  ngOnInit(): void { this.cargarPlanes(); }

  /** Carga el listado completo de planes de tratamiento desde el backend */
  cargarPlanes(): void {
    this.cargando.set(true);
    this.planesTratamientosService.listarPlanesTratamientos().subscribe({
      next: d => { this.planes.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(item: any): void { this.planSeleccionado.set(item); this.modalEditar.set(true); }
  abrirVer(item: any): void { this.planSeleccionado.set(item); this.modalVer.set(true); }

  /** Crea un nuevo plan de tratamiento */
  crearPlan(datos: any): void {
    this.planesTratamientosService.crearPlanTratamiento(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarPlanes(); },
    });
  }

  /** Actualiza un plan de tratamiento existente */
  editarPlan(datos: any): void {
    this.planesTratamientosService.editarPlanTratamiento(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarPlanes(); },
    });
  }

  /** Elimina un plan de tratamiento tras confirmación */
  eliminarPlan(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.planesTratamientosService.eliminarPlanTratamiento(id).subscribe({
      next: () => this.cargarPlanes(),
    });
  }
}
