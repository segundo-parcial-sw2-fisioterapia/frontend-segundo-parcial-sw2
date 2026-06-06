import { Component, inject, OnInit, signal } from '@angular/core';
import { SesionesDomiciliariasService } from '../../../nucleo/graphql/gestion-clinica/sesiones-domiciliarias';
import { PacientesService } from '../../../nucleo/graphql/gestion-clinica/pacientes';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearSesionesDomiciliarias } from './crear-sesiones-domiciliarias/crear-sesiones-domiciliarias';
import { EditarSesionesDomiciliarias } from './editar-sesiones-domiciliarias/editar-sesiones-domiciliarias';
import { VerSesionesDomiciliarias } from './ver-sesiones-domiciliarias/ver-sesiones-domiciliarias';

@Component({
  selector: 'app-sesiones-domiciliarias',
  imports: [Tabla, Modal, CrearSesionesDomiciliarias, EditarSesionesDomiciliarias, VerSesionesDomiciliarias],
  templateUrl: './sesiones-domiciliarias.html',
  styleUrl: './sesiones-domiciliarias.css',
})
export class SesionesDomiciliarias implements OnInit {
  private sesionesDomiciliariasService = inject(SesionesDomiciliariasService);
  private pacientesService = inject(PacientesService);

  sesiones = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  sesionSeleccionada = signal<any | null>(null);
  pacientesBuscados = signal<any[]>([]);
  buscandoPaciente = signal(false);

  columnas: ColumnaTabla[] = [
    { key: 'paciente.persona.nombre', titulo: 'Paciente' },
    { key: 'plan_ejercicio.ejercicio.nombre', titulo: 'Ejercicio' },
    { key: 'fecha_hora', titulo: 'Fecha/Hora' },
    { key: 'puntuacion', titulo: 'Puntuación' },
    { key: 'xp_ganado', titulo: 'XP Ganado' },
  ];

  ngOnInit(): void { this.cargarSesiones(); }

  /** Carga el listado completo de sesiones domiciliarias desde el backend */
  cargarSesiones(): void {
    this.cargando.set(true);
    this.sesionesDomiciliariasService.listarSesionesDomiciliarias().subscribe({
      next: d => { this.sesiones.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(item: any): void { this.sesionSeleccionada.set(item); this.modalEditar.set(true); }
  abrirVer(item: any): void { this.sesionSeleccionada.set(item); this.modalVer.set(true); }

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

  /** Crea una nueva sesión domiciliaria */
  crearSesion(datos: any): void {
    this.sesionesDomiciliariasService.crearSesionDomiciliaria(datos).subscribe({
      next: () => { this.cerrarModalCrear(); this.cargarSesiones(); },
    });
  }

  /** Actualiza una sesión domiciliaria existente */
  editarSesion(datos: any): void {
    this.sesionesDomiciliariasService.editarSesionDomiciliaria(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarSesiones(); },
    });
  }

  /** Elimina una sesión domiciliaria tras confirmación */
  eliminarSesion(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.sesionesDomiciliariasService.eliminarSesionDomiciliaria(id).subscribe({
      next: () => this.cargarSesiones(),
    });
  }
}
