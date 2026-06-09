import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormularioPersona } from '../formulario-persona/formulario-persona';

@Component({
  selector: 'app-crear-personas',
  imports: [ReactiveFormsModule, FormularioPersona],
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
    email: ['', [Validators.required, Validators.email]],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
