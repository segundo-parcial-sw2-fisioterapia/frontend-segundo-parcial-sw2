import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormularioPersona } from '../../personas/formulario-persona/formulario-persona';

export type DatosCrearPaciente =
  | {
      tipo: 'existente';
      personaId: number;
      fecha_nacimiento: string;
      sexo: string;
      estado: string;
      direccion: string;
    }
  | {
      tipo: 'nueva';
      persona: { nombre: string; apellido: string; ci: string; telefono: string; email: string };
      fecha_nacimiento: string;
      sexo: string;
      estado: string;
      direccion: string;
    };

@Component({
  selector: 'app-crear-pacientes',
  imports: [ReactiveFormsModule, FormularioPersona],
  templateUrl: './crear-pacientes.html',
  styleUrl: './crear-pacientes.css',
})
export class CrearPacientes implements OnDestroy {
  private fb = inject(FormBuilder);

  @Input() personas: any[] = [];
  @Input() buscandoPersonas = false;

  @Output() buscarPersonas = new EventEmitter<string>();
  @Output() guardar = new EventEmitter<DatosCrearPaciente>();
  @Output() cancelar = new EventEmitter<void>();

  paso = signal<1 | 2>(1);
  modo = signal<'buscar' | 'nueva'>('buscar');
  personaSeleccionada = signal<any | null>(null);

  formPersona = this.fb.group({
    nombre:   ['', Validators.required],
    apellido: ['', Validators.required],
    ci:       ['', Validators.required],
    telefono: [''],
    email:    ['', [Validators.required, Validators.email]],
  });

  formPaciente = this.fb.group({
    fecha_nacimiento: ['', Validators.required],
    sexo:             ['', Validators.required],
    estado:           ['ACTIVO'],
    direccion:        [''],
  });

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Emite término al padre con debounce de 300ms */
  buscarConDebounce(termino: string): void {
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

  /** Nombre para mostrar en el banner del paso 2 */
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
    if (this.formPaciente.invalid) {
      this.formPaciente.markAllAsTouched();
      return;
    }
    const datosPaciente = this.formPaciente.value as {
      fecha_nacimiento: string;
      sexo: string;
      estado: string;
      direccion: string;
    };

    if (this.modo() === 'buscar') {
      this.guardar.emit({
        tipo: 'existente',
        personaId: this.personaSeleccionada().id,
        ...datosPaciente,
      });
    } else {
      this.guardar.emit({
        tipo: 'nueva',
        persona: this.formPersona.value as { nombre: string; apellido: string; ci: string; telefono: string; email: string },
        ...datosPaciente,
      });
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }
}
