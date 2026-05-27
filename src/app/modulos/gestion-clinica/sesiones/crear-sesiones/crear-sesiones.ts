import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-sesiones',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-sesiones.html',
  styleUrl: './crear-sesiones.css',
})
export class CrearSesiones {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    empleadoId: [null as number | null, Validators.required],
    citaId: [null as number | null],
    fecha_hora_inicio: ['', Validators.required],
    estado_sesion: ['', Validators.required],
    nivel_dolor_reportado: [null as number | null],
    observaciones_clinicas: [''],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
