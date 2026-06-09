import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class PersonasService {
  private gql = inject(GraphQLService);

  /** Lista todas las personas registradas en el sistema */
  listarPersonas(): Observable<any[]> {
    return this.gql
      .query<{ listarPersonas: any[] }>(
        `
        query {
          listarPersonas { id nombre apellido ci telefono email }
        }
      `,
      )
      .pipe(map((d) => d.listarPersonas));
  }

  /** Obtiene el detalle de una persona por ID */
  verPersona(id: number): Observable<any> {
    return this.gql
      .query<{ verPersona: any }>(
        `query($id: Int!) {
          verPersona(id: $id) { id nombre apellido ci telefono email }
        }`,
        { id },
      )
      .pipe(map((d) => d.verPersona));
  }

  /** Busca personas por nombre, apellido o CI */
  buscarPersonas(termino: string): Observable<any[]> {
    return this.gql
      .query<{ buscarPersonas: any[] }>(
        `query($termino: String!) {
          buscarPersonas(termino: $termino) { id nombre apellido ci telefono email }
        }`,
        { termino },
      )
      .pipe(map((d) => d.buscarPersonas));
  }

  /** Registra una nueva persona en el sistema */
  crearPersona(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearPersonas: any }>(
        `mutation($datos: CreatePersonaInput!) {
          crearPersonas(datos: $datos) { id nombre apellido ci email }
        }`,
        { datos },
      )
      .pipe(map((d) => d.crearPersonas));
  }

  /** Actualiza los datos de una persona existente */
  editarPersona(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarPersona: any }>(
        `mutation($datos: UpdatePersonaInput!) {
          editarPersona(datos: $datos) { id nombre apellido telefono email }
        }`,
        { datos },
      )
      .pipe(map((d) => d.editarPersona));
  }

  /** Elimina permanentemente una persona del sistema */
  eliminarPersona(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarPersona: any }>(
        `mutation($id: Int!) {
          eliminarPersona(id: $id) { id nombre apellido }
        }`,
        { id },
      )
      .pipe(map((d) => d.eliminarPersona));
  }
}
