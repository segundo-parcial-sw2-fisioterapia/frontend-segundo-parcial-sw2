import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-usuarios.html',
  styleUrl: './editar-usuarios.css',
})
export class EditarUsuarios implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() usuario: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    correo: ['', [Validators.required, Validators.email]],
    estado: [''],
    roles: [''],
  });

  ngOnChanges(): void {
    if (this.usuario) this.form.patchValue(this.usuario);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
