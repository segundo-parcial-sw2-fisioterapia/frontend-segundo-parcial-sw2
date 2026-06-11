import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ReportesAdminService,
  ReporteFinanciero,
  CatalogoReportes,
  FuenteMeta,
  ReporteDinamico,
  ReporteDinamicoInput,
  ReporteIA,
  MetricaReporte,
} from '../../../nucleo/graphql/gestion-administrativa/reportes';
import { BiService } from '../../../nucleo/rest/bi.service';

interface FilaTendencia {
  etiqueta: string;
  valor: number;
  pct: number;
}

interface BarraDinamica {
  etiqueta: string;
  valor: number;
  altura: number;
}

@Component({
  selector: 'app-reportes',
  imports: [FormsModule],
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
  kpisData = signal<any | null>(null);
  cargandoTendencias = signal(true);
  errorTendencias = signal<string | null>(null);

  kpis = computed(() => {
    const data = this.kpisData();
    return data?.data?.dashboardKpis || data;
  });

  enfermedades = computed<FilaTendencia[]>(() => {
    const datos = this.kpis()?.sesiones_por_enfermedad?.datos || [];
    const max = Math.max(1, ...datos.map((d: any) => d.promedio_sesiones || 0));
    return datos.map((d: any) => ({
      etiqueta: this.formatearEtiqueta(d.enfermedad),
      valor: d.promedio_sesiones || 0,
      pct: Math.round(((d.promedio_sesiones || 0) / max) * 100),
    })).sort((a: any, b: any) => b.valor - a.valor);
  });

  zonas = computed<FilaTendencia[]>(() => {
    const datos = this.kpis()?.tasa_ocupacion?.datos || [];
    return datos.map((d: any) => ({
      etiqueta: this.formatearEtiqueta(d.zona),
      valor: d.promedio_sesiones || 0,
      pct: Math.round(d.tasa_ocupacion_pct || 0),
    })).sort((a: any, b: any) => b.pct - a.pct);
  });

  resultados = computed<FilaTendencia[]>(() => {
    const d = this.kpis()?.tasa_alta_medica || {};
    const total = d.total || 1;
    return [
      { etiqueta: 'Alta Médica', valor: d.alta_medica || 0, pct: Math.round(((d.alta_medica || 0) / total) * 100) },
      { etiqueta: 'Abandono', valor: d.abandono || 0, pct: Math.round(((d.abandono || 0) / total) * 100) },
      { etiqueta: 'En Curso', valor: d.en_curso || 0, pct: Math.round(((d.en_curso || 0) / total) * 100) },
    ].sort((a, b) => b.valor - a.valor);
  });

  /** Distribución por semáforo en orden verde → amarillo → rojo para la barra apilada. */
  semaforo = computed(() => {
    const d = this.kpis()?.distribucion_semaforo || {};
    return {
      total: d.total || 1,
      verde: d.verde?.cantidad || 0,
      amarillo: d.amarillo?.cantidad || 0,
      rojo: d.rojo?.cantidad || 0,
      verdePct: d.verde?.porcentaje || 0,
      amarilloPct: d.amarillo?.porcentaje || 0,
      rojoPct: d.rojo?.porcentaje || 0,
    };
  });

  // ─── Generador de Reportes por Prompt (IA · OpenAI vía Spring Boot · GraphQL) ──
  promptIA = signal<string>('');
  reporteIA = signal<ReporteIA | null>(null);
  cargandoIA = signal(false);
  errorIA = signal<string | null>(null);

  ejemplosPrompt = [
    'Ingresos totales por método de pago en 2026',
    'Cantidad de empleados por cargo',
    'Suma de mensualidades por estado',
    'Valor de inventario por categoría de insumo',
  ];

  /** Barras normalizadas del reporte generado por IA. */
  barrasIA = computed<BarraDinamica[]>(() => this.aBarras(this.reporteIA()?.resultado ?? null));

  // ─── Constructor manual de reportes dinámicos (GraphQL) ───────────────────────
  catalogo = signal<CatalogoReportes | null>(null);
  fuenteSel = signal<string>('');
  metricaSel = signal<MetricaReporte>('CONTEO');
  campoMetricaSel = signal<string>('');
  agruparPorSel = signal<string>('');
  anioDinamico = signal<number | null>(null);
  reporteDinamico = signal<ReporteDinamico | null>(null);
  cargandoDinamico = signal(false);
  errorDinamico = signal<string | null>(null);

  /** Metadatos de la fuente seleccionada en el constructor manual. */
  fuenteActual = computed<FuenteMeta | undefined>(() =>
    this.catalogo()?.fuentes.find((f) => f.fuente === this.fuenteSel()),
  );

  /** Barras normalizadas del reporte del constructor manual. */
  barrasDinamico = computed<BarraDinamica[]>(() => this.aBarras(this.reporteDinamico()));

  ngOnInit(): void {
    this.cargarFinanciero(this.anioSeleccionado());
    this.cargarTendencias();
    this.cargarCatalogo();
  }

  /** Carga el catálogo de fuentes/dimensiones para el constructor manual. */
  cargarCatalogo(): void {
    this.reportesAdmin.catalogoReportes().subscribe({
      next: (cat) => {
        this.catalogo.set(cat);
        const primera = cat.fuentes[0];
        if (primera) this.seleccionarFuente(primera.fuente);
      },
      error: (err) => console.error('Error al cargar catálogo de reportes:', err),
    });
  }

  /** Cambia la fuente y resetea dimensión/campo a valores válidos de esa fuente. */
  seleccionarFuente(fuente: string): void {
    this.fuenteSel.set(fuente);
    const meta = this.catalogo()?.fuentes.find((f) => f.fuente === fuente);
    this.agruparPorSel.set(meta?.dimensiones[0]?.campo ?? '');
    this.campoMetricaSel.set(meta?.numericos[0]?.campo ?? '');
    if (!meta?.soportaAnio) this.anioDinamico.set(null);
  }

  /** Ejecuta el reporte dinámico con la configuración del constructor manual. */
  ejecutarDinamico(): void {
    const input: ReporteDinamicoInput = {
      fuente: this.fuenteSel(),
      metrica: this.metricaSel(),
      campoMetrica: this.metricaSel() === 'CONTEO' ? null : this.campoMetricaSel(),
      agruparPor: this.agruparPorSel(),
      anio: this.anioDinamico(),
    };
    this.cargandoDinamico.set(true);
    this.errorDinamico.set(null);
    this.reportesAdmin.reporteDinamico(input).subscribe({
      next: (rep) => {
        this.reporteDinamico.set(rep);
        this.cargandoDinamico.set(false);
      },
      error: (err) => {
        console.error('Error al ejecutar reporte dinámico:', err);
        this.errorDinamico.set(err?.message ?? 'No se pudo generar el reporte.');
        this.cargandoDinamico.set(false);
      },
    });
  }

  /** Genera un reporte interpretando el prompt en lenguaje natural con OpenAI. */
  generarPorPrompt(): void {
    const texto = this.promptIA().trim();
    if (!texto) return;
    this.cargandoIA.set(true);
    this.errorIA.set(null);
    this.reportesAdmin.reportePorPrompt(texto).subscribe({
      next: (rep) => {
        this.reporteIA.set(rep);
        this.cargandoIA.set(false);
      },
      error: (err) => {
        console.error('Error al generar reporte por prompt:', err);
        this.errorIA.set(err?.message ?? 'No se pudo generar el reporte con IA.');
        this.cargandoIA.set(false);
      },
    });
  }

  /** Coloca un prompt de ejemplo en el input y lo ejecuta. */
  usarEjemplo(ejemplo: string): void {
    this.promptIA.set(ejemplo);
    this.generarPorPrompt();
  }

  /** Normaliza las filas de un reporte dinámico a barras 0-100% sobre el valor máximo. */
  private aBarras(rep: ReporteDinamico | null): BarraDinamica[] {
    if (!rep || rep.filas.length === 0) return [];
    const max = Math.max(1, ...rep.filas.map((f) => Math.abs(f.valor)));
    return rep.filas.map((f) => ({
      etiqueta: f.etiqueta,
      valor: f.valor,
      altura: Math.round((Math.abs(f.valor) / max) * 100),
    }));
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
    this.bi.obtenerKpisDashboard().subscribe({
      next: (rep) => {
        this.kpisData.set(rep);
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
