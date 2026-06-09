import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-empleados',
  imports: [],
  templateUrl: './ver-empleados.html',
})
export class VerEmpleados {
  @Input() empleado: any | null = null;
}
