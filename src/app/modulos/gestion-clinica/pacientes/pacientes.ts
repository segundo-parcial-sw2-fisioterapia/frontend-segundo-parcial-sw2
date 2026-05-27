import { Component, inject, OnInit, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { PacientesService } from '../../../nucleo/graphql/gestion-clinica/pacientes';
import { PersonasService } from '../../../nucleo/graphql/gestion-clinica/persona';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearPacientes } from './crear-pacientes/crear-pacientes';
import { EditarPacientes } from './editar-pacientes/editar-pacientes';
import { VerPacientes } from './ver-pacientes/ver-pacientes';

@Component({
  selector: 'app-pacientes',
  imports: [Tabla, Modal, CrearPacientes, EditarPacientes, VerPacientes],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
})
export class Pacientes implements OnInit {
  private pacientesService = inject(PacientesService);
  private personasService = inject(PersonasService);

  pacientes = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  pacienteSeleccionado = signal<any | null>(null);

  personasBuscadas = signal<any[]>([]);
  buscandoPersonas = signal(false);

  columnas: ColumnaTabla[] = [
    { key: 'persona.nombre', titulo: 'Nombre' },
    { key: 'persona.apellido', titulo: 'Apellido' },
    { key: 'persona.ci', titulo: 'C.I.' },
    { key: 'estado', titulo: 'Estado' },
    { key: 'sexo', titulo: 'Sexo' },
  ];

  ngOnInit(): void {
    this.cargarPacientes();
  }

  /** Carga el listado completo de pacientes desde el backend */
  cargarPacientes(): void {
    this.cargando.set(true);
    this.pacientesService.listarPacientes().subscribe({
      next: (d: any[]) => { this.pacientes.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(paciente: any): void { this.pacienteSeleccionado.set(paciente); this.modalEditar.set(true); }
  abrirVer(paciente: any): void { this.pacienteSeleccionado.set(paciente); this.modalVer.set(true); }

  cerrarModalCrear(): void {
    this.modalCrear.set(false);
    this.personasBuscadas.set([]);
  }

  /** Busca personas por nombre o CI para el wizard de creación de paciente */
  buscarPersonas(termino: string): void {
    if (!termino || termino.length < 2) {
      this.personasBuscadas.set([]);
      return;
    }
    this.buscandoPersonas.set(true);
    this.personasService.buscarPersonas(termino).subscribe({
      next: (d: any[]) => { this.personasBuscadas.set(d); this.buscandoPersonas.set(false); },
      error: () => this.buscandoPersonas.set(false),
    });
  }

  /**
   * Crea un nuevo paciente. Si el wizard eligió una persona existente, llama
   * directamente a crearPaciente. Si eligió registrar una nueva persona,
   * primero la crea y luego vincula el paciente al ID recibido.
   */
  crearPaciente(datos: any): void {
    if (datos.tipo === 'nueva') {
      this.personasService.crearPersona(datos.persona).pipe(
        switchMap((persona: any) =>
          this.pacientesService.crearPaciente({
            personaId: persona.id,
            fecha_nacimiento: datos.fecha_nacimiento,
            sexo: datos.sexo,
            estado: datos.estado,
            direccion: datos.direccion,
          })
        ),
      ).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarPacientes(); },
      });
    } else {
      this.pacientesService.crearPaciente({
        personaId: datos.personaId,
        fecha_nacimiento: datos.fecha_nacimiento,
        sexo: datos.sexo,
        estado: datos.estado,
        direccion: datos.direccion,
      }).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarPacientes(); },
      });
    }
  }

  /** Actualiza un paciente existente */
  editarPaciente(datos: any): void {
    this.pacientesService.editarPaciente(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarPacientes(); },
    });
  }

  /** Elimina un paciente tras confirmación del usuario */
  eliminarPaciente(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.pacientesService.eliminarPaciente(id).subscribe({
      next: () => this.cargarPacientes(),
    });
  }
}
