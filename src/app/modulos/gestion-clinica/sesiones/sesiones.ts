import { Component, inject, OnInit, signal } from '@angular/core';
import { SesionesService } from '../../../nucleo/graphql/gestion-clinica/sesiones';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearSesiones } from './crear-sesiones/crear-sesiones';
import { EditarSesiones } from './editar-sesiones/editar-sesiones';
import { VerSesiones } from './ver-sesiones/ver-sesiones';

@Component({
  selector: 'app-sesiones',
  imports: [Tabla, Modal, CrearSesiones, EditarSesiones, VerSesiones],
  templateUrl: './sesiones.html',
  styleUrl: './sesiones.css',
})
export class Sesiones implements OnInit {
  private sesionesService = inject(SesionesService);

  sesiones = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  sesionSeleccionada = signal<any | null>(null);

  columnas: ColumnaTabla[] = [
    { key: 'paciente.persona.nombre', titulo: 'Paciente' },
    { key: 'fecha_hora_inicio', titulo: 'Fecha/Hora Inicio' },
    { key: 'estado_sesion', titulo: 'Estado' },
    { key: 'nivel_dolor_reportado', titulo: 'Dolor Reportado' },
  ];

  ngOnInit(): void { this.cargarSesiones(); }

  /** Carga el listado completo de sesiones desde el backend */
  cargarSesiones(): void {
    this.cargando.set(true);
    this.sesionesService.listarSesiones().subscribe({
      next: d => { this.sesiones.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(item: any): void { this.sesionSeleccionada.set(item); this.modalEditar.set(true); }
  abrirVer(item: any): void { this.sesionSeleccionada.set(item); this.modalVer.set(true); }

  /** Crea una nueva sesión clínica */
  crearSesion(datos: any): void {
    this.sesionesService.crearSesion(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarSesiones(); },
    });
  }

  /** Actualiza una sesión clínica existente */
  editarSesion(datos: any): void {
    this.sesionesService.editarSesion(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarSesiones(); },
    });
  }

  /** Elimina una sesión clínica tras confirmación */
  eliminarSesion(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.sesionesService.eliminarSesion(id).subscribe({
      next: () => this.cargarSesiones(),
    });
  }
}
