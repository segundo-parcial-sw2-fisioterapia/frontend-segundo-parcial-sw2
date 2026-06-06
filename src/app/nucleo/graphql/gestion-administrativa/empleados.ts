import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

const FRAGMENT_PAGINA = `paginaInfo { totalElementos totalPaginas paginaActual tamano primero ultimo }`;
const FRAGMENT_EMPLEADO = `id personaId cargo especialidad salarioBase tipoContrato fechaIngreso fechaBaja estadoLaboral persona { nombre apellido ci }`;

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  private gql = inject(GraphQLService);

  /**
   * Lista empleados paginados con datos de persona enriquecidos desde clinica.
   *
   * @param pagina Número de página (0-indexed). Por defecto 0.
   * @param tamano Registros por página. Por defecto 20.
   */
  listarEmpleados(pagina = 0, tamano = 20): Observable<any> {
    return this.gql
      .query<{ listarEmpleados: any }>(
        `query($pagina: PaginaInput) {
          listarEmpleados(pagina: $pagina) {
            contenido { ${FRAGMENT_EMPLEADO} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarEmpleados));
  }

  /** Obtiene el detalle completo de un empleado, con datos de persona desde clinica. */
  verEmpleado(id: number): Observable<any> {
    return this.gql
      .query<{ verEmpleado: any }>(
        `query($id: ID!) {
          verEmpleado(id: $id) { ${FRAGMENT_EMPLEADO} }
        }`,
        { id: String(id) },
      )
      .pipe(map((d) => d.verEmpleado));
  }

  /**
   * Busca empleados por cargo o especialidad.
   * Usado por el selector FK del frontend para enlazar empleadoId en otros módulos.
   */
  buscarEmpleados(termino: string): Observable<any[]> {
    return this.gql
      .query<{ buscarEmpleados: any[] }>(
        `query($termino: String!) {
          buscarEmpleados(termino: $termino) {
            id personaId cargo especialidad estadoLaboral persona { nombre apellido ci }
          }
        }`,
        { termino },
      )
      .pipe(map((d) => d.buscarEmpleados));
  }

  /** Registra un nuevo empleado referenciando su persona en el microservicio clínico. */
  crearEmpleado(input: any): Observable<any> {
    return this.gql
      .mutate<{ crearEmpleados: any }>(
        `mutation($input: CrearEmpleadoInput!) {
          crearEmpleados(input: $input) { id cargo especialidad estadoLaboral }
        }`,
        { input },
      )
      .pipe(map((d) => d.crearEmpleados));
  }

  /** Actualiza los datos laborales de un empleado existente. */
  editarEmpleado(id: number, input: any): Observable<any> {
    return this.gql
      .mutate<{ editarEmpleado: any }>(
        `mutation($id: ID!, $input: EditarEmpleadoInput!) {
          editarEmpleado(id: $id, input: $input) { id cargo especialidad estadoLaboral }
        }`,
        { id: String(id), input },
      )
      .pipe(map((d) => d.editarEmpleado));
  }

  /**
   * Lista todos los empleados con cargo o especialidad de fisioterapeuta.
   * Usado por el panel de carga de trabajo del recepcionista para asignación de sesiones.
   */
  listarFisioterapeutas(): Observable<any[]> {
    return this.buscarEmpleados('fisioterapeuta');
  }

  /**
   * Busca el empleado vinculado al personaId del usuario autenticado (obtenido del JWT).
   * Usado para auto-rellenar empleadoId en formularios de pago sin requerir selección manual.
   */
  verEmpleadoPorPersonaId(personaId: string): Observable<any> {
    return this.gql
      .query<{ verEmpleadoPorPersonaId: any }>(
        `query($personaId: ID!) {
          verEmpleadoPorPersonaId(personaId: $personaId) {
            id cargo especialidad estadoLaboral persona { nombre apellido }
          }
        }`,
        { personaId },
      )
      .pipe(map((d) => d.verEmpleadoPorPersonaId));
  }

  /** Elimina permanentemente un empleado del sistema. */
  eliminarEmpleado(id: number): Observable<boolean> {
    return this.gql
      .mutate<{ eliminarEmpleado: boolean }>(
        `mutation($id: ID!) { eliminarEmpleado(id: $id) }`,
        { id: String(id) },
      )
      .pipe(map((d) => d.eliminarEmpleado));
  }
}
