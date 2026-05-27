import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-usuarios',
  templateUrl: './ver-usuarios.html',
  styleUrl: './ver-usuarios.css',
})
export class VerUsuarios {
  @Input() usuario: any | null = null;
}
