import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormularioPersona } from '../formulario-persona/formulario-persona';

@Component({
  selector: 'app-editar-personas',
  imports: [ReactiveFormsModule, FormularioPersona],
  templateUrl: './editar-personas.html',
  styleUrl: './editar-personas.css',
})
export class EditarPersonas implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() persona: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    telefono: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnChanges(): void {
    if (this.persona) this.form.patchValue(this.persona);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
