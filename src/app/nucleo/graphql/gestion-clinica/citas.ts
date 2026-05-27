import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class CitasService {
  private gql = inject(GraphQLService);

  /** Lista todas las citas del sistema */
  listarCitas(): Observable<any[]> {
    return this.gql
      .query<{ listarCitas: any[] }>(`
        query {
          listarCitas {
            id fecha_hora estado tipo origen duracion_minutos
            observaciones empleado_id
            paciente { id persona { nombre apellido } }
          }
        }
      `)
      .pipe(map((d) => d.listarCitas));
  }

  /** Obtiene el detalle de una cita por ID */
  verCita(id: number): Observable<any> {
    return this.gql
      .query<{ verCita: any }>(
        `query($id: Int!) {
          verCita(id: $id) {
            id fecha_hora estado tipo origen empleado_id
            duracion_minutos observaciones
            paciente { persona { nombre apellido } }
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verCita));
  }

  /** Lista las citas de un paciente específico */
  listarCitasPorPaciente(pacienteId: number): Observable<any[]> {
    return this.gql
      .query<{ listarCitasPorPaciente: any[] }>(
        `query($pacienteId: Int!) {
          listarCitasPorPaciente(pacienteId: $pacienteId) {
            id fecha_hora estado tipo
          }
        }`,
        { pacienteId }
      )
      .pipe(map((d) => d.listarCitasPorPaciente));
  }

  /** Lista citas próximas dentro de un rango de horas */
  listarCitasProximas(horasAntelacion: number): Observable<any[]> {
    return this.gql
      .query<{ listarCitasProximas: any[] }>(
        `query($horasAntelacion: Int!) {
          listarCitasProximas(horasAntelacion: $horasAntelacion) {
            id fecha_hora estado
            paciente { persona { nombre telefono } }
          }
        }`,
        { horasAntelacion }
      )
      .pipe(map((d) => d.listarCitasProximas));
  }

  /** Registra una nueva cita en el sistema */
  crearCita(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearCitas: any }>(
        `mutation($datos: CreateCitaInput!) {
          crearCitas(datos: $datos) { id fecha_hora estado tipo }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearCitas));
  }

  /** Actualiza los datos de una cita existente */
  editarCita(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarCita: any }>(
        `mutation($datos: UpdateCitaInput!) {
          editarCita(datos: $datos) { id fecha_hora estado }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarCita));
  }

  /** Confirma una cita programada */
  confirmarCita(id: number): Observable<any> {
    return this.gql
      .mutate<{ confirmarCita: any }>(
        `mutation($id: Int!) {
          confirmarCita(id: $id) { id estado fecha_hora }
        }`,
        { id }
      )
      .pipe(map((d) => d.confirmarCita));
  }

  /** Cancela una cita activa */
  cancelarCita(id: number): Observable<any> {
    return this.gql
      .mutate<{ cancelarCita: any }>(
        `mutation($id: Int!) {
          cancelarCita(id: $id) { id estado fecha_hora }
        }`,
        { id }
      )
      .pipe(map((d) => d.cancelarCita));
  }

  /** Elimina permanentemente una cita del sistema */
  eliminarCita(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarCita: any }>(
        `mutation($id: Int!) {
          eliminarCita(id: $id) { id estado }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarCita));
  }
}
