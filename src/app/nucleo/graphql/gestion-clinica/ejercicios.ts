import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class EjerciciosService {
  private gql = inject(GraphQLService);

  /** Lista todos los ejercicios del catálogo terapéutico */
  listarEjercicios(): Observable<any[]> {
    return this.gql
      .query<{ listarEjercicios: any[] }>(`
        query {
          listarEjercicios {
            id nombre descripcion categoria_trabajo nivel_dificultad
            duracion_segundos repeticiones_sugeridas url_video_referencia
          }
        }
      `)
      .pipe(map((d) => d.listarEjercicios));
  }

  /** Obtiene el detalle de un ejercicio por ID */
  verEjercicio(id: number): Observable<any> {
    return this.gql
      .query<{ verEjercicio: any }>(
        `query($id: Int!) {
          verEjercicio(id: $id) {
            id nombre descripcion categoria_trabajo nivel_dificultad
            duracion_segundos repeticiones_sugeridas url_video_referencia
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verEjercicio));
  }

  /** Filtra ejercicios por categoría de zona corporal */
  listarEjerciciosPorCategoria(categoria: string): Observable<any[]> {
    return this.gql
      .query<{ listarEjerciciosPorCategoria: any[] }>(
        `query($categoria: CategoriaTrabajo!) {
          listarEjerciciosPorCategoria(categoria: $categoria) {
            id nombre nivel_dificultad duracion_segundos
          }
        }`,
        { categoria }
      )
      .pipe(map((d) => d.listarEjerciciosPorCategoria));
  }

  /** Registra un nuevo ejercicio en el catálogo */
  crearEjercicio(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearEjercicios: any }>(
        `mutation($datos: CreateEjercicioInput!) {
          crearEjercicios(datos: $datos) {
            id nombre categoria_trabajo nivel_dificultad
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearEjercicios));
  }

  /** Actualiza los datos de un ejercicio existente */
  editarEjercicio(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarEjercicio: any }>(
        `mutation($datos: UpdateEjercicioInput!) {
          editarEjercicio(datos: $datos) {
            id nombre nivel_dificultad
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarEjercicio));
  }

  /** Elimina permanentemente un ejercicio del catálogo */
  eliminarEjercicio(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarEjercicio: any }>(
        `mutation($id: Int!) {
          eliminarEjercicio(id: $id) { id nombre }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarEjercicio));
  }
}
