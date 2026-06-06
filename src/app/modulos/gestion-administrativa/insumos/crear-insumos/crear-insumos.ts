import { Component, Output, EventEmitter, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-insumos',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-insumos.html',
})
export class CrearInsumos {
  private fb = inject(FormBuilder);

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    nombre: ['', Validators.required],
    categoria: ['', Validators.required],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [0, [Validators.required, Validators.min(0)]],
    unidadMedida: ['', Validators.required],
    precioUnitario: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  /** Valida y emite los datos del formulario al smart component */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
