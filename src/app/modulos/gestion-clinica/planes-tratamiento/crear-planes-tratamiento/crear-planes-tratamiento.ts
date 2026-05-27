import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-planes-tratamiento',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-planes-tratamiento.html',
  styleUrl: './crear-planes-tratamiento.css',
})
export class CrearPlanesTratamiento {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    empleadoId: [null as number | null, Validators.required],
    fecha_inicio: ['', Validators.required],
    fecha_fin_estimada: [''],
    objetivo_terapeutico: ['', Validators.required],
    observaciones: [''],
    estado: ['', Validators.required],
    evaluacionInicialId: [null as number | null],
  });

  /** Valida y emite los datos del formulario al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
