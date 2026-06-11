import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-sesiones-domiciliarias',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-sesiones-domiciliarias.html',
  styleUrl: './crear-sesiones-domiciliarias.css',
})
export class CrearSesionesDomiciliarias {
  private fb = inject(FormBuilder);

  // ── FK: Paciente ──────────────────────────────────────────
  @Input() pacientes: any[] = [];
  @Input() buscandoPaciente = false;
  @Output() buscarPaciente = new EventEmitter<string>();
  pacienteSeleccionado = signal<any | null>(null);
  terminoPaciente = '';

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    planEjercicioId: [null as number | null, Validators.required],
    fecha_hora: ['', Validators.required],
    repeticiones_completadas: [null as number | null],
    puntuacion: [null as number | null],
    xp_ganado: [null as number | null],
    correcciones_emitidas: [''],
  });

  onBuscarPaciente(t: string): void { this.terminoPaciente = t; this.buscarPaciente.emit(t); }
  seleccionarPaciente(p: any): void { this.pacienteSeleccionado.set(p); this.form.patchValue({ pacienteId: Number(p.id) }); }
  limpiarPaciente(): void { this.pacienteSeleccionado.set(null); this.form.patchValue({ pacienteId: null }); this.terminoPaciente = ''; this.buscarPaciente.emit(''); }

  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
