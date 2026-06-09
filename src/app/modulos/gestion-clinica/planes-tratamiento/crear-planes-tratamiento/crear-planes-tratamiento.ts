import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PlanesTratamientosService } from '../../../../nucleo/graphql/gestion-clinica/planes-tratamientos';
import { EvaluacionesInicialesService } from '../../../../nucleo/graphql/gestion-clinica/evaluaciones-iniciales';
import { TarifasService, Tarifa } from '../../../../nucleo/graphql/gestion-administrativa/tarifas';
import { SesionesService } from '../../../../nucleo/graphql/gestion-clinica/sesiones';
import { PlanesEjerciciosService } from '../../../../nucleo/graphql/gestion-clinica/planes-ejercicios';
import { EjerciciosService } from '../../../../nucleo/graphql/gestion-clinica/ejercicios';
import { MensualidadesService } from '../../../../nucleo/graphql/gestion-administrativa/mensualidades';

interface SlotDia {
  dia: number; // 0=Dom 1=Lun … 6=Sáb (getDay())
  hora: string; // "HH:MM"
}

interface SesionPreview {
  numero: number;
  fecha: Date;
  diaLabel: string;
  hora: string;
  horaFin: string;
}

interface FilaEjercicio {
  uid: string;
  ejercicioId: number | null;
  repeticiones: number;
  series: number;
  frecuencia: string;
  orden: number;
}

