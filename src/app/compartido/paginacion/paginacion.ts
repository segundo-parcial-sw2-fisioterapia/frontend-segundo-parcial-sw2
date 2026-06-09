import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';

export interface PaginaInfo {
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
  tamano: number;
  primero: boolean;
  ultimo: boolean;
}

@Component({
  selector: 'app-paginacion',
  imports: [],
  templateUrl: './paginacion.html',
  styleUrl: './paginacion.css',
})
export class Paginacion {
  @Input() paginaInfo: PaginaInfo | null = null;

  /** Emite el número de página a la que navegar (0-indexed) */
  @Output() cambiarPagina = new EventEmitter<number>();

  /** Índice del primer registro mostrado (para mostrar "X–Y de Z") */
  get inicio(): number {
    if (!this.paginaInfo) return 0;
    return this.paginaInfo.paginaActual * this.paginaInfo.tamano + 1;
  }

  /** Índice del último registro mostrado */
  get fin(): number {
    if (!this.paginaInfo) return 0;
    return Math.min(
      (this.paginaInfo.paginaActual + 1) * this.paginaInfo.tamano,
      this.paginaInfo.totalElementos
    );
  }

  /**
   * Genera el array de números de página visibles.
   * Muestra hasta 5 páginas centradas en la página actual.
   */
  get paginas(): number[] {
    if (!this.paginaInfo || this.paginaInfo.totalPaginas <= 1) return [];
    const total = this.paginaInfo.totalPaginas;
    const actual = this.paginaInfo.paginaActual;
    const rango = 2;
    const inicio = Math.max(0, actual - rango);
    const fin = Math.min(total - 1, actual + rango);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  ir(pagina: number): void {
    if (!this.paginaInfo) return;
    if (pagina < 0 || pagina >= this.paginaInfo.totalPaginas) return;
    if (pagina === this.paginaInfo.paginaActual) return;
    this.cambiarPagina.emit(pagina);
  }
}
