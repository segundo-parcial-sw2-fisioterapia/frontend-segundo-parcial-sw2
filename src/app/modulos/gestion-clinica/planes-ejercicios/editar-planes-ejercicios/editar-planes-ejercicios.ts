import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-planes-ejercicios',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-planes-ejercicios.html',
  styleUrl: './editar-planes-ejercicios.css',
})
export class EditarPlanesEjercicios implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() plan: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    frecuencia: ['', Validators.required],
    repeticiones: [null as number | null],
    series: [null as number | null],
    activo: [false],
    orden: [null as number | null],
  });

  ngOnChanges(): void {
    if (this.plan) this.form.patchValue(this.plan);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
