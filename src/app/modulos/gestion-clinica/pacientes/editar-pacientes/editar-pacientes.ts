import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormularioPersona } from '../../personas/formulario-persona/formulario-persona';

@Component({
  selector: 'app-editar-pacientes',
  imports: [ReactiveFormsModule, FormularioPersona],
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
    persona: this.fb.group({
      id: [null as number | null],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      ci: ['', Validators.required],
      telefono: [''],
      email: ['', [Validators.required, Validators.email]],
    })
  });

  ngOnChanges(): void {
    if (this.paciente) {
      this.form.patchValue({
        id: this.paciente.id,
        estado: this.paciente.estado,
        direccion: this.paciente.direccion,
        sexo: this.paciente.sexo,
        persona: {
          id: this.paciente.persona?.id ?? null,
          nombre: this.paciente.persona?.nombre ?? '',
          apellido: this.paciente.persona?.apellido ?? '',
          ci: this.paciente.persona?.ci ?? '',
          telefono: this.paciente.persona?.telefono ?? '',
          email: this.paciente.persona?.email ?? '',
        }
      });
    } else {
      this.form.reset();
    }
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
