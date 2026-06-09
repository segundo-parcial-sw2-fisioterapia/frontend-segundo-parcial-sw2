import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-editar-insumos',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-insumos.html',
})
export class EditarInsumos implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() insumo: any | null = null;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form = this.fb.group({
    id: [null as number | null],
    nombre: ['', Validators.required],
    categoria: ['', Validators.required],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [0, [Validators.required, Validators.min(0)]],
    unidadMedida: ['', Validators.required],
    precioUnitario: [null as number | null, [Validators.required, Validators.min(0)]],
    activo: [true],
  });

  ngOnChanges(): void {
    if (this.insumo) this.form.patchValue(this.insumo);
    else this.form.reset({ stockActual: 0, stockMinimo: 0, activo: true });
  }

  /** Valida y emite los datos actualizados al componente padre */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
