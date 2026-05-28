import { Component, inject, OnInit, signal } from '@angular/core';
import { PersonasService } from '../../../nucleo/graphql/gestion-clinica/persona';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearPersonas } from './crear-personas/crear-personas';
import { EditarPersonas } from './editar-personas/editar-personas';
import { VerPersonas } from './ver-personas/ver-personas';

@Component({
  selector: 'app-personas',
  imports: [Tabla, Modal, CrearPersonas, EditarPersonas, VerPersonas],
  templateUrl: './personas.html',
  styleUrl: './personas.css',
})
export class Personas implements OnInit {
  private personasService = inject(PersonasService);

  personas = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  personaSeleccionada = signal<any | null>(null);

  columnas: ColumnaTabla[] = [
    { key: 'nombre', titulo: 'Nombre' },
    { key: 'apellido', titulo: 'Apellido' },
    { key: 'ci', titulo: 'C.I.' },
    { key: 'telefono', titulo: 'Teléfono' },
    { key: 'email', titulo: 'Correo' },
  ];

  ngOnInit(): void {
    this.cargarPersonas();
  }

  /** Carga el listado completo de personas desde el backend */
  cargarPersonas(): void {
    this.cargando.set(true);
    this.personasService.listarPersonas().subscribe({
      next: (d: any[]) => { this.personas.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(persona: any): void { this.personaSeleccionada.set(persona); this.modalEditar.set(true); }
  abrirVer(persona: any): void { this.personaSeleccionada.set(persona); this.modalVer.set(true); }

  /** Crea una nueva persona y recarga el listado */
  crearPersona(datos: any): void {
    this.personasService.crearPersona(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarPersonas(); },
    });
  }

  /** Actualiza una persona existente */
  editarPersona(datos: any): void {
    this.personasService.editarPersona(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarPersonas(); },
    });
  }

  /** Elimina una persona tras confirmación del usuario */
  eliminarPersona(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.personasService.eliminarPersona(id).subscribe({
      next: () => this.cargarPersonas(),
    });
  }
}
