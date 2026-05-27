import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-usuarios.html',
  styleUrl: './crear-usuarios.css',
})
export class CrearUsuarios {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    personaId: [null as number | null, Validators.required],
    roles: ['', Validators.required],
    estado: ['ACTIVO'],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
