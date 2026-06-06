import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { UsuariosService } from '../../../nucleo/graphql/gestion-clinica/usuarios';
import { PersonasService } from '../../../nucleo/graphql/gestion-clinica/persona';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { KpiCard } from '../../../compartido/kpi-card/kpi-card';
import { CrearUsuarios } from './crear-usuarios/crear-usuarios';
import { EditarUsuarios } from './editar-usuarios/editar-usuarios';
import { VerUsuarios } from './ver-usuarios/ver-usuarios';

@Component({
  selector: 'app-usuarios',
  imports: [Tabla, Modal, KpiCard, CrearUsuarios, EditarUsuarios, VerUsuarios],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private usuariosService = inject(UsuariosService);
  private personasService = inject(PersonasService);

  usuarios = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  usuarioSeleccionado = signal<any | null>(null);
  personasBuscadas = signal<any[]>([]);
  buscandoPersonas = signal(false);

  // KPIs
  usuariosEmpleados = computed(() => {
    const list = this.usuarios();
    const staffRoles = ['administrador', 'contador', 'director', 'fisioterapeuta', 'recepcionista'];
    return list.filter(u => 
      u.roles?.some((r: string) => staffRoles.includes(r.toLowerCase()))
    ).length;
  });

  usuariosPacientes = computed(() => {
    const list = this.usuarios();
    return list.filter(u => 
      u.roles?.some((r: string) => r.toLowerCase() === 'paciente')
    ).length;
  });

  usuariosActivos = computed(() => {
    const list = this.usuarios();
    return list.filter(u => u.estado?.toUpperCase() === 'ACTIVO').length;
  });

  usuariosInactivos = computed(() => {
    const list = this.usuarios();
    return list.filter(u => u.estado?.toUpperCase() === 'INACTIVO').length;
  });

  usuariosSuspendidos = computed(() => {
    const list = this.usuarios();
    return list.filter(u => u.estado?.toUpperCase() === 'SUSPENDIDO').length;
  });

  columnas: ColumnaTabla[] = [
    { key: 'correo', titulo: 'Correo' },
    { key: 'roles', titulo: 'Roles' },
    { key: 'estado', titulo: 'Estado' },
    { key: 'ultimo_acceso', titulo: 'Último Acceso', tipo: 'fecha-hora' },
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

  cerrarModalCrear(): void {
    this.modalCrear.set(false);
    this.personasBuscadas.set([]);
  }

  /** Busca personas por nombre o CI para el selector del formulario */
  buscarPersonas(termino: string): void {
    if (!termino || termino.length < 2) { this.personasBuscadas.set([]); return; }
    this.buscandoPersonas.set(true);
    this.personasService.buscarPersonas(termino).subscribe({
      next: (d: any[]) => { this.personasBuscadas.set(d); this.buscandoPersonas.set(false); },
      error: () => this.buscandoPersonas.set(false),
    });
  }

  /** Crea un nuevo usuario y recarga el listado */
  crearUsuario(datos: any): void {
    this.usuariosService.crearUsuario(datos).subscribe({
      next: () => { this.cerrarModalCrear(); this.cargarUsuarios(); },
    });
  }

  /** Actualiza un usuario existente */
  editarUsuario(datos: any): void {
    this.usuariosService.editarUsuario(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarUsuarios(); },
    });
  }

  /** Elimina un usuario tras confirmación */
  eliminarUsuario(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.usuariosService.eliminarUsuario(id).subscribe({
      next: () => this.cargarUsuarios(),
    });
  }
}