@Component({
  selector: 'app-crear-planes-tratamiento',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './crear-planes-tratamiento.html',
  styleUrl: './crear-planes-tratamiento.css',
})
export class CrearPlanesTratamiento implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private planesSvc = inject(PlanesTratamientosService);
  private evalSvc = inject(EvaluacionesInicialesService);
  private tarifasSvc = inject(TarifasService);
  private sesionesSvc = inject(SesionesService);
  private planesEjSvc = inject(PlanesEjerciciosService);
  private ejerciciosSvc = inject(EjerciciosService);
  private mensualidadesSvc = inject(MensualidadesService);

  readonly DIAS_SEMANA = [
    { value: 1, corto: 'L', label: 'Lunes' },
    { value: 2, corto: 'M', label: 'Martes' },
    { value: 3, corto: 'X', label: 'Miércoles' },
    { value: 4, corto: 'J', label: 'Jueves' },
    { value: 5, corto: 'V', label: 'Viernes' },
    { value: 6, corto: 'S', label: 'Sábado' },
    { value: 0, corto: 'D', label: 'Domingo' },
  ];

  readonly fechaHoy = new Date();

  readonly FRECUENCIAS = [
    { value: 'DIARIA', label: 'Diaria' },
    { value: 'INTERDIARIA', label: 'Interdiaria' },
    { value: 'SEMANAL', label: 'Semanal' },
  ];

  private readonly DIA_ORDER = [1, 2, 3, 4, 5, 6, 0];

  cargando = signal(true);
  guardando = signal(false);
  pasoGuardado = signal('');
  errorGuardado = signal('');
  /** ID del plan ya creado — impide duplicados si sesiones fallan */
  planCreadoId = signal<number | null>(null);

  evaluacion = signal<any>(null);
  tarifas = signal<Tarifa[]>([]);
  tarifaSeleccionada = signal<Tarifa | null>(null);
  ejerciciosCatalogo = signal<any[]>([]);

  duracionMeses = signal(1);
  slots = signal<SlotDia[]>([]);
  filaEjercicios = signal<FilaEjercicio[]>([]);

  form = this.fb.group({
    objetivo_terapeutico: ['', Validators.required],
    tarifaId: [null as number | null, Validators.required],
    observaciones: [''],
  });

  slotsOrdenados = computed(() =>
    [...this.slots()].sort((a, b) => this.DIA_ORDER.indexOf(a.dia) - this.DIA_ORDER.indexOf(b.dia)),
  );

  sesionesPreview = computed<SesionPreview[]>(() => {
    const selectedSlots = this.slots();
    const meses = this.duracionMeses();
    if (selectedSlots.length === 0 || meses < 1) return [];

    const tiempoMin = this.evaluacion()?.tiempo_sesion_minutos ?? 60;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date(hoy);
    fin.setMonth(fin.getMonth() + meses);

    const result: SesionPreview[] = [];
    const cursor = new Date(hoy);
    let num = 1;

    while (cursor <= fin) {
      const dow = cursor.getDay();
      const slot = selectedSlots.find((s) => s.dia === dow);
      if (slot) {
        const [h, m] = slot.hora.split(':').map(Number);
        const inicio = new Date(cursor);
        inicio.setHours(h, m, 0, 0);
        const finSesion = new Date(inicio.getTime() + tiempoMin * 60_000);
        result.push({
          numero: num++,
          fecha: new Date(inicio),
          diaLabel: this.DIAS_SEMANA.find((d) => d.value === dow)?.label ?? '',
          hora: slot.hora,
          horaFin: this.padHora(finSesion),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  });

  sesionesXMes = computed(() => {
    const total = this.sesionesPreview().length;
    const m = this.duracionMeses();
    return m > 0 ? Math.round(total / m) : 0;
  });

  ngOnInit(): void {
    const evalId = Number(this.route.snapshot.paramMap.get('evaluacionId'));
    if (!evalId) {
      this.router.navigate(['/app/evaluaciones-iniciales']);
      return;
    }

    this.evalSvc.verEvaluacionInicial(evalId).subscribe({
      next: (ev) => {
        this.evaluacion.set(ev);
        this.tarifasSvc.listarTarifas().subscribe({
          next: (lista) => {
            this.tarifas.set(lista);
            const match = lista.find(
              (t) =>
                t.categoriaSemaforo?.toLowerCase() === ev.categoria_semaforo?.toLowerCase() &&
                t.nivel?.toLowerCase() === ev.nivel?.toLowerCase(),
            );
            if (match) {
              this.form.patchValue({ tarifaId: Number(match.id) });
              this.tarifaSeleccionada.set(match);
            }
          },
        });

        this.ejerciciosSvc.listarEjerciciosPorCategoria(ev.categoria_trabajo).subscribe({
          next: (list) => {
            this.ejerciciosCatalogo.set(list);
            this.cargando.set(false);
          },
          error: () =>
            this.ejerciciosSvc.listarEjercicios().subscribe({
              next: (all) => {
                this.ejerciciosCatalogo.set(all);
                this.cargando.set(false);
              },
              error: () => this.cargando.set(false),
            }),
        });
      },
      error: () => this.router.navigate(['/app/evaluaciones-iniciales']),
    });
  }

  // ── Días ────────────────────────────────────────────────────────────────
  toggleDia(dia: number): void {
    const cur = this.slots();
    if (cur.find((s) => s.dia === dia)) {
      this.slots.set(cur.filter((s) => s.dia !== dia));
    } else {
      this.slots.set([...cur, { dia, hora: '09:00' }]);
    }
  }

  diaActivo(dia: number): boolean {
    return this.slots().some((s) => s.dia === dia);
  }
  getHora(dia: number): string {
    return this.slots().find((s) => s.dia === dia)?.hora ?? '09:00';
  }

  setHora(dia: number, hora: string): void {
    this.slots.update((list) => list.map((s) => (s.dia === dia ? { ...s, hora } : s)));
  }

  // ── Duración ─────────────────────────────────────────────────────────────
  sumarMes(): void {
    this.duracionMeses.update((v) => v + 1);
  }
  restarMes(): void {
    this.duracionMeses.update((v) => Math.max(1, v - 1));
  }

  // ── Ejercicios ───────────────────────────────────────────────────────────
  agregarEjercicio(): void {
    const orden = this.filaEjercicios().length + 1;
    this.filaEjercicios.update((list) => [
      ...list,
      {
        uid: Date.now().toString() + orden,
        ejercicioId: null,
        repeticiones: 10,
        series: 3,
        frecuencia: 'DIARIA',
        orden,
      },
    ]);
  }

  quitarEjercicio(uid: string): void {
    this.filaEjercicios.update((list) =>
      list.filter((r) => r.uid !== uid).map((r, i) => ({ ...r, orden: i + 1 })),
    );
  }

  setEjercicioId(uid: string, valor: string): void {
    this.filaEjercicios.update((list) =>
      list.map((r) =>
        r.uid === uid ? { ...r, ejercicioId: valor && valor !== 'null' ? Number(valor) : null } : r,
      ),
    );
  }

  setNumCampo(uid: string, campo: 'repeticiones' | 'series', valor: string): void {
    this.filaEjercicios.update((list) =>
      list.map((r) => (r.uid === uid ? { ...r, [campo]: Math.max(1, Number(valor)) } : r)),
    );
  }

  setFrecuencia(uid: string, val: string): void {
    this.filaEjercicios.update((list) =>
      list.map((r) => (r.uid === uid ? { ...r, frecuencia: val } : r)),
    );
  }

  // ── Tarifa ───────────────────────────────────────────────────────────────
  seleccionarTarifa(id: string): void {
    const t = this.tarifas().find((x) => x.id === id) ?? null;
    this.tarifaSeleccionada.set(t);
    this.form.patchValue({ tarifaId: t ? Number(t.id) : null });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  labelSemaforo(s: string): string {
    return (
      ({ verde: '🟢 Verde', amarillo: '🟡 Amarillo', rojo: '🔴 Rojo' } as Record<string, string>)[
        s?.toLowerCase()
      ] ?? s
    );
  }

  labelNivel(n: string): string {
    const m: Record<string, string> = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' };
    return m[n?.toLowerCase()] ?? n;
  }

  getDiaLabel(dia: number): string {
    return this.DIAS_SEMANA.find((d) => d.value === dia)?.label ?? '';
  }

  formatFecha(d: Date): string {
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private padHora(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  cancelar(): void {
    this.router.navigate(['/app/planes-tratamiento']);
  }

  mensualidadesCreadas = signal<any[]>([]);

  // ── Guardar ──────────────────────────────────────────────────────────────
  guardar(): void {
    // Previene duplicado: si el plan ya fue creado (sesiones fallaron), navegar directamente
    if (this.planCreadoId() !== null) {
      this.router.navigate(['/app/planes-tratamiento']);
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.sesionesPreview().length === 0) {
      this.errorGuardado.set('Selecciona al menos un día en el calendario para generar sesiones.');
      return;
    }
    this.errorGuardado.set('');
    this.guardando.set(true);

    const hoy = new Date().toISOString().split('T')[0];
    const payload = {
      evaluacionInicialId: this.evaluacion().id,
      fecha_inicio: hoy,
      duracionMesesEstimada: this.duracionMeses(),
      numeroSesionesMes: this.sesionesXMes(),
      objetivo_terapeutico: this.form.value.objetivo_terapeutico!,
      tarifaId: Number(this.form.value.tarifaId),
      observaciones: this.form.value.observaciones || undefined,
      estado: 'ACTIVO',
    };

    this.pasoGuardado.set('Creando plan de tratamiento...');
    this.planesSvc.crearPlanTratamiento(payload).subscribe({
      next: (plan) => {
        this.planCreadoId.set(plan.id); // marca que el plan existe → previene duplicado
        this.mensualidadesCreadas.set([]);
        this.crearMensualidadN(plan.id, 0);
      },
      error: () => {
        this.guardando.set(false);
        this.pasoGuardado.set('');
        this.errorGuardado.set('Error al crear el plan. Intente de nuevo.');
      },
    });
  }

  private crearMensualidadN(planId: number, i: number): void {
    const meses = this.duracionMeses();
    if (i >= meses) {
      this.crearSesionN(planId, 0);
      return;
    }
    this.pasoGuardado.set(`Generando mensualidad ${i + 1} de ${meses}...`);

    const periodo = new Date();
    periodo.setHours(0, 0, 0, 0);
    periodo.setDate(1); // Primer día del mes
    periodo.setMonth(periodo.getMonth() + i);

    const input = {
      planTratamientoId: planId.toString(),
      pacienteId: this.evaluacion().paciente.id.toString(),
      periodo: periodo.toISOString().split('T')[0],
      monto: this.tarifaSeleccionada()?.precioMensual ?? 0,
    };

    this.mensualidadesSvc.crearMensualidades(input).subscribe({
      next: (m) => {
        this.mensualidadesCreadas.update((list) => [...list, m]);
        this.crearMensualidadN(planId, i + 1);
      },
      error: () => this.crearMensualidadN(planId, i + 1), // Continúa aunque falle
    });
  }

  private crearSesionN(planId: number, i: number): void {
    const sesiones = this.sesionesPreview();
    if (i >= sesiones.length) {
      this.crearEjercicioN(planId, 0);
      return;
    }

    const s = sesiones[i];
    this.pasoGuardado.set(`Programando sesión ${i + 1} de ${sesiones.length}...`);

    // Encontrar la mensualidad correspondiente según el mes y año
    const mesSesion = s.fecha.getMonth();
    const anioSesion = s.fecha.getFullYear();
    const creadas = this.mensualidadesCreadas();
    let mId: number | null = null;

    const match = creadas.find((m) => {
      if (!m.periodo) return false;
      const [yyyy, mm] = m.periodo.split('-');
      return Number(mm) - 1 === mesSesion && Number(yyyy) === anioSesion;
    });

    if (match) {
      mId = Number(match.id);
    } else if (creadas.length > 0) {
      mId = Number(creadas[0].id); // Fallback
    }

    this.sesionesSvc
      .crearSesion({
        planTratamientoId: planId,
        mensualidadId: mId,
        numeroSesion: s.numero,
        fechaHoraProgramada: s.fecha.toISOString(),
        estado_sesion: 'PROGRAMADA',
      })
      .subscribe({
        next: () => this.crearSesionN(planId, i + 1),
        error: () => {
          // El plan fue creado. Navegar igual y dejar que el usuario cree sesiones desde el módulo.
          this.guardando.set(false);
          this.pasoGuardado.set('');
          this.errorGuardado.set(
            `El plan fue creado, pero la sesión ${i + 1} no pudo registrarse. ` +
              `Verifica que el servidor esté actualizado y usa el módulo Sesiones para completarlas.`,
          );
          // Navegar al listado — el plan existe, no re-crear
          setTimeout(() => this.router.navigate(['/app/planes-tratamiento']), 3000);
        },
      });
  }

  private crearEjercicioN(planId: number, i: number): void {
    const filas = this.filaEjercicios().filter((r) => r.ejercicioId !== null);
    if (i >= filas.length) {
      this.guardando.set(false);
      this.pasoGuardado.set('');
      this.router.navigate(['/app/planes-tratamiento']);
      return;
    }
    const r = filas[i];
    this.pasoGuardado.set(`Registrando ejercicio ${i + 1} de ${filas.length}...`);
    this.planesEjSvc
      .crearPlanEjercicio({
        planTratamientoId: planId,
        ejercicioId: r.ejercicioId,
        repeticiones: r.repeticiones,
        series: r.series,
        frecuencia: r.frecuencia,
        orden: r.orden,
        activo: true,
      })
      .subscribe({
        next: () => this.crearEjercicioN(planId, i + 1),
        error: () => this.crearEjercicioN(planId, i + 1),
      });
  }
}
