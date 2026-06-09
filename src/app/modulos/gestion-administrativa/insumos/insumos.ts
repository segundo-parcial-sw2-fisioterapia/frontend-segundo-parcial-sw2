import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { InsumosService } from '../../../nucleo/graphql/gestion-administrativa/insumos';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { Paginacion, PaginaInfo } from '../../../compartido/paginacion/paginacion';
import { CrearInsumos } from './crear-insumos/crear-insumos';
import { EditarInsumos } from './editar-insumos/editar-insumos';
import { VerInsumos } from './ver-insumos/ver-insumos';

@Component({
  selector: 'app-insumos',
  imports: [Tabla, Modal, Paginacion, CrearInsumos, EditarInsumos, VerInsumos],
  templateUrl: './insumos.html',
})
export class Insumos implements OnInit {
  private insumosService = inject(InsumosService);

  insumos = signal<any[]>([]);
  cargando = signal(false);
  paginaInfo = signal<PaginaInfo | null>(null);
  paginaActual = signal(0);

  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  insumoSeleccionado = signal<any | null>(null);
  alertaStock = signal<any[]>([]);
  nombresAlertaStock = computed(() => {
    return this.alertaStock().slice(0, 3).map(i => i.nombre).join(', ');
  });

  columnas: ColumnaTabla[] = [
    { key: 'nombre', titulo: 'Nombre' },
    { key: 'categoria', titulo: 'Categoría', tipo: 'enum' },
    { key: 'stockActual', titulo: 'Stock actual' },
    { key: 'stockMinimo', titulo: 'Stock mínimo' },
    { key: 'unidadMedida', titulo: 'Unidad' },
    { key: 'precioUnitario', titulo: 'Precio unit. (Bs)' },
  ];

  ngOnInit(): void {
    this.cargarInsumos();
    this.verificarStockBajo();
  }

  /** Carga la página actual del catálogo de insumos. */
  cargarInsumos(): void {
    this.cargando.set(true);
    this.insumosService.listarInsumos(this.paginaActual()).subscribe({
      next: (resultado: any) => {
        this.insumos.set(resultado.contenido);
        this.paginaInfo.set(resultado.paginaInfo);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Cambia a la página indicada y recarga el listado. */
  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    this.cargarInsumos();
  }

  /** Consulta insumos con stock bajo para mostrar alerta visual en el encabezado. */
  verificarStockBajo(): void {
    this.insumosService.listarInsumosConStockBajo().subscribe({
      next: (d: any[]) => this.alertaStock.set(d),
      error: () => {},
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(ins: any): void { this.insumoSeleccionado.set(ins); this.modalEditar.set(true); }
  abrirVer(ins: any): void { this.insumoSeleccionado.set(ins); this.modalVer.set(true); }

  /** Registra un nuevo insumo y recarga el inventario. */
  crearInsumo(datos: any): void {
    this.insumosService.crearInsumo(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarInsumos(); this.verificarStockBajo(); },
    });
  }

  /** Actualiza un insumo existente en el catálogo. */
  editarInsumo(datos: any): void {
    const { id, ...input } = datos;
    this.insumosService.editarInsumo(id, input).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarInsumos(); this.verificarStockBajo(); },
    });
  }

  /** Elimina un insumo del catálogo tras confirmación. */
  eliminarInsumo(id: number): void {
    if (!confirm('¿Desea eliminar este insumo del inventario?')) return;
    this.insumosService.eliminarInsumo(id).subscribe({
      next: () => { this.cargarInsumos(); this.verificarStockBajo(); },
    });
  }
}
