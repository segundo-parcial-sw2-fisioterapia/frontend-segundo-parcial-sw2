import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-sesiones-domiciliarias',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-sesiones-domiciliarias.html',
  styleUrl: './crear-sesiones-domiciliarias.css',
})
export class CrearSesionesDomiciliarias {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    planEjercicioId: [null as number | null, Validators.required],
    fecha_hora: ['', Validators.required],
    repeticiones_completadas: [null as number | null],
    puntuacion: [null as number | null],
    xp_ganado: [null as number | null],
    url_video: [''],
    analizado_por_ia: [false],
    correcciones_emitidas: [''],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
