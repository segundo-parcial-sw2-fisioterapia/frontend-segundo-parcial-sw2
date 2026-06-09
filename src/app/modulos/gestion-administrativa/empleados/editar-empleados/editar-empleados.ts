import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormularioPersona } from '../../../gestion-clinica/personas/formulario-persona/formulario-persona';

@Component({
  selector: 'app-editar-empleados',
  imports: [ReactiveFormsModule, FormularioPersona],
  templateUrl: './editar-empleados.html',
})
export class EditarEmpleados implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() empleado: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    cargo: ['', Validators.required],
    especialidad: [''],
    salarioBase: [null as number | null, [Validators.required, Validators.min(0)]],
    tipoContrato: ['', Validators.required],
    fechaBaja: [''],
    estadoLaboral: ['', Validators.required],
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
    if (this.empleado) {
      this.form.patchValue({
        id: this.empleado.id,
        cargo: this.empleado.cargo,
        especialidad: this.empleado.especialidad,
        salarioBase: this.empleado.salarioBase,
        tipoContrato: this.empleado.tipoContrato,
        fechaBaja: this.empleado.fechaBaja ?? '',
        estadoLaboral: this.empleado.estadoLaboral,
        persona: {
          id: this.empleado.personaId ?? null,
          nombre: this.empleado.persona?.nombre ?? '',
          apellido: this.empleado.persona?.apellido ?? '',
          ci: this.empleado.persona?.ci ?? '',
          telefono: this.empleado.persona?.telefono ?? '',
          email: this.empleado.persona?.email ?? this.empleado.persona?.correo ?? '',
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
