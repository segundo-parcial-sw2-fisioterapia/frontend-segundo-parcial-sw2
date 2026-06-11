import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-asistencias',
  imports: [],
  templateUrl: './ver-asistencias.html',
})
export class VerAsistencias {
  @Input() asistencia: any | null = null;
}
