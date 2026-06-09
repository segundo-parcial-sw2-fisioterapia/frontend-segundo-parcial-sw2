import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class PlanesTratamientosService {
  private gql = inject(GraphQLService);

  /** Lista todos los planes de tratamiento */
  listarPlanesTratamientos(): Observable<any[]> {
    return this.gql
      .query<{ listarPlanesTratamientos: any[] }>(`
        query {
          listarPlanesTratamientos {
            id fecha_inicio estado
            duracion_meses_estimada numero_sesiones_mes
            objetivo_terapeutico observaciones tarifa_id
            evaluacion_inicial { id paciente { persona { nombre apellido } } }
          }
        }
      `)
      .pipe(map((d) => d.listarPlanesTratamientos.map((p: any) => ({
        ...p,
        paciente: p.evaluacion_inicial?.paciente
      }))));
  }

  /** Obtiene el detalle de un plan de tratamiento por ID */
  verPlanTratamiento(id: number): Observable<any> {
    return this.gql
      .query<{ verPlanTratamiento: any }>(
        `query($id: Int!) {
          verPlanTratamiento(id: $id) {
            id fecha_inicio estado
            duracion_meses_estimada numero_sesiones_mes
            objetivo_terapeutico observaciones tarifa_id
            evaluacion_inicial { id paciente { persona { nombre apellido } } categoria_enfermedad }
          }
        }`,
        { id }
      )
      .pipe(map((d) => {
        const p = d.verPlanTratamiento;
        if (!p) return null;
        return {
          ...p,
          paciente: p.evaluacion_inicial?.paciente
        };
      }));
  }

  /** Lista los planes de tratamiento de un paciente específico */
  listarPlanesPorPaciente(pacienteId: number): Observable<any[]> {
    return this.gql
      .query<{ listarPlanesPorPaciente: any[] }>(
        `query($pacienteId: Int!) {
          listarPlanesPorPaciente(pacienteId: $pacienteId) {
            id estado fecha_inicio duracion_meses_estimada objetivo_terapeutico
          }
        }`,
        { pacienteId }
      )
      .pipe(map((d) => d.listarPlanesPorPaciente));
  }

  /** Registra un nuevo plan de tratamiento */
  crearPlanTratamiento(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearPlanesTratamientos: any }>(
        `mutation($datos: CreatePlanesTratamientoInput!) {
          crearPlanesTratamientos(datos: $datos) {
            id estado fecha_inicio objetivo_terapeutico
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearPlanesTratamientos));
  }

  /** Actualiza los datos de un plan de tratamiento existente */
  editarPlanTratamiento(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarPlanTratamiento: any }>(
        `mutation($datos: UpdatePlanesTratamientoInput!) {
          editarPlanTratamiento(datos: $datos) { id estado }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarPlanTratamiento));
  }

  /** Elimina permanentemente un plan de tratamiento */
  eliminarPlanTratamiento(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarPlanTratamiento: any }>(
        `mutation($id: Int!) {
          eliminarPlanTratamiento(id: $id) { id estado }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarPlanTratamiento));
  }
}
