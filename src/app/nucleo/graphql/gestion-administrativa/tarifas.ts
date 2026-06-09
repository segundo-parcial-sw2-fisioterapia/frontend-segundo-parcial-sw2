import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

export interface Tarifa {
  id: string;
  categoriaSemaforo: string;
  nivel: string;
  precioMensual: number;
  actualizadoEn?: string;
  actualizadoPor?: string;
}

export interface ActualizarTarifaInput {
  precioMensual: number;
  actualizadoPor?: number;
}

const FRAGMENT_TARIFA = `id categoriaSemaforo nivel precioMensual actualizadoEn actualizadoPor`;

@Injectable({ providedIn: 'root' })
export class TarifasService {
  private gql = inject(GraphQLService);

  /** Lista todas las tarifas del sistema (9 celdas semáforo × nivel). */
  listarTarifas(): Observable<Tarifa[]> {
    return this.gql
      .query<{ listarTarifas: Tarifa[] }>(
        `query { listarTarifas { ${FRAGMENT_TARIFA} } }`,
      )
      .pipe(map((d) => d.listarTarifas));
  }

  /** Obtiene el detalle de una tarifa por ID. */
  verTarifa(id: string): Observable<Tarifa> {
    return this.gql
      .query<{ verTarifa: Tarifa }>(
        `query($id: ID!) { verTarifa(id: $id) { ${FRAGMENT_TARIFA} } }`,
        { id },
      )
      .pipe(map((d) => d.verTarifa));
  }

  /**
   * Actualiza el precio mensual de una tarifa existente.
   *
   * @param id ID de la tarifa a modificar.
   * @param input Nuevos datos de precio y referencia del usuario que actualiza.
   */
  actualizarTarifa(id: string, input: ActualizarTarifaInput): Observable<Tarifa> {
    return this.gql
      .mutate<{ actualizarTarifa: Tarifa }>(
        `mutation($id: ID!, $input: ActualizarTarifaInput!) {
          actualizarTarifa(id: $id, input: $input) { ${FRAGMENT_TARIFA} }
        }`,
        { id, input },
      )
      .pipe(map((d) => d.actualizarTarifa));
  }
}
