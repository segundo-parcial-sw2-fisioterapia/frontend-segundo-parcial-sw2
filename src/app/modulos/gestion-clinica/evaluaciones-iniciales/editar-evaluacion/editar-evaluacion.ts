import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EvaluacionesInicialesService } from '../../../../nucleo/graphql/gestion-clinica/evaluaciones-iniciales';

@Component({
  selector: 'app-editar-evaluacion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './editar-evaluacion.html',
  styleUrl: './editar-evaluacion.css',
})
export class EditarEvaluacion implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EvaluacionesInicialesService);

  cargando = signal(true);
  guardando = signal(false);

  form = this.fb.group({
    id: [null as number | null],
    categoria_enfermedad: ['', Validators.required],
    categoria_trabajo: ['', Validators.required],
    categoria_semaforo: ['', Validators.required],
    nivel: ['', Validators.required],
    descripcion_enfermedad: [''],
    justificacion_semaforo: [''],
    observaciones: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cargarEvaluacion(+idParam);
    }
  }

  cargarEvaluacion(id: number): void {
    this.cargando.set(true);
    this.service.verEvaluacionInicial(id).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.router.navigate(['/app/evaluaciones-iniciales']);
      }
    });
  }

  /** Valida y emite los datos actualizados al backend */
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datosGuardar = { ...this.form.value, estado: 'TERMINADA' };
    this.service.editarEvaluacionInicial(datosGuardar).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/app/evaluaciones-iniciales']);
      },
      error: () => this.guardando.set(false),
    });
  }

  cancelar(): void {
    this.router.navigate(['/app/evaluaciones-iniciales']);
  }
}
