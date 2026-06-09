import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.html',
  standalone: true,
})
export class KpiCard {
  @Input() titulo = '';
  @Input() valor: string | number = 0;
  @Input() iconColorClass = 'bg-primary-50 text-primary-600';
}
