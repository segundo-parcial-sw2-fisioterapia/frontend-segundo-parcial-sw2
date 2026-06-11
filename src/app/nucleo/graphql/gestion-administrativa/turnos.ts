import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

const FRAGMENT_TURNO = `id empleadoId diaSemana horaInicio horaFin activo`;
const FRAGMENT_PAGINA = `paginaInfo { totalElementos totalPaginas paginaActual tamano primero ultimo }`;

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private gql = inject(GraphQLService);

  /** Lista turnos paginados. Solo administrador y director. */
  listarTurnos(pagina = 0, tamano = 20): Observable<any> {
    return this.gql
      .query<{ listarTurnos: any }>(
        `query($pagina: PaginaInput) {
          listarTurnos(pagina: $pagina) {
            contenido { ${FRAGMENT_TURNO} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarTurnos));
  }

  /** Obtiene el detalle de un turno por ID. */
  verTurno(id: string): Observable<any> {
    return this.gql
      .query<{ verTurno: any }>(
        `query($id: ID!) { verTurno(id: $id) { ${FRAGMENT_TURNO} } }`,
        { id },
      )
      .pipe(map((d) => d.verTurno));
  }

  /**
   * Lista los turnos asignados a un empleado específico.
   * Usado por fisioterapeuta y recepcionista para ver su propio horario.
   */
  listarTurnosPorEmpleado(empleadoId: string): Observable<any[]> {
    return this.gql
      .query<{ listarTurnosPorEmpleado: any[] }>(
        `query($empleadoId: ID!) {
          listarTurnosPorEmpleado(empleadoId: $empleadoId) { ${FRAGMENT_TURNO} }
        }`,
        { empleadoId },
      )
      .pipe(map((d) => d.listarTurnosPorEmpleado));
  }

  /** Registra un nuevo turno para un empleado. Solo administrador. */
  crearTurno(input: any): Observable<any> {
    return this.gql
      .mutate<{ crearTurnos: any }>(
        `mutation($input: CrearTurnoInput!) {
          crearTurnos(input: $input) { ${FRAGMENT_TURNO} }
        }`,
        { input },
      )
      .pipe(map((d) => d.crearTurnos));
  }

  /** Actualiza los datos de un turno existente. Solo administrador. */
  editarTurno(id: string, input: any): Observable<any> {
    return this.gql
      .mutate<{ editarTurno: any }>(
        `mutation($id: ID!, $input: EditarTurnoInput!) {
          editarTurno(id: $id, input: $input) { ${FRAGMENT_TURNO} }
        }`,
        { id, input },
      )
      .pipe(map((d) => d.editarTurno));
  }

  /** Elimina un turno permanentemente. Solo administrador. */
  eliminarTurno(id: string): Observable<boolean> {
    return this.gql
      .mutate<{ eliminarTurno: boolean }>(
        `mutation($id: ID!) { eliminarTurno(id: $id) }`,
        { id },
      )
      .pipe(map((d) => d.eliminarTurno));
  }
}
