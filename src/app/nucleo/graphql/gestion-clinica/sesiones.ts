import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

const FRAGMENT_SESION_LISTA = `
  id numero_sesion mensualidad_id empleado_id
  fecha_hora_programada fecha_hora_inicio fecha_hora_fin
  estado_sesion nivel_dolor_reportado nivel_dolor_post
  observaciones_clinicas hash_blockchain url_documento_firmado
  plan_tratamiento {
    id
    evaluacion_inicial {
      id
      tiempo_sesion_minutos
      categoria_semaforo
      paciente {
        id
        persona { nombre apellido }
      }
    }
  }
`;

const FRAGMENT_SESION_DETALLE = `
  id numero_sesion mensualidad_id empleado_id
  fecha_hora_programada fecha_hora_inicio fecha_hora_fin
  estado_sesion nivel_dolor_reportado nivel_dolor_post
  observaciones_clinicas hash_blockchain url_documento_firmado
  plan_tratamiento {
    id objetivo_terapeutico duracion_meses_estimada numero_sesiones_mes
    evaluacion_inicial {
      id tiempo_sesion_minutos categoria_semaforo nivel
      fecha_evaluacion justificacion_semaforo
      paciente {
        id
        persona { nombre apellido ci telefono }
      }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private gql = inject(GraphQLService);

  /** Lista todas las sesiones clínicas (admin, director, recepcionista) */
  listarSesiones(): Observable<any[]> {
    return this.gql
      .query<{ listarSesiones: any[] }>(
        `query { listarSesiones { ${FRAGMENT_SESION_LISTA} } }`,
      )
      .pipe(map((d) => d.listarSesiones));
  }

  /** Lista las sesiones asignadas a un fisioterapeuta específico */
  listarSesionesPorEmpleado(empleadoId: number): Observable<any[]> {
    return this.gql
      .query<{ listarSesionesPorEmpleado: any[] }>(
        `query($empleadoId: Int!) {
          listarSesionesPorEmpleado(empleadoId: $empleadoId) { ${FRAGMENT_SESION_LISTA} }
        }`,
        { empleadoId: Number(empleadoId) },
      )
      .pipe(map((d) => d.listarSesionesPorEmpleado));
  }

  /** Obtiene el detalle completo de una sesión clínica por ID */
  verSesion(id: number): Observable<any> {
    return this.gql
      .query<{ verSesion: any }>(
        `query($id: Int!) {
          verSesion(id: $id) { ${FRAGMENT_SESION_DETALLE} }
        }`,
        { id: Number(id) },
      )
      .pipe(map((d) => d.verSesion));
  }

  /** Lista las sesiones clínicas de un paciente específico */
  listarSesionesPorPaciente(pacienteId: number): Observable<any[]> {
    return this.gql
      .query<{ listarSesionesPorPaciente: any[] }>(
        `query($pacienteId: Int!) {
          listarSesionesPorPaciente(pacienteId: $pacienteId) {
            id fecha_hora_inicio estado_sesion nivel_dolor_reportado nivel_dolor_post
          }
        }`,
        { pacienteId: Number(pacienteId) },
      )
      .pipe(map((d) => d.listarSesionesPorPaciente));
  }

  /** Registra una nueva sesión clínica */
  crearSesion(datos: any): Observable<any> {
    const cleaned = { ...datos };
    if (cleaned.planTratamientoId !== undefined && cleaned.planTratamientoId !== null) cleaned.planTratamientoId = Number(cleaned.planTratamientoId);
    if (cleaned.mensualidadId !== undefined && cleaned.mensualidadId !== null) cleaned.mensualidadId = Number(cleaned.mensualidadId);
    if (cleaned.numeroSesion !== undefined && cleaned.numeroSesion !== null) cleaned.numeroSesion = Number(cleaned.numeroSesion);
    if (cleaned.empleadoId !== undefined && cleaned.empleadoId !== null) cleaned.empleadoId = Number(cleaned.empleadoId);
    if (cleaned.nivel_dolor_reportado !== undefined && cleaned.nivel_dolor_reportado !== null) cleaned.nivel_dolor_reportado = Number(cleaned.nivel_dolor_reportado);
    if (cleaned.nivel_dolor_post !== undefined && cleaned.nivel_dolor_post !== null) cleaned.nivel_dolor_post = Number(cleaned.nivel_dolor_post);

    return this.gql
      .mutate<{ crearSesiones: any }>(
        `mutation($datos: CreateSesioneInput!) {
          crearSesiones(datos: $datos) { id estado_sesion fecha_hora_inicio }
        }`,
        { datos: cleaned },
      )
      .pipe(map((d) => d.crearSesiones));
  }

  /** Actualiza datos clínicos de una sesión (solo fisioterapeuta, rechaza sesiones cerradas) */
  editarSesion(datos: any): Observable<any> {
    const cleaned = { ...datos };
    if (cleaned.id !== undefined && cleaned.id !== null) cleaned.id = Number(cleaned.id);
    if (cleaned.planTratamientoId !== undefined && cleaned.planTratamientoId !== null) cleaned.planTratamientoId = Number(cleaned.planTratamientoId);
    if (cleaned.mensualidadId !== undefined && cleaned.mensualidadId !== null) cleaned.mensualidadId = Number(cleaned.mensualidadId);
    if (cleaned.numeroSesion !== undefined && cleaned.numeroSesion !== null) cleaned.numeroSesion = Number(cleaned.numeroSesion);
    if (cleaned.empleadoId !== undefined && cleaned.empleadoId !== null) cleaned.empleadoId = Number(cleaned.empleadoId);
    if (cleaned.nivel_dolor_reportado !== undefined && cleaned.nivel_dolor_reportado !== null) cleaned.nivel_dolor_reportado = Number(cleaned.nivel_dolor_reportado);
    if (cleaned.nivel_dolor_post !== undefined && cleaned.nivel_dolor_post !== null) cleaned.nivel_dolor_post = Number(cleaned.nivel_dolor_post);

    return this.gql
      .mutate<{ editarSesion: any }>(
        `mutation($datos: UpdateSesioneInput!) {
          editarSesion(datos: $datos) { id estado_sesion nivel_dolor_post fecha_hora_fin observaciones_clinicas }
        }`,
        { datos: cleaned },
      )
      .pipe(map((d) => d.editarSesion));
  }

  /** Asigna o reasigna un fisioterapeuta a una sesión (recepcionista / administrador) */
  asignarFisioterapeuta(id: number, empleadoId: number): Observable<any> {
    return this.gql
      .mutate<{ asignarFisioterapeuta: any }>(
        `mutation($id: Int!, $empleadoId: Int!) {
          asignarFisioterapeuta(id: $id, empleadoId: $empleadoId) { id empleado_id estado_sesion }
        }`,
        { id: Number(id), empleadoId: Number(empleadoId) },
      )
      .pipe(map((d) => d.asignarFisioterapeuta));
  }

  /** Inicia una sesión HABILITADA: cambia a ABIERTA y registra hora de inicio */
  iniciarSesion(id: number): Observable<any> {
    return this.gql
      .mutate<{ iniciarSesion: any }>(
        `mutation($id: Int!) {
          iniciarSesion(id: $id) { id estado_sesion fecha_hora_inicio }
        }`,
        { id: Number(id) },
      )
      .pipe(map((d) => d.iniciarSesion));
  }

  /** Cierra una sesión ABIERTA: cambia a CERRADA y registra hora de fin */
  cerrarSesion(id: number): Observable<any> {
    return this.gql
      .mutate<{ cerrarSesion: any }>(
        `mutation($id: Int!) {
          cerrarSesion(id: $id) { id estado_sesion fecha_hora_fin }
        }`,
        { id: Number(id) },
      )
      .pipe(map((d) => d.cerrarSesion));
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
        { id: Number(id), hashBlockchain, urlDocumento },
      )
      .pipe(map((d) => d.cerrarYFirmarSesion));
  }

  /** Elimina permanentemente una sesión clínica */
  eliminarSesion(id: number): Observable<any> {
    return this.gql
      .mutate<{ eliminarSesion: any }>(
        `mutation($id: Int!) { eliminarSesion(id: $id) { id estado_sesion } }`,
        { id: Number(id) },
      )
      .pipe(map((d) => d.eliminarSesion));
  }
}
