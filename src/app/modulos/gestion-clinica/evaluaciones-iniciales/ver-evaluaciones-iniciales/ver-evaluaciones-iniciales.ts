import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-evaluaciones-iniciales',
  templateUrl: './ver-evaluaciones-iniciales.html',
  styleUrl: './ver-evaluaciones-iniciales.css',
})
export class VerEvaluacionesIniciales {
  @Input() evaluacion: any | null = null;
}
