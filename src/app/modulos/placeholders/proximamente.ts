import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-proximamente',
  imports: [],
  templateUrl: './proximamente.html',
})
export class Proximamente {
  private route = inject(ActivatedRoute);

  datos = toSignal(
    this.route.data.pipe(map((d) => d as { titulo: string; descripcion: string; icono?: string })),
    { initialValue: { titulo: '', descripcion: '', icono: '' } },
  );
}
