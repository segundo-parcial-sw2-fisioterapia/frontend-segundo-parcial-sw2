import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

const FRAGMENT_ASISTENCIA = `id empleadoId fecha horaEntrada horaSalida estado`;
const FRAGMENT_PAGINA = `paginaInfo { totalElementos totalPaginas paginaActual tamano primero ultimo }`;

@Injectable({ providedIn: 'root' })
export class AsistenciasService {
  private gql = inject(GraphQLService);

  /** Lista asistencias paginadas. Solo administrador y director. */
  listarAsistencias(pagina = 0, tamano = 20): Observable<any> {
    return this.gql
      .query<{ listarAsistencias: any }>(
        `query($pagina: PaginaInput) {
          listarAsistencias(pagina: $pagina) {
            contenido { ${FRAGMENT_ASISTENCIA} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarAsistencias));
  }

  /** Obtiene el detalle de una asistencia por ID. */
  verAsistencia(id: string): Observable<any> {
    return this.gql
      .query<{ verAsistencia: any }>(
        `query($id: ID!) { verAsistencia(id: $id) { ${FRAGMENT_ASISTENCIA} } }`,
        { id },
      )
      .pipe(map((d) => d.verAsistencia));
  }

  /**
   * Lista asistencias de un empleado específico.
   * Usado por fisioterapeuta para ver su propio historial de asistencias.
   */
  listarAsistenciasPorEmpleado(empleadoId: string): Observable<any[]> {
    return this.gql
      .query<{ listarAsistenciasPorEmpleado: any[] }>(
        `query($empleadoId: ID!) {
          listarAsistenciasPorEmpleado(empleadoId: $empleadoId) { ${FRAGMENT_ASISTENCIA} }
        }`,
        { empleadoId },
      )
      .pipe(map((d) => d.listarAsistenciasPorEmpleado));
  }

  /** Registra la asistencia de un empleado. Recepcionista y administrador. */
  crearAsistencia(input: any): Observable<any> {
    return this.gql
      .mutate<{ crearAsistencias: any }>(
        `mutation($input: CrearAsistenciaInput!) {
          crearAsistencias(input: $input) { ${FRAGMENT_ASISTENCIA} }
        }`,
        { input },
      )
      .pipe(map((d) => d.crearAsistencias));
  }

  /** Actualiza una asistencia existente (hora salida, estado). Solo administrador. */
  editarAsistencia(id: string, input: any): Observable<any> {
    return this.gql
      .mutate<{ editarAsistencia: any }>(
        `mutation($id: ID!, $input: EditarAsistenciaInput!) {
          editarAsistencia(id: $id, input: $input) { ${FRAGMENT_ASISTENCIA} }
        }`,
        { id, input },
      )
      .pipe(map((d) => d.editarAsistencia));
  }

  /** Elimina una asistencia. Solo administrador. */
  eliminarAsistencia(id: string): Observable<boolean> {
    return this.gql
      .mutate<{ eliminarAsistencia: boolean }>(
        `mutation($id: ID!) { eliminarAsistencia(id: $id) }`,
        { id },
      )
      .pipe(map((d) => d.eliminarAsistencia));
  }
}
