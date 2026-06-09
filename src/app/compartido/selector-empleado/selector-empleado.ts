import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpleadosService } from '../../nucleo/graphql/gestion-administrativa/empleados';

@Component({
  selector: 'app-selector-empleado',
  imports: [CommonModule],
  templateUrl: './selector-empleado.html',
  styleUrl: './selector-empleado.css',
})
export class SelectorEmpleado implements OnInit {
  private empleadosService = inject(EmpleadosService);

  @Input() label = 'Fisioterapeuta';
  @Input() placeholder = 'Buscar por nombre, CI o cargo...';
  @Input() errorMsg = 'Debe seleccionar un empleado';
  @Input() mostrarError = false;

  // ID seleccionado del formulario (gestionado como signal para reactividad en computed)
  _selectedId = signal<number | string | null>(null);

  @Input() set selectedId(val: number | string | null) {
    this._selectedId.set(val);
  }

  get selectedId(): number | string | null {
    return this._selectedId();
  }

  @Output() seleccionado = new EventEmitter<number | null>();

  // Estados
  empleados = signal<any[]>([]);
  cargando = signal(false);
  termino = signal('');
  dropdownAbierto = signal(false);

  // Filtrar solo empleados activos
  empleadosActivos = computed(() => {
    return this.empleados().filter(emp => emp.estadoLaboral === 'activo');
  });

  // Filtrado local según el término ingresado
  empleadosFiltrados = computed(() => {
    const t = this.termino().trim().toLowerCase();
    const activos = this.empleadosActivos();
    if (!t) return activos;
    return activos.filter(emp => {
      const nombreCompleto = `${emp.persona?.nombre ?? ''} ${emp.persona?.apellido ?? ''}`.toLowerCase();
      const ci = (emp.persona?.ci ?? '').toLowerCase();
      const cargo = (emp.cargo ?? '').toLowerCase();
      const especialidad = (emp.especialidad ?? '').toLowerCase();
      return nombreCompleto.includes(t) || ci.includes(t) || cargo.includes(t) || especialidad.includes(t);
    });
  });

  // Empleado seleccionado para mostrar su "chip"
  empleadoSeleccionado = computed(() => {
    const id = this._selectedId();
    if (id === null || id === undefined || id === '') return null;
    return this.empleados().find(emp => String(emp.id) === String(id)) || null;
  });

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    this.cargando.set(true);
    // Carga los primeros 100 empleados (suficiente ya que son pocos, de 10 a 20)
    this.empleadosService.listarEmpleados(0, 100).subscribe({
      next: (res: any) => {
        this.empleados.set(res.contenido || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onBuscar(val: string): void {
    this.termino.set(val);
  }

  abrirDropdown(): void {
    this.dropdownAbierto.set(true);
  }

  cerrarDropdown(): void {
    // Retraso para permitir que se ejecute el evento mousedown antes de ocultar
    setTimeout(() => this.dropdownAbierto.set(false), 200);
  }

  seleccionar(emp: any): void {
    this.seleccionado.emit(Number(emp.id));
    this.dropdownAbierto.set(false);
    this.termino.set('');
  }

  limpiar(): void {
    this.seleccionado.emit(null);
    this.termino.set('');
  }
}
