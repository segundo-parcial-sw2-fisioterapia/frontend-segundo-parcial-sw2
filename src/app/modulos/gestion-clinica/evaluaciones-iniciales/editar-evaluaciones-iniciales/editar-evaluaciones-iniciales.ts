import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-evaluaciones-iniciales',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-evaluaciones-iniciales.html',
  styleUrl: './editar-evaluaciones-iniciales.css',
})
export class EditarEvaluacionesIniciales implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() evaluacion: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    categoria_semaforo: ['', Validators.required],
    es_vigente: [false],
    observaciones: [''],
    justificacion_semaforo: [''],
  });

  ngOnChanges(): void {
    if (this.evaluacion) this.form.patchValue(this.evaluacion);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
