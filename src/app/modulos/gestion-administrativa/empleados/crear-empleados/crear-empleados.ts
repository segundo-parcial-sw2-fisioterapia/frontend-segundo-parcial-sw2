import { Component, Input, Output, EventEmitter, OnDestroy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormularioPersona } from '../../../gestion-clinica/personas/formulario-persona/formulario-persona';

export type DatosCrearEmpleado =
  | {
      tipo: 'existente';
      personaId: number;
      cargo: string;
      especialidad?: string;
      salarioBase: number;
      tipoContrato: string;
      fechaIngreso: string;
    }
  | {
      tipo: 'nueva';
      persona: { nombre: string; apellido: string; ci: string; telefono: string; email: string };
      cargo: string;
      especialidad?: string;
      salarioBase: number;
      tipoContrato: string;
      fechaIngreso: string;
    };

@Component({
  selector: 'app-crear-empleados',
  imports: [ReactiveFormsModule, FormularioPersona],
  templateUrl: './crear-empleados.html',
})
export class CrearEmpleados implements OnDestroy {
  private fb = inject(FormBuilder);

  /** Personas encontradas en el microservicio clínico (del smart component) */
  @Input() personas: any[] = [];
  @Input() buscandoPersonas = false;

  /** Notifica al smart que realice la búsqueda en el MS clínico */
  @Output() buscarPersonas = new EventEmitter<string>();
  @Output() guardar = new EventEmitter<DatosCrearEmpleado>();
  @Output() cancelar = new EventEmitter<void>();

  paso = signal<1 | 2>(1);
  modo = signal<'buscar' | 'nueva'>('buscar');
  personaSeleccionada = signal<any | null>(null);
  terminoBusqueda = '';

  formPersona = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    ci: ['', Validators.required],
    telefono: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  formEmpleado = this.fb.group({
    cargo: ['', Validators.required],
    especialidad: [''],
    salarioBase: [null as number | null, [Validators.required, Validators.min(0)]],
    tipoContrato: ['', Validators.required],
    fechaIngreso: ['', Validators.required],
  });

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Emite término al padre con debounce de 300ms */
  buscarConDebounce(termino: string): void {
    this.terminoBusqueda = termino;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (!termino || termino.length < 2) {
      this.buscarPersonas.emit('');
      return;
    }
    this.searchTimeout = setTimeout(() => this.buscarPersonas.emit(termino), 300);
  }

  seleccionarPersona(persona: any): void {
    this.personaSeleccionada.set(persona);
  }

  cambiarModo(modo: 'buscar' | 'nueva'): void {
    this.modo.set(modo);
    this.personaSeleccionada.set(null);
    this.formPersona.reset();
    this.buscarPersonas.emit('');
  }

  siguientePaso(): void {
    if (this.modo() === 'buscar' && !this.personaSeleccionada()) return;
    if (this.modo() === 'nueva' && this.formPersona.invalid) {
      this.formPersona.markAllAsTouched();
      return;
    }
    this.paso.set(2);
  }

  volverPaso(): void {
    this.paso.set(1);
  }

  nombreResumen(): string {
    if (this.modo() === 'buscar' && this.personaSeleccionada()) {
      const p = this.personaSeleccionada();
      return `${p.nombre} ${p.apellido}`;
    }
    const v = this.formPersona.value;
    return `${v.nombre ?? ''} ${v.apellido ?? ''}`.trim() || 'Nueva persona';
  }

  ciResumen(): string {
    if (this.modo() === 'buscar' && this.personaSeleccionada()) {
      return this.personaSeleccionada().ci ?? '';
    }
    return this.formPersona.value.ci ?? '';
  }

  inicialesResumen(): string {
    return this.nombreResumen()
      .split(' ')
      .filter((p) => p.length > 0)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  enviar(): void {
    if (this.formEmpleado.invalid) {
      this.formEmpleado.markAllAsTouched();
      return;
    }
    const datosEmpleado = this.formEmpleado.value as {
      cargo: string;
      especialidad?: string;
      salarioBase: number;
      tipoContrato: string;
      fechaIngreso: string;
    };

    if (this.modo() === 'buscar') {
      this.guardar.emit({
        tipo: 'existente',
        personaId: this.personaSeleccionada().id,
        ...datosEmpleado,
      });
    } else {
      this.guardar.emit({
        tipo: 'nueva',
        persona: this.formPersona.value as { nombre: string; apellido: string; ci: string; telefono: string; email: string },
        ...datosEmpleado,
      });
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }
}
