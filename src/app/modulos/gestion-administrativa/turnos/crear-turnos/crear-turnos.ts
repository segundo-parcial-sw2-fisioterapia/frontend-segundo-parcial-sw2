import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SelectorEmpleado } from '../../../../compartido/selector-empleado/selector-empleado';
import { TurnosService } from '../../../../nucleo/graphql/gestion-administrativa/turnos';

export interface DiaCalendario {
  key: string;
  label: string;
  labelLargo: string;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
}

@Component({
  selector: 'app-crear-turnos',
  imports: [FormsModule, SelectorEmpleado, RouterLink],
  templateUrl: './crear-turnos.html',
})
export class CrearTurnos {
  private router = inject(Router);
  private turnosService = inject(TurnosService);

  empleadoId = signal<number | null>(null);
  intentoEnvio = signal(false);
  guardando = signal(false);

  readonly HORA_INICIO_DEFAULT = '08:30';
  readonly HORA_FIN_DEFAULT = '18:00';

  dias = signal<DiaCalendario[]>([
    { key: 'lunes',     label: 'Lun', labelLargo: 'Lunes',      activo: false, horaInicio: '08:30', horaFin: '18:00' },
    { key: 'martes',    label: 'Mar', labelLargo: 'Martes',     activo: false, horaInicio: '08:30', horaFin: '18:00' },
    { key: 'miercoles', label: 'Mié', labelLargo: 'Miércoles',  activo: false, horaInicio: '08:30', horaFin: '18:00' },
    { key: 'jueves',    label: 'Jue', labelLargo: 'Jueves',     activo: false, horaInicio: '08:30', horaFin: '18:00' },
    { key: 'viernes',   label: 'Vie', labelLargo: 'Viernes',    activo: false, horaInicio: '08:30', horaFin: '18:00' },
    { key: 'sabado',    label: 'Sáb', labelLargo: 'Sábado',     activo: false, horaInicio: '08:30', horaFin: '18:00' },
    { key: 'domingo',   label: 'Dom', labelLargo: 'Domingo',    activo: false, horaInicio: '08:30', horaFin: '18:00' },
  ]);

  diasActivos = computed(() => this.dias().filter(d => d.activo));
  totalHorasSemana = computed(() => {
    return this.diasActivos().reduce((total, d) => {
      const [hI, mI] = d.horaInicio.split(':').map(Number);
      const [hF, mF] = d.horaFin.split(':').map(Number);
      return total + Math.max(0, (hF * 60 + mF) - (hI * 60 + mI));
    }, 0);
  });

  seleccionarEmpleado(id: number | null): void {
    this.empleadoId.set(id);
  }

  /** Activa/desactiva un día. Al activar, copia las horas del último día activo. */
  toggleDia(idx: number): void {
    this.dias.update(lista => {
      const copia = lista.map(d => ({ ...d }));
      copia[idx].activo = !copia[idx].activo;
      if (copia[idx].activo) {
        const ultimoActivo = [...copia].slice(0, idx).reverse().find(d => d.activo);
        if (ultimoActivo) {
          copia[idx].horaInicio = ultimoActivo.horaInicio;
          copia[idx].horaFin    = ultimoActivo.horaFin;
        }
      }
      return copia;
    });
  }

  /** Actualiza la horaInicio de un día y propaga al resto de días activos sin hora propia. */
  actualizarHoraInicio(idx: number, valor: string): void {
    this.dias.update(lista => {
      const copia = lista.map(d => ({ ...d }));
      copia[idx].horaInicio = valor;
      return copia;
    });
  }

  actualizarHoraFin(idx: number, valor: string): void {
    this.dias.update(lista => {
      const copia = lista.map(d => ({ ...d }));
      copia[idx].horaFin = valor;
      return copia;
    });
  }

  /** Aplica las mismas horas de un día a todos los días activos siguientes. */
  propagarHoras(idx: number): void {
    this.dias.update(lista => {
      const copia = lista.map(d => ({ ...d }));
      const origen = copia[idx];
      for (let i = idx + 1; i < copia.length; i++) {
        if (copia[i].activo) {
          copia[i].horaInicio = origen.horaInicio;
          copia[i].horaFin    = origen.horaFin;
        }
      }
      return copia;
    });
  }

  horasFormateadas(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  enviar(): void {
    this.intentoEnvio.set(true);
    const diasSeleccionados = this.diasActivos();
    if (!this.empleadoId() || diasSeleccionados.length === 0) return;

    const turnos = diasSeleccionados.map(d => ({
      empleadoId: String(this.empleadoId()),
      diaSemana: d.key,
      horaInicio: d.horaInicio,
      horaFin: d.horaFin,
    }));

    this.guardando.set(true);
    let pendientes = turnos.length;
    for (const t of turnos) {
      this.turnosService.crearTurno({
        empleadoId: t.empleadoId,
        diaSemana: t.diaSemana,
        horaInicio: t.horaInicio,
        horaFin: t.horaFin,
      }).subscribe({
        next: () => {
          pendientes--;
          if (pendientes === 0) {
            this.guardando.set(false);
            this.router.navigate(['/app/admin/turnos']);
          }
        },
        error: () => {
          this.guardando.set(false);
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/app/admin/turnos']);
  }
}
