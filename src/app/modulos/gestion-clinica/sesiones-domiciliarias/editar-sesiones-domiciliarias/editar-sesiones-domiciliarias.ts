import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-editar-sesiones-domiciliarias',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-sesiones-domiciliarias.html',
  styleUrl: './editar-sesiones-domiciliarias.css',
})
export class EditarSesionesDomiciliarias implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() sesion: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    analizado_por_ia: [false],
    correcciones_emitidas: [''],
    puntuacion: [null as number | null],
    xp_ganado: [null as number | null],
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
