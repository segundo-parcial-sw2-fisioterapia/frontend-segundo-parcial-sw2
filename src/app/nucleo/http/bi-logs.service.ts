import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroment/enviroment';

export interface LogAutomatizacion {
  id: string;
  numero_whatsapp: string;
  paso_actual: string;
  datos_recopilados: any;
  estado: string;
  error?: string;
  timestamp_inicio: number;
  timestamp_actualizacion: number;
}

export interface LogsResponse {
  logs: LogAutomatizacion[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class BiLogsService {
  private http = inject(HttpClient);
  
  listarLogs(limite: number = 10): Observable<LogsResponse> {
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`
    };
    return this.http.get<LogsResponse>(`${enviroment.apiUrl}/bi-automatizacion/logs/automatizacion/?limite=${limite}`, { headers });
  }
}
