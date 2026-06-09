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
}
