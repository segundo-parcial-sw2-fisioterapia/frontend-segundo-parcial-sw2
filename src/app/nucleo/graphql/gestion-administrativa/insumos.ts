import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from '../graphql.service';

const FRAGMENT_PAGINA = `paginaInfo { totalElementos totalPaginas paginaActual tamano primero ultimo }`;
const FRAGMENT_INSUMO = `id nombre categoria stockActual stockMinimo unidadMedida precioUnitario activo`;

@Injectable({ providedIn: 'root' })
export class InsumosService {
  private gql = inject(GraphQLService);

  /**
   * Lista insumos paginados del catálogo de inventario.
   *
   * @param pagina Número de página (0-indexed). Por defecto 0.
   * @param tamano Registros por página. Por defecto 20.
   */
  listarInsumos(pagina = 0, tamano = 20): Observable<any> {
    return this.gql
      .query<{ listarInsumos: any }>(
        `query($pagina: PaginaInput) {
          listarInsumos(pagina: $pagina) {
            contenido { ${FRAGMENT_INSUMO} }
            ${FRAGMENT_PAGINA}
          }
        }`,
        { pagina: { pagina, tamano } },
      )
      .pipe(map((d) => d.listarInsumos));
  }

  /** Obtiene el detalle de un insumo por ID. */
  verInsumo(id: number): Observable<any> {
    return this.gql
      .query<{ verInsumo: any }>(
        `query($id: ID!) { verInsumo(id: $id) { ${FRAGMENT_INSUMO} } }`,
        { id: String(id) },
      )
      .pipe(map((d) => d.verInsumo));
  }

  /** Lista los insumos con stock actual ≤ stock mínimo (requieren reposición). */
  listarInsumosConStockBajo(): Observable<any[]> {
    return this.gql
      .query<{ listarInsumosConStockBajo: any[] }>(`
        query {
          listarInsumosConStockBajo { id nombre categoria stockActual stockMinimo unidadMedida }
        }
      `)
      .pipe(map((d) => d.listarInsumosConStockBajo));
  }

  /** Registra un nuevo insumo en el catálogo. */
  crearInsumo(input: any): Observable<any> {
    return this.gql
      .mutate<{ crearInsumos: any }>(
        `mutation($input: CrearInsumoInput!) {
          crearInsumos(input: $input) { id nombre categoria stockActual activo }
        }`,
        { input },
      )
      .pipe(map((d) => d.crearInsumos));
  }

  /** Actualiza los datos de un insumo existente. */
  editarInsumo(id: number, input: any): Observable<any> {
    return this.gql
      .mutate<{ editarInsumo: any }>(
        `mutation($id: ID!, $input: EditarInsumoInput!) {
          editarInsumo(id: $id, input: $input) { id nombre categoria stockActual activo }
        }`,
        { id: String(id), input },
      )
      .pipe(map((d) => d.editarInsumo));
  }

  /** Elimina un insumo del catálogo por su ID. */
  eliminarInsumo(id: number): Observable<boolean> {
    return this.gql
      .mutate<{ eliminarInsumo: boolean }>(
        `mutation($id: ID!) { eliminarInsumo(id: $id) }`,
        { id: String(id) },
      )
      .pipe(map((d) => d.eliminarInsumo));
  }
}
