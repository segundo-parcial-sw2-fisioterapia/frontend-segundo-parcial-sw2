import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReportesAdminService, ReporteFinanciero } from '../../../nucleo/graphql/gestion-administrativa/reportes';
import { BiService } from '../../../nucleo/rest/bi.service';

interface FilaTendencia {
  etiqueta: string;
  valor: number;
  pct: number;
}

@Component({
  selector: 'app-reportes',
  imports: [],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  private reportesAdmin = inject(ReportesAdminService);
  private bi = inject(BiService);

  // ─── Reporte Financiero (Spring Boot · GraphQL) ───────────────────────────────
  anios = signal<number[]>(this.calcularAnios());
  anioSeleccionado = signal<number>(new Date().getFullYear());
  financiero = signal<ReporteFinanciero | null>(null);
  cargandoFinanciero = signal(true);
  errorFinanciero = signal<string | null>(null);

  /** Barras del gráfico de ingresos mensuales, normalizadas al mes de mayor ingreso. */
  barrasIngresos = computed(() => {
    const rep = this.financiero();
    if (!rep) return [];
    const max = Math.max(1, ...rep.ingresosPorMes.map((m) => m.totalIngresos));
    return rep.ingresosPorMes.map((m) => ({
      etiqueta: m.etiqueta,
      valor: m.totalIngresos,
      facturas: m.totalFacturas,
      altura: Math.round((m.totalIngresos / max) * 100),
    }));
  });

  /** Desglose por método de pago con porcentaje sobre el total facturado. */
  metodosPago = computed<FilaTendencia[]>(() => {
    const rep = this.financiero();
    if (!rep) return [];
    const total = rep.ingresosPorMetodoPago.reduce((s, m) => s + m.total, 0) || 1;
    return rep.ingresosPorMetodoPago
      .map((m) => ({
        etiqueta: this.formatearEtiqueta(m.categoria),
        valor: m.total,
        pct: Math.round((m.total / total) * 100),
      }))
      .sort((a, b) => b.valor - a.valor);
  });

  // ─── Tendencias Clínicas (Django · Python/REST) ───────────────────────────────
  tendencias = signal<any | null>(null);
  cargandoTendencias = signal(true);
  errorTendencias = signal<string | null>(null);

  enfermedades = computed(() => this.aFilas(this.tendencias()?.enfermedades_mas_frecuentes));
  zonas = computed(() => this.aFilas(this.tendencias()?.zonas_mas_tratadas));
  resultados = computed(() => this.aFilas(this.tendencias()?.distribucion_resultados));

  /** Distribución por semáforo en orden verde → amarillo → rojo para la barra apilada. */
  semaforo = computed(() => {
    const d = this.tendencias()?.distribucion_semaforo ?? {};
    const verde = d.verde ?? 0;
    const amarillo = d.amarillo ?? 0;
    const rojo = d.rojo ?? 0;
    const total = verde + amarillo + rojo || 1;
    return {
      total: verde + amarillo + rojo,
      verde, amarillo, rojo,
      verdePct: Math.round((verde / total) * 100),
      amarilloPct: Math.round((amarillo / total) * 100),
      rojoPct: Math.round((rojo / total) * 100),
    };
  });

  ngOnInit(): void {
    this.cargarFinanciero(this.anioSeleccionado());
    this.cargarTendencias();
  }

  /**
   * Carga el reporte financiero anual desde Spring Boot vía GraphQL federado.
   *
   * @param anio Año a consultar.
   */
  cargarFinanciero(anio: number): void {
    this.cargandoFinanciero.set(true);
    this.errorFinanciero.set(null);
    this.reportesAdmin.reporteFinanciero(anio).subscribe({
      next: (rep) => {
        this.financiero.set(rep);
        this.cargandoFinanciero.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reporte financiero:', err);
        this.errorFinanciero.set('No se pudo cargar el reporte financiero.');
        this.cargandoFinanciero.set(false);
      },
    });
  }

  /** Carga el reporte de tendencias clínicas (Python/pandas) desde Django vía REST. */
  cargarTendencias(): void {
    this.cargandoTendencias.set(true);
    this.errorTendencias.set(null);
    this.bi.obtenerReporteTendencias().subscribe({
      next: (rep) => {
        this.tendencias.set(rep);
        this.cargandoTendencias.set(false);
      },
      error: (err) => {
        console.error('Error al cargar tendencias:', err);
        this.errorTendencias.set('No se pudo cargar el reporte de tendencias.');
        this.cargandoTendencias.set(false);
      },
    });
  }

  /** Cambia el año del reporte financiero y recarga. */
  cambiarAnio(anio: number): void {
    if (anio === this.anioSeleccionado()) return;
    this.anioSeleccionado.set(anio);
    this.cargarFinanciero(anio);
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valor ?? 0);
  }

  /** Convierte un objeto {clave: conteo} de la API Django en filas ordenadas con %. */
  private aFilas(obj: Record<string, number> | undefined | null): FilaTendencia[] {
    if (!obj) return [];
    const entradas = Object.entries(obj);
    const total = entradas.reduce((s, [, v]) => s + (v ?? 0), 0) || 1;
    return entradas
      .map(([k, v]) => ({
        etiqueta: this.formatearEtiqueta(k),
        valor: v ?? 0,
        pct: Math.round(((v ?? 0) / total) * 100),
      }))
      .sort((a, b) => b.valor - a.valor);
  }

  /** Normaliza snake_case a Título legible (ej. "esguince_tobillo" → "Esguince Tobillo"). */
  private formatearEtiqueta(texto: string): string {
    return (texto ?? '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Últimos 4 años disponibles para el selector del reporte financiero. */
  private calcularAnios(): number[] {
    const actual = new Date().getFullYear();
    return [actual, actual - 1, actual - 2, actual - 3];
  }
}
