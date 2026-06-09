import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

export interface Mensualidad {
  id: string;
  planTratamientoId: string;
  pacienteId: string;
  periodo: string;
  monto: number;
  estado: 'pendiente' | 'pagada' | 'vencida';
  fechaCreacion?: string;
}

export interface MensualidadEnriquecida extends Mensualidad {
  paciente?: { nombre?: string; apellido?: string; ci?: string; telefono?: string };
}

export interface FacturaEnriquecida {
  id: string;
  pacienteId: string;
  numeroFactura: string;
  fechaEmision: string;
  montoTotal: number;
  estado: string;
  mensualidadId?: string;
  concepto?: string;
  empleadoId?: string;
  metodoPago?: string;
  urlDocumento?: string;
  hashBlockchain?: string;
  txBlockchain?: string;
  fechaRegistroBlockchain?: string;
  fechaCreacion?: string;
  paciente?: { nombre?: string; apellido?: string; ci?: string };
  empleado?: { id: string; cargo: string; especialidad?: string; persona?: { nombre?: string; apellido?: string } };
}

export interface PagoRegistrado {
  mensualidad: Mensualidad;
  factura: FacturaEnriquecida;
}

export interface RegistrarPagoInput {
  mensualidadId: string;
  empleadoId?: string;
  metodoPago?: string;
}

const FRAGMENT_MENSUALIDAD = `id planTratamientoId pacienteId periodo monto estado fechaCreacion`;
const FRAGMENT_MENSUALIDAD_ENRIQUECIDA = `
  id planTratamientoId pacienteId periodo monto estado fechaCreacion
  paciente { nombre apellido ci telefono }
`;
const FRAGMENT_FACTURA_ENRIQUECIDA = `
  id pacienteId numeroFactura fechaEmision montoTotal estado mensualidadId
  concepto empleadoId metodoPago urlDocumento hashBlockchain txBlockchain
  fechaRegistroBlockchain fechaCreacion
  paciente { nombre apellido ci }
  empleado { id cargo especialidad persona { nombre apellido } }
`;
const FRAGMENT_PAGINA = `paginaInfo { totalElementos totalPaginas paginaActual tamano primero ultimo }`;

@Injectable({ providedIn: 'root' })
export class MensualidadesService {
  private gql = inject(GraphQLService);

  /**
   * Lista mensualidades paginadas (sin enriquecimiento).
   */
  listarMensualidades(pagina = 0, tamano = 20): Observable<any> {
    return this.gql
      .query<{ listarMensualidades: any }>(
        `query($pagina: PaginaInput) {
          listarMensualidades(pagina: $pagina) {
            contenido { ${FRAGMENT_MENSUALIDAD} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarMensualidades));
  }

  /**
   * Lista mensualidades enriquecidas con nombre/CI del paciente.
   * Soporta filtros de pacienteId y estado; ordenadas por período ascendente (próximas primero).
   *
   * @param pacienteId ID del paciente (null = sin filtro).
   * @param estado Estado de la mensualidad (null = todos).
   * @param pagina Número de página (0-indexed).
   * @param tamano Registros por página.
   */
  listarMensualidadesEnriquecidas(
    pacienteId: string | null,
    estado: string | null,
    pagina = 0,
    tamano = 20,
  ): Observable<{ contenido: MensualidadEnriquecida[]; paginaInfo: any }> {
    return this.gql
      .query<{ listarMensualidadesEnriquecidas: any }>(
        `query($pacienteId: ID, $estado: EstadoMensualidad, $pagina: PaginaInput) {
          listarMensualidadesEnriquecidas(pacienteId: $pacienteId, estado: $estado, pagina: $pagina) {
            contenido { ${FRAGMENT_MENSUALIDAD_ENRIQUECIDA} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { pacienteId: pacienteId ?? null, estado: estado ?? null, pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarMensualidadesEnriquecidas));
  }

  /** Obtiene el detalle de una mensualidad por ID. */
  verMensualidad(id: string): Observable<Mensualidad> {
    return this.gql
      .query<{ verMensualidad: Mensualidad }>(
        `query($id: ID!) { verMensualidad(id: $id) { ${FRAGMENT_MENSUALIDAD} } }`,
        { id },
      )
      .pipe(map((d) => d.verMensualidad));
  }

  /** Lista todas las mensualidades asociadas a un paciente. */
  listarMensualidadesPorPaciente(pacienteId: string): Observable<Mensualidad[]> {
    return this.gql
      .query<{ listarMensualidadesPorPaciente: Mensualidad[] }>(
        `query($pacienteId: ID!) {
          listarMensualidadesPorPaciente(pacienteId: $pacienteId) { ${FRAGMENT_MENSUALIDAD} }
        }`,
        { pacienteId },
      )
      .pipe(map((d) => d.listarMensualidadesPorPaciente));
  }

  /** Lista todas las mensualidades asociadas a un plan de tratamiento. */
  listarMensualidadesPorPlan(planId: string): Observable<Mensualidad[]> {
    return this.gql
      .query<{ listarMensualidadesPorPlan: Mensualidad[] }>(
        `query($planId: ID!) {
          listarMensualidadesPorPlan(planId: $planId) { ${FRAGMENT_MENSUALIDAD} }
        }`,
        { planId },
      )
      .pipe(map((d) => d.listarMensualidadesPorPlan));
  }

  /** Lista mensualidades en estado pendiente o vencido, ordenadas por período. */
  listarMensualidadesPendientes(): Observable<Mensualidad[]> {
    return this.gql
      .query<{ listarMensualidadesPendientes: Mensualidad[] }>(
        `query { listarMensualidadesPendientes { ${FRAGMENT_MENSUALIDAD} } }`,
      )
      .pipe(map((d) => d.listarMensualidadesPendientes));
  }

  /**
   * Registra el pago de una mensualidad.
   * Retorna PagoRegistrado con la mensualidad actualizada y la factura emitida enriquecida.
   */
  registrarPagoMensualidad(input: RegistrarPagoInput): Observable<PagoRegistrado> {
    return this.gql
      .mutate<{ registrarPagoMensualidad: PagoRegistrado }>(
        `mutation($input: RegistrarPagoMensualidadInput!) {
          registrarPagoMensualidad(input: $input) {
            mensualidad { ${FRAGMENT_MENSUALIDAD} }
            factura { ${FRAGMENT_FACTURA_ENRIQUECIDA} }
          }
        }`,
        { input },
      )
      .pipe(map((d) => d.registrarPagoMensualidad));
  }

  /** Crea una nueva mensualidad en estado pendiente. */
  crearMensualidades(input: any): Observable<Mensualidad> {
    return this.gql
      .mutate<{ crearMensualidades: Mensualidad }>(
        `mutation($input: CrearMensualidadInput!) {
          crearMensualidades(input: $input) { ${FRAGMENT_MENSUALIDAD} }
        }`,
        { input },
      )
      .pipe(map((d) => d.crearMensualidades));
  }
}
