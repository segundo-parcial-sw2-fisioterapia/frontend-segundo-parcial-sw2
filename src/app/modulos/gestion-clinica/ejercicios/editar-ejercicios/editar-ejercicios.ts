import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-ejercicios',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-ejercicios.html',
  styleUrl: './editar-ejercicios.css',
})
export class EditarEjercicios implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() ejercicio: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    nombre: ['', Validators.required],
    nivel_dificultad: [''],
    repeticiones_sugeridas: [null as number | null],
    duracion_segundos: [null as number | null],
  });

  ngOnChanges(): void {
    if (this.ejercicio) this.form.patchValue(this.ejercicio);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
