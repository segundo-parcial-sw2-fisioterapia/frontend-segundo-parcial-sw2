import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-planes-tratamiento',
  templateUrl: './ver-planes-tratamiento.html',
  styleUrl: './ver-planes-tratamiento.css',
})
export class VerPlanesTratamiento {
  @Input() plan: any | null = null;
}
