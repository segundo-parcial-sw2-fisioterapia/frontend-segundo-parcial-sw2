import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private gql = inject(GraphQLService);

  /** Lista todos los pacientes registrados */
  listarPacientes(): Observable<any[]> {
    return this.gql
      .query<{ listarPacientes: any[] }>(`
        query {
          listarPacientes {
            id estado sexo fecha_nacimiento fecha_registro direccion
            persona { id nombre apellido ci telefono email }
          }
        }
      `)
      .pipe(map((d) => d.listarPacientes));
  }

  /** Obtiene el detalle de un paciente por ID */
  verPaciente(id: number): Observable<any> {
    return this.gql
      .query<{ verPaciente: any }>(
        `query($id: Int!) {
          verPaciente(id: $id) {
            id estado sexo fecha_nacimiento fecha_registro direccion
            persona { id nombre apellido ci telefono email }
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verPaciente));
  }

  /** Busca pacientes por nombre, apellido o CI */
  buscarPacientes(termino: string): Observable<any[]> {
    return this.gql
      .query<{ buscarPacientes: any[] }>(
        `query($termino: String!) {
          buscarPacientes(termino: $termino) {
            id estado persona { nombre apellido ci telefono email }
          }
        }`,
        { termino }
      )
      .pipe(map((d) => d.buscarPacientes));
  }

  /** Registra un nuevo paciente vinculado a una persona existente */
  crearPaciente(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearPacientes: any }>(
        `mutation($datos: CreatePacienteInput!) {
          crearPacientes(datos: $datos) {
            id estado sexo persona { nombre apellido email }
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearPacientes));
  }

  /** Actualiza los datos clínicos de un paciente */
  editarPaciente(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarPaciente: any }>(
        `mutation($datos: UpdatePacienteInput!) {
          editarPaciente(datos: $datos) { id estado direccion }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarPaciente));
  }

  /** Emite alta médica al paciente, cambiando su estado a ALTA_MEDICA */
  altaMedicaPaciente(id: number): Observable<any> {
    return this.gql
      .mutate<{ altaMedicaPaciente: any }>(
        `mutation($id: Int!) {
          altaMedicaPaciente(id: $id) { id estado persona { nombre } }
        }`,
        { id }
      )
      .pipe(map((d) => d.altaMedicaPaciente));
  }

  /** Elimina permanentemente un paciente del sistema */
  eliminarPaciente(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarPaciente: any }>(
        `mutation($id: Int!) {
          eliminarPaciente(id: $id) { id persona { nombre } }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarPaciente));
  }
}
