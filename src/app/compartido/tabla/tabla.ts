import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { EtiquetaEnumPipe } from '../pipes/etiqueta-enum.pipe';

export interface BadgeInfo {
  texto: string;
  /** Clases CSS adicionales a badge-base (ej: 'badge-verde' o 'bg-blue-100 text-blue-800') */
  clases: string;
}

export interface ColumnaTabla {
  key: string;
  titulo: string;
  /** 'enum' aplica EtiquetaEnumPipe; 'fecha' trunca a fecha; 'fecha-hora' formatea; 'badge' renderiza chip de color */
  tipo?: 'texto' | 'enum' | 'fecha' | 'fecha-hora' | 'badge';
  /** Mapa valor → BadgeInfo. Requerido cuando tipo === 'badge' */
  badgeMap?: Record<string, BadgeInfo>;
}

@Component({
  selector: 'app-tabla',
  imports: [EtiquetaEnumPipe, NgTemplateOutlet],
  templateUrl: './tabla.html',
})
export class Tabla {
  @Input() columnas: ColumnaTabla[] = [];
  @Input() filas: any[] = [];
  @Input() cargando = false;
  @Input() mensajeVacio = 'No hay registros disponibles.';
  @Input() conAcciones = true;
  @Input() conVer = true;
  @Input() conEditar = true;
  @Input() conEliminar = true;

  @Output() ver = new EventEmitter<any>();
  @Output() editar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<number>();

  /**
   * Template personalizado para la columna de acciones.
   * Uso: <ng-template #accionesTemplate let-fila>...</ng-template>
   * Cuando se provee, reemplaza los botones Ver/Editar/Eliminar por defecto.
   */
  @ContentChild('accionesTemplate') accionesTemplate?: TemplateRef<{ $implicit: any }>;

  /** Resuelve el valor de una celda con soporte a notación punto (ej: persona.nombre) */
  obtenerValor(fila: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], fila);
  }

  /** Formatea el valor de celda según el tipo de columna */
  formatearValor(fila: any, col: ColumnaTabla): string {
    const val = this.obtenerValor(fila, col.key);
    if (val === null || val === undefined) return '—';
    if (col.tipo === 'fecha' && typeof val === 'string') return val.split('T')[0];
    if (col.tipo === 'fecha-hora' && typeof val === 'string') {
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return val;
      }
    }
    return String(val);
  }
}
