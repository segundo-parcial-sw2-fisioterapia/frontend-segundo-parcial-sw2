import { Pipe, PipeTransform } from '@angular/core';

const ETIQUETAS: Record<string, string> = {
  // TipoContrato
  tiempo_completo: 'Tiempo Completo',
  medio_tiempo: 'Medio Tiempo',
  por_horas: 'Por Horas',

  // EstadoLaboral
  activo: 'Activo',
  suspendido: 'Suspendido',
  retirado: 'Retirado',

  // EstadoFactura
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  anulada: 'Anulada',

  // EstadoSuscripcion
  vencida: 'Vencida',
  agotada: 'Agotada',

  // MetodoPago
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  qr: 'QR',

  // CategoriaInsumo
  material_terapeutico: 'Material Terapéutico',
  medicamento: 'Medicamento',
  equipo: 'Equipo',
  consumible: 'Consumible',

  // TipoMovimiento
  entrada: 'Entrada',
  salida: 'Salida',

  // TipoDocumento
  contrato: 'Contrato',
  factura: 'Factura',
  evaluacion: 'Evaluación',
  consentimiento: 'Consentimiento',
  alta_medica: 'Alta Médica',
  otro: 'Otro',

  // EstadoAsistencia
  tardanza: 'Tardanza',
  justificado: 'Justificado',
  presente: 'Presente',
  ausente: 'Ausente',

  // DiaSemana
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

/**
 * Convierte valores de enum snake_case a etiquetas legibles en español.
 * Ejemplo: 'tiempo_completo' → 'Tiempo Completo'
 */
@Pipe({ name: 'etiquetaEnum', standalone: true })
export class EtiquetaEnumPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    return ETIQUETAS[valor] ?? valor;
  }
}
