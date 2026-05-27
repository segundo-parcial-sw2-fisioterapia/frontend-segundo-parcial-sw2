import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ColumnaTabla {
  key: string;
  titulo: string;
}

@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.html',
})
export class Tabla {
  @Input() columnas: ColumnaTabla[] = [];
  @Input() filas: any[] = [];
  @Input() cargando = false;
  @Input() mensajeVacio = 'No hay registros disponibles.';
  @Input() conAcciones = true;
  @Input() conVer = true;

  @Output() ver = new EventEmitter<any>();
  @Output() editar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<number>();

  /** Resuelve el valor de una celda con soporte a notación punto (ej: persona.nombre) */
  obtenerValor(fila: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], fila);
  }
}
