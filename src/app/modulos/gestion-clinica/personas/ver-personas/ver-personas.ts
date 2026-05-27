import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-personas',
  templateUrl: './ver-personas.html',
  styleUrl: './ver-personas.css',
})
export class VerPersonas {
  @Input() persona: any | null = null;
}
