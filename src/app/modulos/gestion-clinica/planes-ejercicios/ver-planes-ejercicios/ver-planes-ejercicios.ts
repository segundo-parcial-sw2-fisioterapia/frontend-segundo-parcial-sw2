import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-planes-ejercicios',
  templateUrl: './ver-planes-ejercicios.html',
  styleUrl: './ver-planes-ejercicios.css',
})
export class VerPlanesEjercicios {
  @Input() plan: any | null = null;
}
