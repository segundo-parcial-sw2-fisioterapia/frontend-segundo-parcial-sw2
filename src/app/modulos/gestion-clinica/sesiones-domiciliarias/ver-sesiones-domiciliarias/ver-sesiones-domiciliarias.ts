import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-sesiones-domiciliarias',
  templateUrl: './ver-sesiones-domiciliarias.html',
  styleUrl: './ver-sesiones-domiciliarias.css',
})
export class VerSesionesDomiciliarias {
  @Input() sesion: any | null = null;
}
