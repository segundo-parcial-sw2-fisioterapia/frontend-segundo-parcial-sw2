import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { EmpleadosService } from '../../../../nucleo/graphql/gestion-administrativa/empleados';
import { PacientesService } from '../../../../nucleo/graphql/gestion-clinica/pacientes';

@Component({
  selector: 'app-ver-usuarios',
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './ver-usuarios.html',
  styleUrl: './ver-usuarios.css',
})
export class VerUsuarios implements OnChanges {
  @Input() usuario: any | null = null;

  private empleadosService = inject(EmpleadosService);
  private pacientesService = inject(PacientesService);

  datosExtra = signal<any>(null);
  cargandoExtra = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      this.datosExtra.set(null);
      if (this.usuario.persona) {
        const personaId = this.usuario.persona.id;
        const ci = this.usuario.persona.ci;
        const esPaciente = this.usuario.roles?.some((r: string) => r.toLowerCase() === 'paciente');

        this.cargandoExtra.set(true);
        if (esPaciente) {
          this.pacientesService.buscarPacientes(ci).subscribe({
            next: (res) => {
              const pac = res.find(p => p.persona?.id === personaId);
              if (pac) {
                 this.pacientesService.verPaciente(pac.id).subscribe(detalle => {
                    this.datosExtra.set({ tipo: 'PACIENTE', ...detalle });
                    this.cargandoExtra.set(false);
                 });
              } else {
                 this.cargandoExtra.set(false);
              }
            },
            error: () => this.cargandoExtra.set(false)
          });
        } else {
          // Es un empleado
          this.empleadosService.listarEmpleados(0, 500).subscribe({
            next: (res) => {
              const empleados = res.contenido || [];
              const emp = empleados.find((e: any) => String(e.personaId) === String(personaId));
              if (emp) this.datosExtra.set({ tipo: 'EMPLEADO', ...emp });
              this.cargandoExtra.set(false);
            },
            error: () => this.cargandoExtra.set(false)
          });
        }
      }
    }
  }
}
