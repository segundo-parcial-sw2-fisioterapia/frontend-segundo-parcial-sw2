import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class BiService {
  private http = inject(HttpClient);
  private apiUrl = enviroment.apiUrl;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  obtenerKpisDashboard(periodo?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (periodo) {
      params['periodo'] = periodo;
    }
    return this.http.get<any>(`${this.apiUrl}/bi-automatizacion/kpis/dashboard/`, {
      headers: this.getHeaders(),
      params
    });
  }

  /**
   * Obtiene el reporte de tendencias clínicas generado en Python/pandas sobre el
   * dataset de BI (DynamoDB): patologías frecuentes, zonas tratadas y distribución
   * por semáforo y resultado.
   *
   * @param periodo Período YYYY-MM opcional para filtrar. Si se omite, incluye todo.
   */
  obtenerReporteTendencias(periodo?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (periodo) {
      params['periodo'] = periodo;
    }
    return this.http.get<any>(`${this.apiUrl}/bi-automatizacion/reportes/tendencias/`, {
      headers: this.getHeaders(),
      params
    });
  }
}
