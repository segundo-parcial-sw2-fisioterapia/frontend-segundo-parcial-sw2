import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-ejercicios',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-ejercicios.html',
  styleUrl: './crear-ejercicios.css',
})
export class CrearEjercicios {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria_trabajo: ['', Validators.required],
    nivel_dificultad: ['', Validators.required],
    duracion_segundos: [null as number | null],
    repeticiones_sugeridas: [null as number | null],
    url_video_referencia: [''],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
