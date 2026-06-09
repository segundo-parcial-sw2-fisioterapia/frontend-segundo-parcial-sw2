import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-planes-ejercicios',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-planes-ejercicios.html',
  styleUrl: './crear-planes-ejercicios.css',
})
export class CrearPlanesEjercicios {
  private fb = inject(FormBuilder);

  // ── FK: Plan de Tratamiento ───────────────────────────────
  @Input() planesTratamiento: any[] = [];
  @Output() buscarPlanTratamiento = new EventEmitter<string>();
  planTratamientoSeleccionado = signal<any | null>(null);
  terminoPlanTratamiento = '';

  // ── FK: Ejercicio ─────────────────────────────────────────
  @Input() ejercicios: any[] = [];
  @Output() buscarEjercicio = new EventEmitter<string>();
  ejercicioSeleccionado = signal<any | null>(null);
  terminoEjercicio = '';

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    planTratamientoId: [null as number | null, Validators.required],
    ejercicioId: [null as number | null, Validators.required],
    frecuencia: ['', Validators.required],
    orden: [null as number | null],
    repeticiones: [null as number | null],
    series: [null as number | null],
    activo: [false],
  });

  onBuscarPlanTratamiento(t: string): void { this.terminoPlanTratamiento = t; this.buscarPlanTratamiento.emit(t); }
  seleccionarPlanTratamiento(p: any): void { this.planTratamientoSeleccionado.set(p); this.form.patchValue({ planTratamientoId: Number(p.id) }); }
  limpiarPlanTratamiento(): void { this.planTratamientoSeleccionado.set(null); this.form.patchValue({ planTratamientoId: null }); this.terminoPlanTratamiento = ''; this.buscarPlanTratamiento.emit(''); }

  onBuscarEjercicio(t: string): void { this.terminoEjercicio = t; this.buscarEjercicio.emit(t); }
  seleccionarEjercicio(e: any): void { this.ejercicioSeleccionado.set(e); this.form.patchValue({ ejercicioId: Number(e.id) }); }
  limpiarEjercicio(): void { this.ejercicioSeleccionado.set(null); this.form.patchValue({ ejercicioId: null }); this.terminoEjercicio = ''; this.buscarEjercicio.emit(''); }

  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
