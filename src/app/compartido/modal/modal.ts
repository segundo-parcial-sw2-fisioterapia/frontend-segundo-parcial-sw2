import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class Modal {
  @Input() titulo = '';
  @Input() abierto = false;
  @Input() ancho: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  @Output() cerrar = new EventEmitter<void>();

  get anchoClase(): string {
    const mapa: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };
    return mapa[this.ancho] ?? 'max-w-lg';
  }
}
