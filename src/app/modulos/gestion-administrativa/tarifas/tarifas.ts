import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TarifasService, Tarifa, ActualizarTarifaInput } from '../../../nucleo/graphql/gestion-administrativa/tarifas';
import { LoginService } from '../../../nucleo/rest/login.service';
import { Modal } from '../../../compartido/modal/modal';

@Component({
  selector: 'app-tarifas',
  imports: [SlicePipe, ReactiveFormsModule, Modal],
  templateUrl: './tarifas.html',
})
export class Tarifas implements OnInit {
  private tarifasService = inject(TarifasService);
  protected auth = inject(LoginService);
  private fb = inject(FormBuilder);

  tarifas = signal<Tarifa[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  modalEditar = signal(false);
  tarifaSeleccionada = signal<Tarifa | null>(null);
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  readonly SEMAFOROS = ['verde', 'amarillo', 'rojo'] as const;
  readonly NIVELES = ['bajo', 'medio', 'alto'] as const;

  form = this.fb.group({
    precioMensual: [0, [Validators.required, Validators.min(0)]],
  });

  /** Retorna la tarifa para la combinación de semáforo y nivel */
  tarifaPara = computed(() => (semaforo: string, nivel: string): Tarifa | undefined =>
    this.tarifas().find(
      (t) => t.categoriaSemaforo.toLowerCase() === semaforo && t.nivel.toLowerCase() === nivel,
    ),
  );

  /** Total de sesiones mensuales promedio (informativo) */
  totalTarifas = computed(() => this.tarifas().length);

  ngOnInit(): void {
    this.cargarTarifas();
  }

  cargarTarifas(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.tarifasService.listarTarifas().subscribe({
      next: (lista) => {
        this.tarifas.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar las tarifas del sistema.');
        this.cargando.set(false);
      },
    });
  }

  abrirEditar(tarifa: Tarifa): void {
    this.tarifaSeleccionada.set(tarifa);
    this.form.patchValue({ precioMensual: tarifa.precioMensual });
    this.modalEditar.set(true);
  }

  cerrarModalEditar(): void {
    this.modalEditar.set(false);
    this.tarifaSeleccionada.set(null);
    this.form.reset({ precioMensual: 0 });
  }

  /**
   * Actualiza el precio de la tarifa seleccionada.
   * Envía el ID numérico del usuario autenticado como referencia de auditoría.
   */
  guardarTarifa(): void {
    if (this.form.invalid || !this.tarifaSeleccionada()) return;
    this.guardando.set(true);

    // Extraer sub (ID numérico) del JWT para la auditoría
    const token = this.auth.obtenerToken();
    let subId: number | undefined;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        subId = typeof payload.sub === 'number' ? payload.sub : undefined;
      } catch { /* ignorar error de parseo */ }
    }

    const input: ActualizarTarifaInput = {
      precioMensual: this.form.value.precioMensual ?? 0,
      actualizadoPor: subId,
    };

    this.tarifasService.actualizarTarifa(this.tarifaSeleccionada()!.id, input).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModalEditar();
        this.cargarTarifas();
        this.mensajeExito.set('Tarifa actualizada correctamente.');
        setTimeout(() => this.mensajeExito.set(null), 3500);
      },
      error: () => this.guardando.set(false),
    });
  }

  /** Clase CSS del badge según la categoría semáforo */
  clasesBadgeSemaforo(semaforo: string): string {
    const mapa: Record<string, string> = {
      verde: 'badge-verde',
      amarillo: 'badge-amarillo',
      rojo: 'badge-rojo',
    };
    return `badge-base ${mapa[semaforo.toLowerCase()] ?? 'bg-gray-100 text-gray-700'}`;
  }

  /** Icono emoji del semáforo */
  iconoSemaforo(semaforo: string): string {
    return { verde: '🟢', amarillo: '🟡', rojo: '🔴' }[semaforo.toLowerCase()] ?? '⚪';
  }

  formatearPrecio(precio: number): string {
    return `Bs. ${precio.toFixed(2)}`;
  }
}
