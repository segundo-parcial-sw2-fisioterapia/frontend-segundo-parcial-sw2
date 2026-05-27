import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-planes-tratamiento',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-planes-tratamiento.html',
  styleUrl: './editar-planes-tratamiento.css',
})
export class EditarPlanesTratamiento implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() plan: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    estado: ['', Validators.required],
    fecha_fin_estimada: [''],
    objetivo_terapeutico: ['', Validators.required],
    observaciones: [''],
  });

  ngOnChanges(): void {
    if (this.plan) this.form.patchValue(this.plan);
    else this.form.reset();
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
