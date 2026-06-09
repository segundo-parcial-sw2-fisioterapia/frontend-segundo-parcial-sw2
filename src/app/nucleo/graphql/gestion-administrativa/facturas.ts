import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

const FRAGMENT_PAGINA = `paginaInfo { totalElementos totalPaginas paginaActual tamano primero ultimo }`;

/** Campos básicos de una factura (sin enriquecimiento). */
const FRAGMENT_FACTURA = `id pacienteId numeroFactura fechaEmision montoTotal estado concepto mensualidadId empleadoId metodoPago urlDocumento hashBlockchain txBlockchain fechaRegistroBlockchain`;

/** Factura enriquecida: incluye datos del paciente (nombre, CI). */
const FRAGMENT_FACTURA_ENRIQUECIDA = `
  id pacienteId numeroFactura fechaEmision montoTotal estado concepto mensualidadId empleadoId metodoPago
  urlDocumento hashBlockchain txBlockchain fechaRegistroBlockchain fechaCreacion
  paciente { nombre apellido ci telefono }
  empleado { id cargo especialidad persona { nombre apellido } }
`;

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private gql = inject(GraphQLService);

  /**
   * Lista facturas enriquecidas (con nombre del paciente) filtradas por mes y año.
   * El backend hace batch lookup de pacientesPorIds en el microservicio clinica.
   *
   * @param mes   Mes 1-12
   * @param anio  Año (ej: 2026)
   * @param pagina Número de página (0-indexed)
   * @param tamano Registros por página
   */
  listarFacturasEnriquecidas(mes: number, anio: number, pagina = 0, tamano = 20): Observable<any> {
    return this.gql
      .query<{ listarFacturasEnriquecidas: any }>(
        `query($mes: Int, $anio: Int, $pagina: PaginaInput) {
          listarFacturasEnriquecidas(mes: $mes, anio: $anio, pagina: $pagina) {
            contenido { ${FRAGMENT_FACTURA_ENRIQUECIDA} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { mes, anio, pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarFacturasEnriquecidas));
  }

  /** Lista facturas básicas paginadas (sin enriquecimiento). */
  listarFacturas(pagina = 0, tamano = 20): Observable<any> {
    return this.gql
      .query<{ listarFacturas: any }>(
        `query($pagina: PaginaInput) {
          listarFacturas(pagina: $pagina) {
            contenido { ${FRAGMENT_FACTURA} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarFacturas));
  }

  /** Obtiene el detalle enriquecido de una factura por ID. */
  verFacturaEnriquecida(id: number): Observable<any> {
    return this.gql
      .query<{ verFacturaEnriquecida: any }>(
        `query($id: ID!) {
          verFacturaEnriquecida(id: $id) { ${FRAGMENT_FACTURA_ENRIQUECIDA} }
        }`,
        { id: String(id) },
      )
      .pipe(map((d) => d.verFacturaEnriquecida));
  }

  /** Lista todas las facturas de un paciente específico. */
  listarFacturasPorPaciente(pacienteId: number): Observable<any[]> {
    return this.gql
      .query<{ listarFacturasPorPaciente: any[] }>(
        `query($pacienteId: ID!) {
          listarFacturasPorPaciente(pacienteId: $pacienteId) {
            id numeroFactura fechaEmision montoTotal estado concepto
          }
        }`,
        { pacienteId: String(pacienteId) },
      )
      .pipe(map((d) => d.listarFacturasPorPaciente));
  }

  /**
   * Genera el PDF de la factura y retorna el data URI base64.
   * El resultado se abre en una nueva pestaña para imprimir.
   */
  generarPdfFactura(id: number): Observable<string> {
    return this.gql
      .mutate<{ generarPdfFactura: string }>(
        `mutation($id: ID!) { generarPdfFactura(id: $id) }`,
        { id: String(id) },
      )
      .pipe(map((d) => d.generarPdfFactura));
  }

  /** Registra la factura en blockchain (MS-6). */
  registrarEnBlockchain(id: number): Observable<any> {
    return this.gql
      .mutate<{ registrarFacturaEnBlockchain: any }>(
        `mutation($id: ID!) {
          registrarFacturaEnBlockchain(id: $id) {
            id numeroFactura hashBlockchain txBlockchain fechaRegistroBlockchain
          }
        }`,
        { id: String(id) },
      )
      .pipe(map((d) => d.registrarFacturaEnBlockchain));
  }
}
