import { Component, inject, OnInit, signal } from '@angular/core';
import { EjerciciosService } from '../../../nucleo/graphql/gestion-clinica/ejercicios';
import { Tabla, ColumnaTabla } from '../../../compartido/tabla/tabla';
import { Modal } from '../../../compartido/modal/modal';
import { CrearEjercicios } from './crear-ejercicios/crear-ejercicios';
import { EditarEjercicios } from './editar-ejercicios/editar-ejercicios';
import { VerEjercicios } from './ver-ejercicios/ver-ejercicios';

@Component({
  selector: 'app-ejercicios',
  imports: [Tabla, Modal, CrearEjercicios, EditarEjercicios, VerEjercicios],
  templateUrl: './ejercicios.html',
  styleUrl: './ejercicios.css',
})
export class Ejercicios implements OnInit {
  private ejerciciosService = inject(EjerciciosService);

  ejercicios = signal<any[]>([]);
  cargando = signal(false);
  modalCrear = signal(false);
  modalEditar = signal(false);
  modalVer = signal(false);
  ejercicioSeleccionado = signal<any | null>(null);

  columnas: ColumnaTabla[] = [
    { key: 'nombre', titulo: 'Nombre' },
    { key: 'categoria_trabajo', titulo: 'Categoría' },
    { key: 'nivel_dificultad', titulo: 'Nivel de Dificultad' },
    { key: 'repeticiones_sugeridas', titulo: 'Repeticiones Sugeridas' },
  ];

  ngOnInit(): void {
    this.cargarEjercicios();
  }

  /** Carga el catálogo completo de ejercicios desde el backend */
  cargarEjercicios(): void {
    this.cargando.set(true);
    this.ejerciciosService.listarEjercicios().subscribe({
      next: (d: any[]) => { this.ejercicios.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void { this.modalCrear.set(true); }
  abrirEditar(ejercicio: any): void { this.ejercicioSeleccionado.set(ejercicio); this.modalEditar.set(true); }
  abrirVer(ejercicio: any): void { this.ejercicioSeleccionado.set(ejercicio); this.modalVer.set(true); }

  /** Crea un nuevo ejercicio y recarga el catálogo */
  crearEjercicio(datos: any): void {
    this.ejerciciosService.crearEjercicio(datos).subscribe({
      next: () => { this.modalCrear.set(false); this.cargarEjercicios(); },
    });
  }

  /** Actualiza un ejercicio existente */
  editarEjercicio(datos: any): void {
    this.ejerciciosService.editarEjercicio(datos).subscribe({
      next: () => { this.modalEditar.set(false); this.cargarEjercicios(); },
    });
  }

  /** Elimina un ejercicio tras confirmación del usuario */
  eliminarEjercicio(id: number): void {
    if (!confirm('¿Desea eliminar este registro?')) return;
    this.ejerciciosService.eliminarEjercicio(id).subscribe({
      next: () => this.cargarEjercicios(),
    });
  }
}
