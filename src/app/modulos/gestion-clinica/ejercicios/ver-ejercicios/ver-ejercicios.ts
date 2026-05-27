import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-ejercicios',
  templateUrl: './ver-ejercicios.html',
  styleUrl: './ver-ejercicios.css',
})
export class VerEjercicios {
  @Input() ejercicio: any | null = null;
}
