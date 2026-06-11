import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-turnos',
  imports: [],
  templateUrl: './ver-turnos.html',
})
export class VerTurnos {
  @Input() turno: any | null = null;
}
