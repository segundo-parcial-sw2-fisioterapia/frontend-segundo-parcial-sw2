import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class SesionesDomiciliariasService {
  private gql = inject(GraphQLService);

  /** Lista todas las sesiones domiciliarias */
  listarSesionesDomiciliarias(): Observable<any[]> {
    return this.gql
      .query<{ listarSesionesDomiciliarias: any[] }>(`
        query {
          listarSesionesDomiciliarias {
            id fecha_hora fecha_creacion
            correcciones_emitidas puntuacion
            repeticiones_completadas xp_ganado
            paciente { id persona { nombre apellido } }
            plan_ejercicio { id ejercicio { nombre nivel_dificultad } }
          }
        }
      `)
      .pipe(map((d) => d.listarSesionesDomiciliarias));
  }

  /** Obtiene el detalle de una sesión domiciliaria por ID */
  verSesionDomiciliaria(id: number): Observable<any> {
    return this.gql
      .query<{ verSesionDomiciliaria: any }>(
        `query($id: Int!) {
          verSesionDomiciliaria(id: $id) {
            id fecha_hora correcciones_emitidas
            puntuacion repeticiones_completadas xp_ganado
            paciente { persona { nombre apellido } }
            plan_ejercicio { ejercicio { nombre nivel_dificultad } }
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verSesionDomiciliaria));
  }

  /** Lista sesiones domiciliarias de un paciente específico */
  listarSesionesDomiciliariasPorPaciente(pacienteId: number): Observable<any[]> {
    return this.gql
      .query<{ listarSesionesDomiciliariasPorPaciente: any[] }>(
        `query($pacienteId: Int!) {
          listarSesionesDomiciliariasPorPaciente(pacienteId: $pacienteId) {
            id fecha_hora puntuacion xp_ganado
            repeticiones_completadas
            plan_ejercicio { ejercicio { nombre } }
          }
        }`,
        { pacienteId }
      )
      .pipe(map((d) => d.listarSesionesDomiciliariasPorPaciente));
  }

  /** Registra una nueva sesión domiciliaria */
  crearSesionDomiciliaria(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearSesionesDomiciliarias: any }>(
        `mutation($datos: CreateSesionesDocmiciliariaInput!) {
          crearSesionesDomiciliarias(datos: $datos) {
            id puntuacion xp_ganado repeticiones_completadas
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearSesionesDomiciliarias));
  }

  /** Actualiza los datos de una sesión domiciliaria (p. ej. análisis IA) */
  editarSesionDomiciliaria(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarSesionDomiciliaria: any }>(
        `mutation($datos: UpdateSesionesDocmiciliariaInput!) {
          editarSesionDomiciliaria(datos: $datos) {
            id correcciones_emitidas puntuacion xp_ganado
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarSesionDomiciliaria));
  }

  /** Elimina permanentemente una sesión domiciliaria */
  eliminarSesionDomiciliaria(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarSesionDomiciliaria: any }>(
        `mutation($id: Int!) {
          eliminarSesionDomiciliaria(id: $id) { id fecha_hora }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarSesionDomiciliaria));
  }
}
