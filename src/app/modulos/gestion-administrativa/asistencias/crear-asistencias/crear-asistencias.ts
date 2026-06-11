import { Component, Output, EventEmitter, inject, signal, Input, OnInit, OnChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SelectorEmpleado } from '../../../../compartido/selector-empleado/selector-empleado';

@Component({
  selector: 'app-crear-asistencias',
  imports: [ReactiveFormsModule, SelectorEmpleado],
  templateUrl: './crear-asistencias.html',
})
export class CrearAsistencias implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() empleadoIdFijo: string | null = null;

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  empleadoId = signal<number | null>(null);
  intentoEnvio = signal(false);

  estadosAsistencia = [
    { value: 'presente',    label: 'Presente' },
    { value: 'ausente',     label: 'Ausente' },
    { value: 'tardanza',    label: 'Tardanza' },
    { value: 'justificado', label: 'Justificado' },
  ];

  hoy = new Date().toISOString().split('T')[0];
  horaActual = new Date().toTimeString().split(' ')[0].slice(0, 5);

  form = this.fb.group({
    fecha:       [this.hoy, Validators.required],
    horaEntrada: [this.horaActual, Validators.required],
    horaSalida:  [''],
    estado:      ['presente', Validators.required],
  });

  ngOnInit(): void {
    if (this.empleadoIdFijo) {
      this.empleadoId.set(Number(this.empleadoIdFijo));
    }
  }

  ngOnChanges(): void {
    if (this.empleadoIdFijo) {
      this.empleadoId.set(Number(this.empleadoIdFijo));
    }
  }

  seleccionarEmpleado(id: number | null): void {
    this.empleadoId.set(id);
  }

  enviar(): void {
    this.intentoEnvio.set(true);
    if (this.form.invalid || !this.empleadoId()) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    this.guardar.emit({
      empleadoId: this.empleadoId(),
      fecha:       val.fecha,
      horaEntrada: val.horaEntrada,
      horaSalida:  val.horaSalida || null,
      estado:      val.estado,
    });
  }
}
