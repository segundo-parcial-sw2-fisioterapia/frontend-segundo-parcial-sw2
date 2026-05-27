import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-sesiones',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-sesiones.html',
  styleUrl: './editar-sesiones.css',
})
export class EditarSesiones implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() sesion: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    fecha_hora_fin: [''],
    nivel_dolor_post: [null as number | null],
    observaciones_clinicas: [''],
    estado_sesion: ['', Validators.required],
  });

  ngOnChanges(): void {
    if (this.sesion) this.form.patchValue(this.sesion);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
