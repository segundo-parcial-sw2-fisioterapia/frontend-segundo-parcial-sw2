import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginService } from '../../nucleo/rest/login.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private loginService = inject(LoginService);

  datos = signal<any>(null);
  cargando = signal(true);

  saludo = signal(this.calcularSaludo());
  fechaHoy = signal(
    new Intl.DateTimeFormat('es-BO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date()),
  );

  nombreUsuario = computed(() => {
    const u = this.loginService.obtenerUsuario();
    return u?.nombre ?? 'Administrador';
  });

  /** Segmentos calculados para el gráfico donut del semáforo */
  donutSegments = computed(() => {
    const d = this.datos();
    if (!d?.distribucionSemaforo) return [];
    const { verde, amarillo, rojo } = d.distribucionSemaforo;
    const total = verde + amarillo + rojo || 1;
    const v = (verde / total) * 100;
    const a = (amarillo / total) * 100;
    const r = (rojo / total) * 100;
    return [
      {
        color: 'var(--color-semaforo-verde)',
        label: 'Verde',
        valor: verde,
        pct: Math.round(v),
        dasharray: `${v.toFixed(1)} ${(100 - v).toFixed(1)}`,
        dashoffset: 25,
      },
      {
        color: 'var(--color-semaforo-amarillo)',
        label: 'Amarillo',
        valor: amarillo,
        pct: Math.round(a),
        dasharray: `${a.toFixed(1)} ${(100 - a).toFixed(1)}`,
        dashoffset: 25 - v,
      },
      {
        color: 'var(--color-semaforo-rojo)',
        label: 'Rojo',
        valor: rojo,
        pct: Math.round(r),
        dasharray: `${r.toFixed(1)} ${(100 - r).toFixed(1)}`,
        dashoffset: 25 - v - a,
      },
    ];
  });

  totalSemaforo = computed(() => {
    const d = this.datos();
    if (!d?.distribucionSemaforo) return 0;
    const { verde, amarillo, rojo } = d.distribucionSemaforo;
    return verde + amarillo + rojo;
  });

  /** Barras para el gráfico de sesiones por mes */
  barras = computed(() => {
    const d = this.datos();
    if (!d?.sesionesPorMes) return [];
    const max = Math.max(...d.sesionesPorMes.map((c: any) => c.valor));
    return d.sesionesPorMes.map((c: any, i: number) => ({
      mes: c.mes,
      valor: c.valor,
      altura: Math.round((c.valor / max) * 78),
      esUltimo: i === d.sesionesPorMes.length - 1,
    }));
  });

  ngOnInit(): void {
    this.http.get('/mock/dashboard-kpis.json').subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0 }).format(valor);
  }

  private calcularSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
