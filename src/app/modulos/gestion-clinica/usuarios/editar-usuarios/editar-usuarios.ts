import { Component, Input, Output, EventEmitter, OnChanges, inject, signal } from '@angular/core';
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

  tipoUsuario = signal<'PERSONAL' | 'PACIENTE'>('PERSONAL');

  form = this.fb.group({
    id: [null as number | null],
    correo: ['', [Validators.required, Validators.email]],
    estado: [''],
    roles: [''],
  });

  ngOnChanges(): void {
    if (this.usuario) {
      const primaryRole = Array.isArray(this.usuario.roles) ? this.usuario.roles[0] : this.usuario.roles;
      const isPaciente = primaryRole?.toUpperCase() === 'PACIENTE';
      this.tipoUsuario.set(isPaciente ? 'PACIENTE' : 'PERSONAL');

      const mappedUsuario = {
        ...this.usuario,
        roles: primaryRole
      };
      this.form.patchValue(mappedUsuario);
    } else {
      this.form.reset();
    }
  }

  cambiarTipoUsuario(tipo: 'PERSONAL' | 'PACIENTE'): void {
    this.tipoUsuario.set(tipo);
    if (tipo === 'PACIENTE') {
      this.form.patchValue({ roles: 'PACIENTE' });
    } else {
      if (this.form.value.roles === 'PACIENTE') {
        this.form.patchValue({ roles: '' });
      }
    }
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const datos = {
      ...this.form.value,
      roles: this.form.value.roles ? [this.form.value.roles] : []
    };
    this.guardar.emit(datos);
  }
}
