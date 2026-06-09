import { Injectable, inject } from '@angular/core';
import { GraphQLService } from '../graphql.service';
import { Observable } from 'rxjs';

export interface TiempoRecuperacionResultado {
  diasEstimados: number;
  confianza: number;
  disponible: boolean;
  mensaje: string;
}

export interface RiesgoAbandonoResultado {
  probabilidadAbandono: number;
  riesgo: string;
  disponible: boolean;
  mensaje: string;
}

export interface DashboardKpisResultado {
  tasaOcupacion: {
    datos: { zona: string; promedioSesiones: number; tasaOcupacionPct: number }[];
    promedioGlobal: number;
  };
  distribucionSemaforo: {
    verde: { cantidad: number; porcentaje: number };
    amarillo: { cantidad: number; porcentaje: number };
    rojo: { cantidad: number; porcentaje: number };
    total: number;
  };
  ingresos: {
    periodo: string;
    ingresosReales: number;
    proyeccion: number;
    variacionPct: number;
    totalFacturas: number;
  };
  sesionesPorEnfermedad: {
    datos: { enfermedad: string; promedioSesiones: number }[];
    promedioGlobal: number;
  };
  tasaAltaMedica: {
    tasaAltaMedicaPct: number;
    altaMedica: number;
    abandono: number;
    enCurso: number;
    total: number;
  };
  totalRegistros: number;
  periodo: string | null;
}

export interface EventoRegistrado {
  id: string;
  tipoEvento: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiGraphQLService {
  private gql = inject(GraphQLService);

  predecirTiempoRecuperacion(
    categoriaSemaforo: string,
    diagnostico: string,
    edad: number
  ): Observable<{ predecirTiempoRecuperacion: TiempoRecuperacionResultado }> {
    const query = `
      query PredecirTiempoRecuperacion($categoriaSemaforo: String!, $diagnostico: String!, $edad: Int!) {
        predecirTiempoRecuperacion(
          categoriaSemaforo: $categoriaSemaforo
          diagnostico: $diagnostico
          edad: $edad
        ) {
          diasEstimados
          confianza
          disponible
          mensaje
        }
      }
    `;
    return this.gql.query(query, { categoriaSemaforo, diagnostico, edad });
  }

  predecirRiesgoAbandono(
    sesionesAsistidas: number,
    sesionesTotales: number,
    puntuacionPromedioDolor: number,
    categoriaSemaforo: string
  ): Observable<{ predecirRiesgoAbandono: RiesgoAbandonoResultado }> {
    const query = `
      query PredecirRiesgoAbandono(
        $sesionesAsistidas: Int!
        $sesionesTotales: Int!
        $puntuacionPromedioDolor: Float!
        $categoriaSemaforo: String!
      ) {
        predecirRiesgoAbandono(
          sesionesAsistidas: $sesionesAsistidas
          sesionesTotales: $sesionesTotales
          puntuacionPromedioDolor: $puntuacionPromedioDolor
          categoriaSemaforo: $categoriaSemaforo
        ) {
          probabilidadAbandono
          riesgo
          disponible
          mensaje
        }
      }
    `;
    return this.gql.query(query, {
      sesionesAsistidas,
      sesionesTotales,
      puntuacionPromedioDolor,
      categoriaSemaforo
    });
  }

  dashboardKpis(periodo: string | null = null): Observable<{ dashboardKpis: DashboardKpisResultado }> {
    const query = `
      query DashboardKpis($periodo: String) {
        dashboardKpis(periodo: $periodo) {
          tasaOcupacion {
            datos { zona promedioSesiones tasaOcupacionPct }
            promedioGlobal
          }
          distribucionSemaforo {
            verde { cantidad porcentaje }
            amarillo { cantidad porcentaje }
            rojo { cantidad porcentaje }
            total
          }
          ingresos {
            periodo ingresosReales proyeccion variacionPct totalFacturas
          }
          sesionesPorEnfermedad {
            datos { enfermedad promedioSesiones }
            promedioGlobal
          }
          tasaAltaMedica {
            tasaAltaMedicaPct altaMedica abandono enCurso total
          }
          totalRegistros
          periodo
        }
      }
    `;
    return this.gql.query(query, { periodo });
  }
}
