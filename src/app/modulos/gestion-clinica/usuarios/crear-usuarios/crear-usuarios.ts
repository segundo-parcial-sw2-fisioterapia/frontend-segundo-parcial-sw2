import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-usuarios.html',
  styleUrl: './crear-usuarios.css',
})
export class CrearUsuarios {
  private fb = inject(FormBuilder);

  /** Resultados de búsqueda de personas provenientes del smart component */
  @Input() personas: any[] = [];
  @Input() buscandoPersonas = false;

  /** Notifica al smart que debe buscar personas con ese término */
  @Output() buscarPersonas = new EventEmitter<string>();
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  /** Persona seleccionada del dropdown — su id se escribe en el form */
  personaSeleccionada = signal<any | null>(null);
  terminoBusqueda = '';

  form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    personaId: [null as number | null, Validators.required],
    roles: ['', Validators.required],
    estado: ['activo'],
  });

  /** Propaga el término al smart para que llame a la API */
  onBuscarPersona(termino: string): void {
    this.terminoBusqueda = termino;
    this.buscarPersonas.emit(termino);
  }

  /** Fija la persona elegida y escribe su id en el control del form */
  seleccionarPersona(persona: any): void {
    this.personaSeleccionada.set(persona);
    this.form.patchValue({ personaId: Number(persona.id) });
  }

  /** Limpia la selección y notifica al smart para que vacíe los resultados */
  limpiarPersona(): void {
    this.personaSeleccionada.set(null);
    this.form.patchValue({ personaId: null });
    this.terminoBusqueda = '';
    this.buscarPersonas.emit('');
  }

  /** Valida y emite los datos del formulario al smart component */
  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardar.emit(this.form.value);
  }
}
