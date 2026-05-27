import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-personas',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-personas.html',
  styleUrl: './crear-personas.css',
})
export class CrearPersonas {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    ci: ['', Validators.required],
    telefono: [''],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
