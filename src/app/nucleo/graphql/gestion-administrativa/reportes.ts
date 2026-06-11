import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

export interface IngresoMensual {
  mes: number;
  etiqueta: string;
  totalIngresos: number;
  totalFacturas: number;
}

export interface IngresoPorCategoria {
  categoria: string;
  total: number;
  cantidad: number;
}

export interface ResumenMensualidades {
  pagadas: number;
  pendientes: number;
  vencidas: number;
  montoPagado: number;
  montoPendiente: number;
}

export interface ReporteFinanciero {
  anio: number;
  totalIngresos: number;
  totalFacturas: number;
  ticketPromedio: number;
  ingresosPorMes: IngresoMensual[];
  ingresosPorMetodoPago: IngresoPorCategoria[];
  mensualidades: ResumenMensualidades;
}

// ─── Reportes dinámicos ─────────────────────────────────────────────────────────
export type MetricaReporte = 'CONTEO' | 'SUMA' | 'PROMEDIO';
export type TipoGrafico = 'BARRA' | 'LINEA' | 'PIE' | 'TABLA' | 'KPI';

export interface ReporteDinamicoInput {
  fuente: string;
  metrica: MetricaReporte;
  campoMetrica?: string | null;
  agruparPor: string;
  anio?: number | null;
  filtroCampo?: string | null;
  filtroValor?: string | null;
}

export interface FilaReporte {
  etiqueta: string;
  valor: number;
}

export interface ReporteDinamico {
  titulo: string;
  etiquetaDimension: string;
  etiquetaMetrica: string;
  filas: FilaReporte[];
  total: number;
  visualizacionSugerida: TipoGrafico;
}

export interface CampoMeta {
  campo: string;
  etiqueta: string;
}

export interface FuenteMeta {
  fuente: string;
  etiqueta: string;
  soportaAnio: boolean;
  dimensiones: CampoMeta[];
  numericos: CampoMeta[];
}

export interface CatalogoReportes {
  fuentes: FuenteMeta[];
}

export interface ReporteIA {
  prompt: string;
  interpretacion: ReporteDinamicoInput;
  resultado: ReporteDinamico;
  resumenNarrativo: string;
}

/**
 * Servicio de reportes del subsistema de gestión empresarial (Spring Boot · GraphQL).
 * Consume las queries de reporte federadas a través del gateway.
 */
@Injectable({ providedIn: 'root' })
export class ReportesAdminService {
  private gql = inject(GraphQLService);

  /**
   * Obtiene el reporte financiero anual: ingresos por mes, desglose por método de
   * pago, ticket promedio y estado de cobranza de mensualidades.
   *
   * @param anio Año a reportar. Si se omite, el backend usa el año actual.
   */
  reporteFinanciero(anio?: number): Observable<ReporteFinanciero> {
    return this.gql
      .query<{ reporteFinanciero: ReporteFinanciero }>(
        `query($anio: Int) {
          reporteFinanciero(anio: $anio) {
            anio totalIngresos totalFacturas ticketPromedio
            ingresosPorMes { mes etiqueta totalIngresos totalFacturas }
            ingresosPorMetodoPago { categoria total cantidad }
            mensualidades { pagadas pendientes vencidas montoPagado montoPendiente }
          }
        }`,
        { anio: anio ?? null },
      )
      .pipe(map((d) => d.reporteFinanciero));
  }

  /** Catálogo de fuentes/dimensiones/métricas para el constructor manual y la IA. */
  catalogoReportes(): Observable<CatalogoReportes> {
    return this.gql
      .query<{ catalogoReportes: CatalogoReportes }>(
        `query {
          catalogoReportes {
            fuentes {
              fuente etiqueta soportaAnio
              dimensiones { campo etiqueta }
              numericos { campo etiqueta }
            }
          }
        }`,
      )
      .pipe(map((d) => d.catalogoReportes));
  }

  /** Ejecuta un reporte dinámico parametrizable sobre datos reales. */
  reporteDinamico(input: ReporteDinamicoInput): Observable<ReporteDinamico> {
    return this.gql
      .query<{ reporteDinamico: ReporteDinamico }>(
        `query($input: ReporteDinamicoInput!) {
          reporteDinamico(input: $input) {
            titulo etiquetaDimension etiquetaMetrica total visualizacionSugerida
            filas { etiqueta valor }
          }
        }`,
        { input },
      )
      .pipe(map((d) => d.reporteDinamico));
  }

  /** Genera un reporte a partir de un prompt en lenguaje natural (OpenAI). */
  reportePorPrompt(prompt: string): Observable<ReporteIA> {
    return this.gql
      .query<{ reportePorPrompt: ReporteIA }>(
        `query($prompt: String!) {
          reportePorPrompt(prompt: $prompt) {
            prompt resumenNarrativo
            interpretacion { fuente metrica campoMetrica agruparPor anio filtroCampo filtroValor }
            resultado {
              titulo etiquetaDimension etiquetaMetrica total visualizacionSugerida
              filas { etiqueta valor }
            }
          }
        }`,
        { prompt },
      )
      .pipe(map((d) => d.reportePorPrompt));
  }
}
