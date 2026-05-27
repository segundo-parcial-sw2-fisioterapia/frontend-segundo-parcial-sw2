import { Component, inject, OnInit, signal } from '@angular/core';
import { UsuariosService } from '../../../nucleo/graphql/gestion-clinica/usuarios';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearUsuarios } from './crear-usuarios/crear-usuarios';
import { EditarUsuarios } from './editar-usuarios/editar-usuarios';
import { VerUsuarios } from './ver-usuarios/ver-usuarios';

@Component({
  selector: 'app-usuarios',
  imports: [Tabla, Modal, CrearUsuarios, EditarUsuarios, VerUsuarios],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private usuariosService = inject(UsuariosService);

  usuarios = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  usuarioSeleccionado = signal<any | null>(null);

  columnas: ColumnaTabla[] = [
    { key: 'correo', titulo: 'Correo' },
    { key: 'estado', titulo: 'Estado' },
    { key: 'ultimo_acceso', titulo: 'Último Acceso' },
  ];

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  /** Carga el listado completo de usuarios desde el backend */
  cargarUsuarios(): void {
    this.cargando.set(true);
    this.usuariosService.listarUsuarios().subscribe({
      next: (d: any[]) => { this.usuarios.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(usuario: any): void { this.usuarioSeleccionado.set(usuario); this.modalEditar.set(true); }
  abrirVer(usuario: any): void { this.usuarioSeleccionado.set(usuario); this.modalVer.set(true); }

  /** Crea un nuevo usuario y recarga el listado */
  crearUsuario(datos: any): void {
    this.usuariosService.crearUsuario(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarUsuarios(); },
    });
  }

  /** Actualiza un usuario existente */
  editarUsuario(datos: any): void {
    this.usuariosService.editarUsuario(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarUsuarios(); },
    });
  }

  /** Elimina un usuario tras confirmación del usuario */
  eliminarUsuario(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.usuariosService.eliminarUsuario(id).subscribe({
      next: () => this.cargarUsuarios(),
    });
  }
}
