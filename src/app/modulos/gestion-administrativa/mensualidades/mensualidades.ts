import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  MensualidadesService,
  MensualidadEnriquecida,
  FacturaEnriquecida,
  PagoRegistrado,
  RegistrarPagoInput,
} from '../../../nucleo/graphql/gestion-administrativa/mensualidades';
import { EmpleadosService } from '../../../nucleo/graphql/gestion-administrativa/empleados';
import { PacientesService } from '../../../nucleo/graphql/gestion-clinica/pacientes';
import { LoginService } from '../../../nucleo/rest/login.service';
import { Modal } from '../../../compartido/modal/modal';
import { Paginacion, PaginaInfo } from '../../../compartido/paginacion/paginacion';

type FiltroEstado = '' | 'pendiente' | 'pagada' | 'vencida';

@Component({
  selector: 'app-mensualidades',
  imports: [ReactiveFormsModule, Modal, Paginacion],
  templateUrl: './mensualidades.html',
})
export class Mensualidades implements OnInit {
  private mensualidadesService = inject(MensualidadesService);
  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);
  protected auth = inject(LoginService);
  private fb = inject(FormBuilder);

  // Listado
  mensualidades = signal<MensualidadEnriquecida[]>([]);
  cargando = signal(false);
  paginaInfo = signal<PaginaInfo | null>(null);
  paginaActual = signal(0);
  mensajeError = signal<string | null>(null);

  // Filtros backend
  filtroEstado = signal<FiltroEstado>('');
  pacienteSeleccionado = signal<{ id: string; persona: { nombre: string; apellido: string; ci: string } } | null>(null);

  // Búsqueda de paciente
  buscandoPaciente = signal(false);
  pacientesBuscados = signal<any[]>([]);
  private busquedaPaciente$ = new Subject<string>();
  terminoBusqueda = signal('');

  // Empleado autenticado (auto-fill en el pago)
  empleadoActual = signal<{ id: string; cargo: string; persona?: { nombre: string; apellido: string } } | null>(null);

  // Modal de pago
  modalPago = signal(false);
  guardando = signal(false);
  mensualidadSeleccionada = signal<MensualidadEnriquecida | null>(null);

  // Modal de confirmación de factura
  modalFactura = signal(false);
  pagoRegistrado = signal<PagoRegistrado | null>(null);

  readonly FILTROS: { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'vencida', etiqueta: 'Vencida' },
    { valor: 'pagada', etiqueta: 'Pagada' },
  ];

  readonly METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'qr'];

  form = this.fb.group({
    metodoPago: ['efectivo', Validators.required],
  });

  ngOnInit(): void {
    this.cargarEmpleadoActual();
    this.cargarMensualidades();
    this.busquedaPaciente$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((termino) => {
      if (!termino || termino.length < 2) {
        this.pacientesBuscados.set([]);
        this.buscandoPaciente.set(false);
        return;
      }
      this.buscandoPaciente.set(true);
      this.pacientesService.buscarPacientes(termino).subscribe({
        next: (lista) => {
          this.pacientesBuscados.set(lista);
          this.buscandoPaciente.set(false);
        },
        error: () => this.buscandoPaciente.set(false),
      });
    });
  }

  private cargarEmpleadoActual(): void {
    const usuario = this.auth.obtenerUsuario();
    if (!usuario?.personaId) return;
    this.empleadosService.verEmpleadoPorPersonaId(String(usuario.personaId)).subscribe({
      next: (emp) => { if (emp) this.empleadoActual.set(emp); },
      error: () => {},
    });
  }

  cargarMensualidades(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.mensualidadesService
      .listarMensualidadesEnriquecidas(
        this.pacienteSeleccionado()?.id ?? null,
        this.filtroEstado() || null,
        this.paginaActual(),
      )
      .subscribe({
        next: (resultado) => {
          this.mensualidades.set(resultado.contenido);
          this.paginaInfo.set(resultado.paginaInfo);
          this.cargando.set(false);
        },
        error: () => {
          this.mensajeError.set('No se pudieron cargar las mensualidades.');
          this.cargando.set(false);
        },
      });
  }

  onBuscarPaciente(evento: Event): void {
    const termino = (evento.target as HTMLInputElement).value;
    this.terminoBusqueda.set(termino);
    this.busquedaPaciente$.next(termino);
  }

  seleccionarPaciente(paciente: any): void {
    this.pacienteSeleccionado.set({
      id: String(paciente.id),
      persona: paciente.persona,
    });
    this.pacientesBuscados.set([]);
    this.terminoBusqueda.set('');
    this.paginaActual.set(0);
    this.cargarMensualidades();
  }

  limpiarPaciente(): void {
    this.pacienteSeleccionado.set(null);
    this.terminoBusqueda.set('');
    this.pacientesBuscados.set([]);
    this.paginaActual.set(0);
    this.cargarMensualidades();
  }

  cambiarFiltroEstado(filtro: FiltroEstado): void {
    this.filtroEstado.set(filtro);
    this.paginaActual.set(0);
    this.cargarMensualidades();
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    this.cargarMensualidades();
  }

  abrirRegistrarPago(mensualidad: MensualidadEnriquecida): void {
    this.mensualidadSeleccionada.set(mensualidad);
    this.form.reset({ metodoPago: 'efectivo' });
    this.modalPago.set(true);
  }

  cerrarModalPago(): void {
    this.modalPago.set(false);
    this.mensualidadSeleccionada.set(null);
    this.form.reset({ metodoPago: 'efectivo' });
  }

  confirmarPago(): void {
    if (this.form.invalid || !this.mensualidadSeleccionada()) return;
    this.guardando.set(true);
    const input: RegistrarPagoInput = {
      mensualidadId: this.mensualidadSeleccionada()!.id,
      metodoPago: this.form.value.metodoPago ?? 'efectivo',
      empleadoId: this.empleadoActual()?.id ?? undefined,
    };
    this.mensualidadesService.registrarPagoMensualidad(input).subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        this.pagoRegistrado.set(resultado);
        this.cerrarModalPago();
        this.modalFactura.set(true);
        this.cargarMensualidades();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError.set('Error al registrar el pago. Intente de nuevo.');
      },
    });
  }

  cerrarModalFactura(): void {
    this.modalFactura.set(false);
    this.pagoRegistrado.set(null);
  }

  /** Nombre completo del paciente desde la mensualidad enriquecida. */
  nombrePaciente(m: MensualidadEnriquecida): string {
    if (!m.paciente) return `Paciente #${m.pacienteId}`;
    const { nombre, apellido, ci } = m.paciente;
    return `${nombre ?? ''} ${apellido ?? ''}${ci ? ` (${ci})` : ''}`.trim();
  }

  clasesBadgeEstado(estado: string): string {
    const mapa: Record<string, string> = {
      pagada: 'badge-verde',
      pendiente: 'badge-amarillo',
      vencida: 'badge-rojo',
    };
    return `badge-base ${mapa[estado] ?? 'bg-gray-100 text-gray-700'}`;
  }

  puedeRegistrarPago(m: MensualidadEnriquecida): boolean {
    return m.estado === 'pendiente' || m.estado === 'vencida';
  }

  nombreEmpleadoFactura(factura: FacturaEnriquecida): string {
    if (!factura.empleado) return factura.empleadoId ? `Empleado #${factura.empleadoId}` : '—';
    const { cargo, persona } = factura.empleado;
    const nombre = persona ? `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim() : '';
    return nombre ? `${nombre} (${cargo})` : cargo;
  }
}
