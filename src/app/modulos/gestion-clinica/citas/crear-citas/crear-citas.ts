import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-citas',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-citas.html',
  styleUrl: './crear-citas.css',
})
export class CrearCitas {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    empleadoId: [null as number | null, Validators.required],
    fecha_hora: ['', Validators.required],
    tipo: ['', Validators.required],
    origen: ['RECEPCION'],
    estado: ['PROGRAMADA'],
    duracion_minutos: [null as number | null],
    observaciones: [''],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
