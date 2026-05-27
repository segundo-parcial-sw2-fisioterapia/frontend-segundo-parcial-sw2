import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-citas',
  templateUrl: './ver-citas.html',
  styleUrl: './ver-citas.css',
})
export class VerCitas {
  @Input() cita: any | null = null;
}
