import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SelectorEmpleado } from '../../../../compartido/selector-empleado/selector-empleado';
import { EmpleadosService } from '../../../../nucleo/graphql/gestion-administrativa/empleados';
import { PersonasService } from '../../../../nucleo/graphql/gestion-clinica/persona';

@Component({
  selector: 'app-crear-usuarios',
  imports: [ReactiveFormsModule, SelectorEmpleado],
  templateUrl: './crear-usuarios.html',
  styleUrl: './crear-usuarios.css',
})
export class CrearUsuarios {
  private fb = inject(FormBuilder);
  private empleadosService = inject(EmpleadosService);
  private personasService = inject(PersonasService);

  /** Resultados de búsqueda de personas provenientes del smart component */
  @Input() personas: any[] = [];
  @Input() buscandoPersonas = false;

  /** Notifica al smart que debe buscar personas con ese término */
  @Output() buscarPersonas = new EventEmitter<string>();
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  /** Persona seleccionada del dropdown o resuelta del empleado — su id se escribe en el form */
  personaSeleccionada = signal<any | null>(null);
  terminoBusqueda = '';
  tipoUsuario = signal<'PERSONAL' | 'PACIENTE'>('PERSONAL');
  empleadoSeleccionadoId = signal<number | null>(null);

  form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
    personaId: [null as number | null, Validators.required],
    roles: ['', Validators.required],
    estado: ['ACTIVO'],
  });

  cambiarTipoUsuario(tipo: 'PERSONAL' | 'PACIENTE'): void {
    this.tipoUsuario.set(tipo);
    this.limpiarPersona();
    this.empleadoSeleccionadoId.set(null);
    if (tipo === 'PACIENTE') {
      this.form.patchValue({ roles: 'PACIENTE' });
    } else {
      if (this.form.value.roles === 'PACIENTE') {
        this.form.patchValue({ roles: '' });
      }
    }
  }

  /** Propaga el término al smart para que llame a la API */
  onBuscarPersona(termino: string): void {
    this.terminoBusqueda = termino;
    this.buscarPersonas.emit(termino);
  }

  /** Fija la persona elegida y escribe su id en el control del form */
  seleccionarPersona(persona: any): void {
    this.personaSeleccionada.set(persona);
    this.form.patchValue({ 
      personaId: Number(persona.id),
      correo: persona.email || ''
    });
  }

  /** Limpia la selección y notifica al smart para que vacíe los resultados */
  limpiarPersona(): void {
    this.personaSeleccionada.set(null);
    this.form.patchValue({ personaId: null, correo: '' });
    this.terminoBusqueda = '';
    this.buscarPersonas.emit('');
  }

  /** Gestión de la selección de Empleado */
  onSeleccionarEmpleado(id: number | null): void {
    this.empleadoSeleccionadoId.set(id);
    if (!id) {
      this.limpiarPersona();
      return;
    }

    this.empleadosService.verEmpleado(id).subscribe({
      next: (emp: any) => {
        if (emp && emp.personaId) {
          const pId = Number(emp.personaId);
          this.personasService.verPersona(pId).subscribe({
            next: (persona: any) => {
              if (persona) {
                this.personaSeleccionada.set(persona);
                this.form.patchValue({
                  personaId: pId,
                  correo: persona.email || ''
                });
              }
            }
          });
        }
      }
    });
  }

  /** Valida y emite los datos del formulario al smart component */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const datos = {
      ...this.form.value,
      roles: this.form.value.roles ? [this.form.value.roles] : []
    };
    this.guardar.emit(datos);
  }
}
