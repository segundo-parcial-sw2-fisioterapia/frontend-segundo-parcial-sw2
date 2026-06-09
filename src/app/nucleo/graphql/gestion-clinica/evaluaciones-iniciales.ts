import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class EvaluacionesInicialesService {
  private gql = inject(GraphQLService);

  /** Lista todas las evaluaciones iniciales */
  listarEvaluacionesIniciales(): Observable<any[]> {
    return this.gql
      .query<{ listarEvaluacionesIniciales: any[] }>(`
        query {
          listarEvaluacionesIniciales {
            id categoria_enfermedad categoria_semaforo categoria_trabajo
            descripcion_enfermedad fecha_evaluacion nivel
            observaciones justificacion_semaforo empleado_id
            tiempo_sesion_minutos estado
            paciente { id persona { nombre apellido } }
          }
        }
      `)
      .pipe(map((d) => d.listarEvaluacionesIniciales));
  }

  /** Obtiene el detalle de una evaluación inicial por ID */
  verEvaluacionInicial(id: number): Observable<any> {
    return this.gql
      .query<{ verEvaluacionInicial: any }>(
        `query($id: Int!) {
          verEvaluacionInicial(id: $id) {
            id categoria_enfermedad categoria_semaforo nivel
            fecha_evaluacion descripcion_enfermedad
            justificacion_semaforo observaciones empleado_id categoria_trabajo
            tiempo_sesion_minutos estado
            paciente { id persona { nombre apellido } }
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verEvaluacionInicial));
  }

  /** Lista evaluaciones iniciales de un paciente específico */
  listarEvaluacionesPorPaciente(pacienteId: number): Observable<any[]> {
    return this.gql
      .query<{ listarEvaluacionesPorPaciente: any[] }>(
        `query($pacienteId: Int!) {
          listarEvaluacionesPorPaciente(pacienteId: $pacienteId) {
            id categoria_enfermedad categoria_semaforo
            nivel fecha_evaluacion estado
          }
        }`,
        { pacienteId }
      )
      .pipe(map((d) => d.listarEvaluacionesPorPaciente));
  }

  /** Registra una nueva evaluación inicial para un paciente */
  crearEvaluacionInicial(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearEvaluacionesIniciales: any }>(
        `mutation($datos: CreateEvaluacionesInnicialeInput!) {
          crearEvaluacionesIniciales(datos: $datos) {
            id categoria_enfermedad categoria_semaforo nivel estado
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearEvaluacionesIniciales));
  }

  /** Actualiza los datos de una evaluación inicial existente */
  editarEvaluacionInicial(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarEvaluacionInicial: any }>(
        `mutation($datos: UpdateEvaluacionesInnicialeInput!) {
          editarEvaluacionInicial(datos: $datos) {
            id categoria_semaforo nivel categoria_trabajo estado
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarEvaluacionInicial));
  }

  /** Elimina permanentemente una evaluación inicial */
  eliminarEvaluacionInicial(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarEvaluacionInicial: any }>(
        `mutation($id: Int!) {
          eliminarEvaluacionInicial(id: $id) { id categoria_enfermedad }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarEvaluacionInicial));
  }
}
