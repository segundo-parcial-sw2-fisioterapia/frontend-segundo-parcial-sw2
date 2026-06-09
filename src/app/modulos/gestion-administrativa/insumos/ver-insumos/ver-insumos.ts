import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ver-insumos',
  imports: [],
  templateUrl: './ver-insumos.html',
})
export class VerInsumos {
  @Input() insumo: any | null = null;
}
