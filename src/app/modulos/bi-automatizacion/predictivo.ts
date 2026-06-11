import { Component, inject, signal, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BiGraphQLService, TiempoRecuperacionResultado, RiesgoAbandonoResultado } from '../../nucleo/graphql/bi-automatizacion/bi-graphql.service';

@Component({
  selector: 'app-predictivo',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './predictivo.html',
  styleUrl: './predictivo.css',
})
export class Predictivo implements OnChanges {
  private fb = inject(FormBuilder);
  private biGql = inject(BiGraphQLService);

  @Input() evaluacion: any = null;
  @Input() sesion: any = null;
  @Input() modo: 'ambos' | 'recuperacion' | 'abandono' = 'ambos';

  readonly SEMAFOROS = [
    { value: 'VERDE', label: 'Verde (Bajo Riesgo)' },
    { value: 'AMARILLO', label: 'Amarillo (Riesgo Moderado)' },
    { value: 'ROJO', label: 'Rojo (Alto Riesgo)' }
  ];

  readonly DIAGNOSTICOS = [
    { value: 'GENERAL', label: 'General / No Específico' },
    { value: 'DISCAPACIDAD_MOTORA', label: 'Discapacidad Motora' },
    { value: 'LESION_DEPORTIVA', label: 'Lesión Deportiva' },
    { value: 'POST_OPERATORIO', label: 'Post-Operatorio' },
    { value: 'NEUROLOGICO', label: 'Rehabilitación Neurológica' },
    { value: 'DOLOR_CRONICO', label: 'Dolor Crónico' },
    { value: 'TRAUMATOLOGIA', label: 'Traumatología' }
  ];

  /** Tab activa en la vista: 'recuperacion' o 'abandono' */
  tabActiva = signal<'recuperacion' | 'abandono'>('recuperacion');

  /** Formulario para la predicción de recuperación */
  formRecuperacion = this.fb.group({
    diagnostico: ['', Validators.required],
    categoriaSemaforo: ['', Validators.required],
    edad: [null as number | null, [Validators.required, Validators.min(0), Validators.max(120)]],
  });

  /** Formulario para la clasificación de riesgo de abandono */
  formAbandono = this.fb.group({
    sesionesAsistidas: [null as number | null, [Validators.required, Validators.min(0)]],
    sesionesTotales: [null as number | null, [Validators.required, Validators.min(1)]],
    puntuacionPromedioDolor: [null as number | null, [Validators.required, Validators.min(1), Validators.max(10)]],
    categoriaSemaforo: ['', Validators.required],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (this.modo === 'recuperacion' || this.modo === 'ambos') {
      this.tabActiva.set('recuperacion');
      if (this.evaluacion) {
        this.autocompletarRecuperacion();
      }
    } else if (this.modo === 'abandono') {
      this.tabActiva.set('abandono');
      if (this.sesion) {
        this.autocompletarAbandono();
      }
    }
  }

  private autocompletarRecuperacion(): void {
    const semaforo = this.evaluacion.categoria_semaforo || '';
    const diagnostico = this.evaluacion.categoria_enfermedad || '';
    
    // Asumimos edad promedio por defecto si no hay fecha_nacimiento
    let edad = 30; 
    
    this.formRecuperacion.patchValue({
      categoriaSemaforo: semaforo,
      diagnostico: diagnostico,
      edad: edad
    });
  }

  private autocompletarAbandono(): void {
    // Del payload de sesion, obtener los datos
    const plan = this.sesion?.plan_tratamiento;
    const evaluacion = plan?.evaluacion_inicial;
    
    const semaforo = evaluacion?.categoria_semaforo || '';
    const totales = plan?.numero_sesiones_mes * plan?.duracion_meses_estimada || 10;
    const asistidas = this.sesion?.numero_sesion || 1;
    const dolor = this.sesion?.nivel_dolor_reportado || 5;

    this.formAbandono.patchValue({
      categoriaSemaforo: semaforo,
      sesionesTotales: totales,
      sesionesAsistidas: asistidas, 
      puntuacionPromedioDolor: dolor
    });
  }

  /** Estado de carga y resultado para recuperación */
  cargandoRecuperacion = signal(false);
  resultadoRecuperacion = signal<TiempoRecuperacionResultado | null>(null);

  /** Estado de carga y resultado para riesgo de abandono */
  cargandoAbandono = signal(false);
  resultadoAbandono = signal<RiesgoAbandonoResultado | null>(null);

  /**
   * Cambia la pestaña activa de predicción.
   *
   * @param tab Identificador de la pestaña a activar.
   */
  cambiarTab(tab: 'recuperacion' | 'abandono'): void {
    this.tabActiva.set(tab);
  }

  /**
   * Envía la solicitud para predecir el tiempo de recuperación del paciente.
   * Valida el formulario correspondiente y llama al servicio GraphQL.
   */
  predecirRecuperacion(): void {
    if (this.formRecuperacion.invalid) {
      this.formRecuperacion.markAllAsTouched();
      return;
    }
    const val = this.formRecuperacion.value;
    this.cargandoRecuperacion.set(true);
    this.resultadoRecuperacion.set(null);

    this.biGql.predecirTiempoRecuperacion(
      val.categoriaSemaforo!,
      val.diagnostico!,
      val.edad!
    ).subscribe({
      next: (res) => {
        this.resultadoRecuperacion.set(res.predecirTiempoRecuperacion);
        this.cargandoRecuperacion.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargandoRecuperacion.set(false);
      }
    });
  }

  /**
   * Envía la solicitud para clasificar el riesgo de abandono del tratamiento.
   * Valida el formulario correspondiente y llama al servicio GraphQL.
   */
  predecirAbandono(): void {
    if (this.formAbandono.invalid) {
      this.formAbandono.markAllAsTouched();
      return;
    }
    const val = this.formAbandono.value;
    this.cargandoAbandono.set(true);
    this.resultadoAbandono.set(null);

    this.biGql.predecirRiesgoAbandono(
      val.sesionesAsistidas!,
      val.sesionesTotales!,
      val.puntuacionPromedioDolor!,
      val.categoriaSemaforo!
    ).subscribe({
      next: (res) => {
        this.resultadoAbandono.set(res.predecirRiesgoAbandono);
        this.cargandoAbandono.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargandoAbandono.set(false);
      }
    });
  }
}
