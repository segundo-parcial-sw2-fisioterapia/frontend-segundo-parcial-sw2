import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class PlanesEjerciciosService {
  private gql = inject(GraphQLService);

  /** Lista todos los planes de ejercicios */
  listarPlanesEjercicios(): Observable<any[]> {
    return this.gql
      .query<{ listarPlanesEjercicios: any[] }>(`
        query {
          listarPlanesEjercicios {
            id activo frecuencia orden repeticiones series
            ejercicio { id nombre nivel_dificultad }
            plan_tratamiento { id objetivo_terapeutico }
          }
        }
      `)
      .pipe(map((d) => d.listarPlanesEjercicios));
  }

  /** Obtiene el detalle de un plan de ejercicio por ID */
  verPlanEjercicio(id: number): Observable<any> {
    return this.gql
      .query<{ verPlanEjercicio: any }>(
        `query($id: Int!) {
          verPlanEjercicio(id: $id) {
            id activo frecuencia orden repeticiones series
            ejercicio { nombre nivel_dificultad descripcion }
            plan_tratamiento { id objetivo_terapeutico }
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verPlanEjercicio));
  }

  /** Lista los ejercicios asignados a un plan de tratamiento */
  listarEjerciciosDePlan(planTratamientoId: number): Observable<any[]> {
    return this.gql
      .query<{ listarEjerciciosDePlan: any[] }>(
        `query($planTratamientoId: Int!) {
          listarEjerciciosDePlan(planTratamientoId: $planTratamientoId) {
            id activo frecuencia orden repeticiones series
            ejercicio { id nombre categoria_trabajo nivel_dificultad }
          }
        }`,
        { planTratamientoId }
      )
      .pipe(map((d) => d.listarEjerciciosDePlan));
  }

  /** Agrega un ejercicio a un plan de tratamiento */
  crearPlanEjercicio(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearPlanesEjercicios: any }>(
        `mutation($datos: CreatePlanesEjercicioInput!) {
          crearPlanesEjercicios(datos: $datos) {
            id frecuencia repeticiones series ejercicio { nombre }
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearPlanesEjercicios));
  }

  /** Actualiza los parámetros de un plan de ejercicio existente */
  editarPlanEjercicio(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarPlanEjercicio: any }>(
        `mutation($datos: UpdatePlanesEjercicioInput!) {
          editarPlanEjercicio(datos: $datos) {
            id frecuencia repeticiones series activo
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarPlanEjercicio));
  }

  /** Elimina un ejercicio de un plan de tratamiento */
  eliminarPlanEjercicio(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarPlanEjercicio: any }>(
        `mutation($id: Int!) {
          eliminarPlanEjercicio(id: $id) { id ejercicio { nombre } }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarPlanEjercicio));
  }
}
