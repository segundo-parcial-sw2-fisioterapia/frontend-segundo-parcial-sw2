import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-formulario-persona',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-persona.html',
  styleUrl: './formulario-persona.css',
})
export class FormularioPersona {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() mostrarCI = true;
}
