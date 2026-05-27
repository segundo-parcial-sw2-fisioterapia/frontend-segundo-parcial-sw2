import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-citas',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-citas.html',
  styleUrl: './editar-citas.css',
})
export class EditarCitas implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() cita: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    fecha_hora: [''],
    estado: [''],
    tipo: [''],
    duracion_minutos: [null as number | null],
    observaciones: [''],
  });

  ngOnChanges(): void {
    if (this.cita) this.form.patchValue(this.cita);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
