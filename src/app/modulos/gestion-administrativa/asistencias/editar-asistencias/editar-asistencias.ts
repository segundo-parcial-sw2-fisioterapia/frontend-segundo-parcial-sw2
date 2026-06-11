import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-asistencias',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-asistencias.html',
})
export class EditarAsistencias implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() asistencia: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  estadosAsistencia = [
    { value: 'presente', label: 'Presente' },
    { value: 'ausente', label: 'Ausente' },
    { value: 'tardanza', label: 'Tardanza' },
    { value: 'justificado', label: 'Justificado' },
  ];

  form = this.fb.group({
    horaEntrada: ['', Validators.required],
    horaSalida: [''],
    estado: ['', Validators.required],
  });

  ngOnChanges(): void {
    if (this.asistencia) {
      const horaActual = new Date().toTimeString().split(' ')[0].slice(0, 5);
      this.form.patchValue({
        horaEntrada: this.asistencia.horaEntrada ?? '',
        horaSalida: this.asistencia.horaSalida || horaActual,
        estado: this.asistencia.estado ?? 'presente',
      });
    } else {
      this.form.reset({ estado: 'presente' });
    }
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    this.guardar.emit({
      id: this.asistencia?.id,
      horaEntrada: val.horaEntrada,
      horaSalida: val.horaSalida || null,
      estado: val.estado,
    });
  }
}
