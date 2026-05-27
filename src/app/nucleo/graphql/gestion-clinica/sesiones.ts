import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private gql = inject(GraphQLService);

  /** Lista todas las sesiones clínicas */
  listarSesiones(): Observable<any[]> {
    return this.gql
      .query<{ listarSesiones: any[] }>(`
        query {
          listarSesiones {
            id fecha_hora_inicio fecha_hora_fin estado_sesion
            nivel_dolor_reportado nivel_dolor_post
            observaciones_clinicas hash_blockchain
            url_documento_firmado empleado_id
            paciente { id persona { nombre apellido } }
            cita { id fecha_hora }
          }
        }
      `)
      .pipe(map((d) => d.listarSesiones));
  }

  /** Obtiene el detalle de una sesión clínica por ID */
  verSesion(id: number): Observable<any> {
    return this.gql
      .query<{ verSesion: any }>(
        `query($id: Int!) {
          verSesion(id: $id) {
            id fecha_hora_inicio fecha_hora_fin estado_sesion
            nivel_dolor_reportado nivel_dolor_post
            observaciones_clinicas hash_blockchain url_documento_firmado
            paciente { persona { nombre apellido } }
            cita { id fecha_hora }
          }
        }`,
        { id }
      )
      .pipe(map((d) => d.verSesion));
  }

  /** Lista las sesiones clínicas de un paciente específico */
  listarSesionesPorPaciente(pacienteId: number): Observable<any[]> {
    return this.gql
      .query<{ listarSesionesPorPaciente: any[] }>(
        `query($pacienteId: Int!) {
          listarSesionesPorPaciente(pacienteId: $pacienteId) {
            id fecha_hora_inicio estado_sesion
            nivel_dolor_reportado nivel_dolor_post
          }
        }`,
        { pacienteId }
      )
      .pipe(map((d) => d.listarSesionesPorPaciente));
  }

  /** Registra una nueva sesión clínica */
  crearSesion(datos: any): Observable<any> {
    return this.gql
      .mutate<{ crearSesiones: any }>(
        `mutation($datos: CreateSesionInput!) {
          crearSesiones(datos: $datos) {
            id estado_sesion fecha_hora_inicio
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.crearSesiones));
  }

  /** Actualiza los datos de una sesión clínica existente */
  editarSesion(datos: any): Observable<any> {
    return this.gql
      .mutate<{ editarSesion: any }>(
        `mutation($datos: UpdateSesionInput!) {
          editarSesion(datos: $datos) {
            id estado_sesion nivel_dolor_post fecha_hora_fin
          }
        }`,
        { datos }
      )
      .pipe(map((d) => d.editarSesion));
  }

  /** Cierra y firma digitalmente una sesión clínica con hash blockchain */
  cerrarYFirmarSesion(id: number, hashBlockchain: string, urlDocumento: string): Observable<any> {
    return this.gql
      .mutate<{ cerrarYFirmarSesion: any }>(
        `mutation($id: Int!, $hashBlockchain: String!, $urlDocumento: String!) {
          cerrarYFirmarSesion(id: $id, hashBlockchain: $hashBlockchain, urlDocumento: $urlDocumento) {
            id estado_sesion hash_blockchain url_documento_firmado
          }
        }`,
        { id, hashBlockchain, urlDocumento }
      )
      .pipe(map((d) => d.cerrarYFirmarSesion));
  }

  /** Elimina permanentemente una sesión clínica */
  eliminarSesion(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarSesion: any }>(
        `mutation($id: Int!) {
          eliminarSesion(id: $id) { id estado_sesion }
        }`,
        { id }
      )
      .pipe(map((d) => d.eliminarSesion));
  }
}
