import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-planes-ejercicios',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-planes-ejercicios.html',
  styleUrl: './crear-planes-ejercicios.css',
})
export class CrearPlanesEjercicios {
  private fb = inject(FormBuilder);

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

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
