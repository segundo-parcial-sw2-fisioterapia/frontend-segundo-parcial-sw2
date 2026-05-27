import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-pacientes',
  templateUrl: './ver-pacientes.html',
  styleUrl: './ver-pacientes.css',
})
export class VerPacientes {
  @Input() paciente: any | null = null;
}
