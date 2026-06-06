import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FacturasService } from '../../../nucleo/graphql/gestion-administrativa/facturas';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { Paginacion, PaginaInfo } from '../../../compartido/paginacion/paginacion';
import { VerFacturas } from './ver-facturas/ver-facturas';
import { KpiCard } from '../../../compartido/kpi-card/kpi-card';

@Component({
  selector: 'app-facturas',
  imports: [FormsModule, Tabla, Modal, Paginacion, VerFacturas, KpiCard],
  templateUrl: './facturas.html',
})
export class Facturas implements OnInit {
  private facturasService = inject(FacturasService);

  facturas = signal<any[]>([]);
  cargando = signal(false);
  paginaInfo = signal<PaginaInfo | null>(null);
  paginaActual = signal(0);

  modalVer = signal(false);
  facturaSeleccionada = signal<any | null>(null);
  cargandoDetalle = signal(false);
  generandoPdf = signal(false);

  // Filtros — variables primitivas (no signal) para [(ngModel)]
  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' }, { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' }, { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];
  anioActual = new Date().getFullYear();
  anios = [this.anioActual, this.anioActual - 1, this.anioActual - 2];

  mesSeleccionado = new Date().getMonth() + 1;  // primitiva para ngModel
  anioSeleccionado = new Date().getFullYear();   // primitiva para ngModel

  // KPIs calculados a partir de las facturas cargadas
  totalFacturado = computed(() =>
    this.facturas()
      .filter(f => f.estado !== 'anulada')
      .reduce((sum: number, f: any) => sum + (f.montoTotal || 0), 0)
  );
  cantidadFacturas = computed(() => this.facturas().length);
  cantidadAnuladas = computed(() => this.facturas().filter((f: any) => f.estado === 'anulada').length);

  columnas: ColumnaTabla[] = [
    { key: 'pacienteNombre', titulo: 'Paciente' },
    { key: 'numeroFactura', titulo: 'N° Factura' },
    { key: 'fechaEmision', titulo: 'Fecha', tipo: 'fecha' },
    { key: 'montoTotal', titulo: 'Monto (Bs)' },
    { key: 'concepto', titulo: 'Concepto' },
    { key: 'estado', titulo: 'Estado', tipo: 'enum' },
    { key: 'hashBlockchain', titulo: 'Blockchain' },
  ];

  ngOnInit(): void {
    this.cargarFacturas();
  }

  cargarFacturas(): void {
    this.cargando.set(true);
    this.facturasService
      .listarFacturasEnriquecidas(this.mesSeleccionado, this.anioSeleccionado, this.paginaActual())
      .subscribe({
        next: (resultado: any) => {
          // Mapeamos paciente.nombre para que la tabla pueda renderizarlo por key
          const filas = (resultado.contenido || []).map((f: any) => ({
            ...f,
            pacienteNombre: f.paciente
              ? `${f.paciente.nombre ?? ''} ${f.paciente.apellido ?? ''}`.trim()
              : `ID: ${f.pacienteId}`,
          }));
          this.facturas.set(filas);
          this.paginaInfo.set(resultado.paginaInfo);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    this.cargarFacturas();
  }

  aplicarFiltros(): void {
    this.paginaActual.set(0);
    this.cargarFacturas();
  }

  /** Al hacer Ver: carga el detalle enriquecido completo (con empleado). */
  abrirVer(fac: any): void {
    this.cargandoDetalle.set(true);
    this.modalVer.set(true);
    this.facturasService.verFacturaEnriquecida(Number(fac.id)).subscribe({
      next: (detalle: any) => {
        this.facturaSeleccionada.set(detalle);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        // Si falla, mostramos lo que tenemos del listado
        this.facturaSeleccionada.set(fac);
        this.cargandoDetalle.set(false);
      },
    });
  }

  /** Registra la factura en blockchain y recarga. */
  registrarEnBlockchain(id: number): void {
    this.facturasService.registrarEnBlockchain(id).subscribe({
      next: () => { this.modalVer.set(false); this.cargarFacturas(); },
    });
  }

  /** Genera e imprime la factura como PDF/HTML. */
  imprimirFactura(id: number): void {
    this.generandoPdf.set(true);
    this.facturasService.generarPdfFactura(id).subscribe({
      next: (dataUri: string) => {
        this.generandoPdf.set(false);
        // El backend retorna HTML como base64; lo abrimos en nueva pestaña para imprimir
        const base64 = dataUri.replace('data:application/pdf;base64,', '');
        const html = atob(base64);
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
      },
      error: () => this.generandoPdf.set(false),
    });
  }
}
