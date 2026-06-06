import { Component, inject, OnInit, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { EmpleadosService } from '../../../nucleo/graphql/gestion-administrativa/empleados';
import { PersonasService } from '../../../nucleo/graphql/gestion-clinica/persona';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { Paginacion, PaginaInfo } from '../../../compartido/paginacion/paginacion';
import { CrearEmpleados } from './crear-empleados/crear-empleados';
import { EditarEmpleados } from './editar-empleados/editar-empleados';
import { VerEmpleados } from './ver-empleados/ver-empleados';

@Component({
  selector: 'app-empleados',
  imports: [Tabla, Modal, Paginacion, CrearEmpleados, EditarEmpleados, VerEmpleados],
  templateUrl: './empleados.html',
})
export class Empleados implements OnInit {
  private empleadosService = inject(EmpleadosService);
  private personasService = inject(PersonasService);

  empleados = signal<any[]>([]);
  cargando = signal(false);
  paginaInfo = signal<PaginaInfo | null>(null);
  paginaActual = signal(0);

  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  empleadoSeleccionado = signal<any | null>(null);

  personasBuscadas = signal<any[]>([]);
  buscandoPersonas = signal(false);

  columnas: ColumnaTabla[] = [
    { key: 'persona.nombre', titulo: 'Nombre' },
    { key: 'persona.apellido', titulo: 'Apellido' },
    { key: 'persona.ci', titulo: 'CI' },
    { key: 'cargo', titulo: 'Cargo' },
    { key: 'especialidad', titulo: 'Especialidad' },
    { key: 'tipoContrato', titulo: 'Contrato', tipo: 'enum' },
    { key: 'estadoLaboral', titulo: 'Estado', tipo: 'enum' },
  ];

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  /** Carga la página actual de empleados con datos de persona enriquecidos desde clinica. */
  cargarEmpleados(): void {
    this.cargando.set(true);
    this.empleadosService.listarEmpleados(this.paginaActual()).subscribe({
      next: (resultado: any) => {
        this.empleados.set(resultado.contenido);
        this.paginaInfo.set(resultado.paginaInfo);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Cambia a la página indicada y recarga el listado. */
  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    this.cargarEmpleados();
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(emp: any): void { this.empleadoSeleccionado.set(emp); this.modalEditar.set(true); }
  abrirVer(emp: any): void { this.empleadoSeleccionado.set(emp); this.modalVer.set(true); }

  cerrarModalCrear(): void {
    this.modalCrear.set(false);
    this.personasBuscadas.set([]);
  }

  /** Busca personas por nombre o CI en el microservicio clínico para el selector FK. */
  buscarPersonas(termino: string): void {
    if (!termino || termino.length < 2) { this.personasBuscadas.set([]); return; }
    this.buscandoPersonas.set(true);
    this.personasService.buscarPersonas(termino).subscribe({
      next: (d: any[]) => { this.personasBuscadas.set(d); this.buscandoPersonas.set(false); },
      error: () => this.buscandoPersonas.set(false),
    });
  }

  /** Registra un nuevo empleado y recarga el listado. */
  crearEmpleado(datos: any): void {
    if (datos.tipo === 'nueva') {
      this.personasService.crearPersona(datos.persona).pipe(
        switchMap((persona: any) =>
          this.empleadosService.crearEmpleado({
            personaId: Number(persona.id),
            cargo: datos.cargo,
            especialidad: datos.especialidad,
            salarioBase: datos.salarioBase,
            tipoContrato: datos.tipoContrato,
            fechaIngreso: datos.fechaIngreso,
          })
        ),
      ).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarEmpleados(); },
      });
    } else {
      this.empleadosService.crearEmpleado({
        personaId: Number(datos.personaId),
        cargo: datos.cargo,
        especialidad: datos.especialidad,
        salarioBase: datos.salarioBase,
        tipoContrato: datos.tipoContrato,
        fechaIngreso: datos.fechaIngreso,
      }).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarEmpleados(); },
      });
    }
  }

  /** Actualiza los datos laborales y personales de un empleado existente. */
  editarEmpleado(datos: any): void {
    this.personasService.editarPersona(datos.persona).pipe(
      switchMap(() =>
        this.empleadosService.editarEmpleado(datos.id, {
          cargo: datos.cargo,
          especialidad: datos.especialidad,
          salarioBase: datos.salarioBase,
          tipoContrato: datos.tipoContrato,
          fechaBaja: datos.fechaBaja,
          estadoLaboral: datos.estadoLaboral,
        })
      )
    ).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarEmpleados(); },
    });
  }

  /** Elimina un empleado tras confirmación del usuario. */
  eliminarEmpleado(id: number): void {
    if (!confirm('¿Desea eliminar este empleado?')) return;
    this.empleadosService.eliminarEmpleado(id).subscribe({
      next: () => this.cargarEmpleados(),
    });
  }
}
