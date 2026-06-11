import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-turnos',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-turnos.html',
})
export class EditarTurnos implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() turno: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
  ];

  form = this.fb.group({
    diaSemana: ['', Validators.required],
    horaInicio: ['', Validators.required],
    horaFin: ['', Validators.required],
    activo: [true],
  });

  ngOnChanges(): void {
    if (this.turno) {
      this.form.patchValue({
        diaSemana: this.turno.diaSemana ?? '',
        horaInicio: this.turno.horaInicio ?? '',
        horaFin: this.turno.horaFin ?? '',
        activo: this.turno.activo ?? true,
      });
    } else {
      this.form.reset({ activo: true });
    }
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardar.emit({ id: this.turno?.id, ...this.form.value });
  }
}
