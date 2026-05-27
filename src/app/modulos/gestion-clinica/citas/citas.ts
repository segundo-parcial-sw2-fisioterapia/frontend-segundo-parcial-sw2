import { Component, inject, OnInit, signal } from '@angular/core';
import { CitasService } from '../../../nucleo/graphql/gestion-clinica/citas';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearCitas } from './crear-citas/crear-citas';
import { EditarCitas } from './editar-citas/editar-citas';
import { VerCitas } from './ver-citas/ver-citas';

@Component({
  selector: 'app-citas',
  imports: [Tabla, Modal, CrearCitas, EditarCitas, VerCitas],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class Citas implements OnInit {
  private citasService = inject(CitasService);

  citas = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  citaSeleccionada = signal<any | null>(null);

  columnas: ColumnaTabla[] = [
    { key: 'paciente.persona.nombre', titulo: 'Paciente' },
    { key: 'fecha_hora', titulo: 'Fecha y Hora' },
    { key: 'tipo', titulo: 'Tipo' },
    { key: 'estado', titulo: 'Estado' },
    { key: 'duracion_minutos', titulo: 'Duración (min)' },
  ];

  ngOnInit(): void {
    this.cargarCitas();
  }

  /** Carga el listado completo de citas desde el backend */
  cargarCitas(): void {
    this.cargando.set(true);
    this.citasService.listarCitas().subscribe({
      next: (d: any[]) => { this.citas.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(cita: any): void { this.citaSeleccionada.set(cita); this.modalEditar.set(true); }
  abrirVer(cita: any): void { this.citaSeleccionada.set(cita); this.modalVer.set(true); }

  /** Crea una nueva cita y recarga el listado */
  crearCita(datos: any): void {
    this.citasService.crearCita(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarCitas(); },
    });
  }

  /** Actualiza una cita existente */
  editarCita(datos: any): void {
    this.citasService.editarCita(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarCitas(); },
    });
  }

  /** Elimina una cita tras confirmación del usuario */
  eliminarCita(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.citasService.eliminarCita(id).subscribe({
      next: () => this.cargarCitas(),
    });
  }
}
