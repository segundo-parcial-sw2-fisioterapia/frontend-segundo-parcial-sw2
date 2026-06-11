import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SesionesService } from '../../../../nucleo/graphql/gestion-clinica/sesiones';
import { BiGraphQLService } from '../../../../nucleo/graphql/bi-automatizacion/bi-graphql.service';
import { LoginService } from '../../../../nucleo/rest/login.service';
import { Predictivo } from '../../../bi-automatizacion/predictivo';

@Component({
  selector: 'app-editar-sesiones',
  imports: [ReactiveFormsModule, Predictivo],
  templateUrl: './editar-sesiones.html',
  styleUrl: './editar-sesiones.css',
})
export class EditarSesiones implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sesionesService = inject(SesionesService);
  private biGql = inject(BiGraphQLService);
  private auth = inject(LoginService);
  private fb = inject(FormBuilder);

  sesion = signal<any | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  cerrando = signal(false);

  esFisioterapeuta = this.auth.tieneRoles('fisioterapeuta');

  form = this.fb.group({
    nivel_dolor_reportado: [null as number | null],
    nivel_dolor_post: [null as number | null, [Validators.min(0), Validators.max(10)]],
    observaciones_clinicas: [''],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (!id) { this.volver(); return; }
    this.cargarSesion(id);
  }

  private cargarSesion(id: number): void {
    this.cargando.set(true);
    this.sesionesService.verSesion(id).subscribe({
      next: (s) => {
        if (!s) { this.volver(); return; }
        const sesion = {
          ...s,
          estado_sesion: String(s.estado_sesion ?? 'abierta').toUpperCase(),
        };
        this.sesion.set(sesion);

        // Solo se puede editar si está ABIERTA
        if (sesion.estado_sesion !== 'ABIERTA') {
          this.volver();
          return;
        }

        this.form.patchValue({
          nivel_dolor_reportado: sesion.nivel_dolor_reportado ?? null,
          nivel_dolor_post: sesion.nivel_dolor_post ?? null,
          observaciones_clinicas: sesion.observaciones_clinicas ?? '',
        });
        this.cargando.set(false);
      },
      error: () => this.volver(),
    });
  }

  /** Guarda los datos clínicos de la sesión (sin cerrarla) */
  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const sesion = this.sesion();
    if (!sesion) return;

    this.guardando.set(true);
    this.sesionesService.editarSesion({ id: sesion.id, ...this.form.value }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.volver();
      },
      error: () => this.guardando.set(false),
    });
  }

  /**
   * Guarda los datos y cierra la sesión.
   * Primero actualiza los campos clínicos y luego llama cerrarSesion().
   */
  guardarYCerrar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const sesion = this.sesion();
    if (!sesion) return;

    this.cerrando.set(true);

    const datosForm = this.form.value;
    const hayDatosParaGuardar =
      datosForm.nivel_dolor_post !== null ||
      datosForm.observaciones_clinicas ||
      datosForm.nivel_dolor_reportado !== null;

    const cerrar$ = () =>
      this.sesionesService.cerrarSesion(sesion.id).subscribe({
        next: () => {
          this.cerrando.set(false);
          this.volver();
        },
        error: () => this.cerrando.set(false),
      });

    if (hayDatosParaGuardar) {
      this.sesionesService
        .editarSesion({ id: sesion.id, ...datosForm })
        .subscribe({ next: () => cerrar$() });
    } else {
      cerrar$();
    }
  }

  volver(): void {
    this.router.navigate(['/app/sesiones']);
  }

  formatFecha(valor: string | null | undefined): string {
    if (!valor) return '—';
    try {
      const d = new Date(valor);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return valor; }
  }
}
