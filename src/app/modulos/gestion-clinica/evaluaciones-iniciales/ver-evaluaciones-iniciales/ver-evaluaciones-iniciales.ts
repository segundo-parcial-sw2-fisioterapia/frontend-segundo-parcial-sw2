import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ver-evaluaciones-iniciales',
  imports: [DatePipe],
  templateUrl: './ver-evaluaciones-iniciales.html',
  styleUrl: './ver-evaluaciones-iniciales.css',
})
export class VerEvaluacionesIniciales {
  @Input() evaluacion: any | null = null;
}
