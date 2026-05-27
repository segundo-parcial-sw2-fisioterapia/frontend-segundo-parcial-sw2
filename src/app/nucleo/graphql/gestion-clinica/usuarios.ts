import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private gql = inject(GraphQLService);

  /** Lista todos los usuarios del sistema */
  listarUsuarios(): Observable<any[]> {
    return this.gql
      .query<{ listarUsuarios: any[] }>(`
        query {
          listarUsuarios {
            id correo estado roles fecha_creacion ultimo_acceso
            persona { id nombre apellido ci }
          }
        }
      `)
      .pipe(map((d) => d.listarUsuarios));
  }

  /** Obtiene el detalle de un usuario por ID */
  verUsuario(id: number): Observable<any> {
    return this.gql
      .query<{ verUsuario: any }>(
        `query($id: Int!) {
          verUsuario(id: $id) {
            id correo estado roles fecha_creacion ultimo_acceso
            persona { id nombre apellido ci }
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verUsuario));
  }

  /** Registra un nuevo usuario vinculado a una persona */
  crearUsuario(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearUsuarios: any }>(
        `mutation($datos: CreateUsuarioInput!) {
          crearUsuarios(datos: $datos) { id correo roles estado }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearUsuarios));
  }

  /** Actualiza correo, estado y roles de un usuario */
  editarUsuario(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarUsuario: any }>(
        `mutation($datos: UpdateUsuarioInput!) {
          editarUsuario(datos: $datos) { id correo estado roles }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarUsuario));
  }

  /** Cambia el estado del usuario a INACTIVO */
  inactivarUsuario(id: number): Observable<any> {
    return this.gql
      .mutate<{ inactivarUsuario: any }>(
        `mutation($id: Int!) {
          inactivarUsuario(id: $id) { id correo estado }
        }`,
        { id }
      )
      .pipe(map((d) => d.inactivarUsuario));
  }

  /** Elimina permanentemente un usuario del sistema */
  eliminarUsuario(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarUsuario: any }>(
        `mutation($id: Int!) {
          eliminarUsuario(id: $id) { id correo }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarUsuario));
  }
}
