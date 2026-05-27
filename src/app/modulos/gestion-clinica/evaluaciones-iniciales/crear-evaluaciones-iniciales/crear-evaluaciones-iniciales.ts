import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-evaluaciones-iniciales',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-evaluaciones-iniciales.html',
  styleUrl: './crear-evaluaciones-iniciales.css',
})
export class CrearEvaluacionesIniciales {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    empleadoId: [null as number | null, Validators.required],
    fecha_evaluacion: ['', Validators.required],
    categoria_enfermedad: ['', Validators.required],
    categoria_semaforo: ['', Validators.required],
    categoria_trabajo: ['', Validators.required],
    frecuencia_sesion: ['', Validators.required],
    descripcion_enfermedad: [''],
    justificacion_semaforo: [''],
    observaciones: [''],
    es_vigente: [false],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
