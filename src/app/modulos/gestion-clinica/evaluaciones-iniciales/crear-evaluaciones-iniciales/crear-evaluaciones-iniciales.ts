import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SelectorEmpleado } from '../../../../compartido/selector-empleado/selector-empleado';

@Component({
  selector: 'app-crear-evaluaciones-iniciales',
  imports: [ReactiveFormsModule, SelectorEmpleado],
  templateUrl: './crear-evaluaciones-iniciales.html',
  styleUrl: './crear-evaluaciones-iniciales.css',
})
export class CrearEvaluacionesIniciales {
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
    empleadoId: [null as number | null],
    fecha_evaluacion: ['', Validators.required],
    categoria_enfermedad: [null],
    categoria_semaforo: [null],
    categoria_trabajo: [null],
    nivel: [null],
    descripcion_enfermedad: [null],
    justificacion_semaforo: [null],
    observaciones: [null],
  });

  onBuscarPaciente(t: string): void { this.terminoPaciente = t; this.buscarPaciente.emit(t); }
  seleccionarPaciente(p: any): void { this.pacienteSeleccionado.set(p); this.form.patchValue({ pacienteId: Number(p.id) }); }
  limpiarPaciente(): void { this.pacienteSeleccionado.set(null); this.form.patchValue({ pacienteId: null }); this.terminoPaciente = ''; this.buscarPaciente.emit(''); }

  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
