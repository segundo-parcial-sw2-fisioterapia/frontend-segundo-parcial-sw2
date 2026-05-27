import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-pacientes',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-pacientes.html',
  styleUrl: './editar-pacientes.css',
})
export class EditarPacientes implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() paciente: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    estado: [''],
    direccion: [''],
    sexo: [''],
  });

  ngOnChanges(): void {
    if (this.paciente) this.form.patchValue(this.paciente);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
