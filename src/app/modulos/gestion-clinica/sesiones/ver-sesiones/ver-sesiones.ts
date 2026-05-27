import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-sesiones',
  templateUrl: './ver-sesiones.html',
  styleUrl: './ver-sesiones.css',
})
export class VerSesiones {
  @Input() sesion: any | null = null;
}
