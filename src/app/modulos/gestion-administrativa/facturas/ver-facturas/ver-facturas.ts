import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-ver-facturas',
  imports: [],
  templateUrl: './ver-facturas.html',
})
export class VerFacturas {
  @Input() factura: any | null = null;
  @Input() generandoPdf = false;

  /** Emite el ID de la factura para registrar en blockchain */
  @Output() registrarBlockchain = new EventEmitter<number>();

  /** Emite el ID de la factura para generar e imprimir el PDF */
  @Output() imprimirFactura = new EventEmitter<number>();

  get pacienteNombre(): string {
    if (!this.factura?.paciente) return `ID: ${this.factura?.pacienteId ?? '—'}`;
    const p = this.factura.paciente;
    return `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() || '—';
  }

  get pacienteCi(): string {
    return this.factura?.paciente?.ci ?? '—';
  }

  get pacienteTelefono(): string {
    return this.factura?.paciente?.telefono ?? '—';
  }

  get empleadoNombre(): string {
    const e = this.factura?.empleado;
    if (!e?.persona) return '—';
    return `${e.persona.nombre ?? ''} ${e.persona.apellido ?? ''}`.trim() || '—';
  }

  get empleadoCargo(): string {
    return this.factura?.empleado?.cargo ?? '—';
  }

  get badgeClase(): string {
    switch (this.factura?.estado) {
      case 'emitida': return 'badge-base badge-verde';
      case 'anulada': return 'badge-base badge-rojo';
      default: return 'badge-base badge-amarillo';
    }
  }
}
