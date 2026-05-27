import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { enviroment } from '../../enviroment/enviroment';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class GraphQLService {
  private http = inject(HttpClient);
  private graphqlUrl = enviroment.graphqlUrl;

  /**
   * Ejecuta una consulta o mutación GraphQL.
   * 
   * @param query La cadena de consulta o mutación GraphQL.
   * @param variables Objeto con las variables opcionales para la operación.
   * @param headers Opciones de cabeceras HTTP adicionales (ej. tokens de autorización).
   */
  query<T = any>(
    query: string, 
    variables?: Record<string, any>, 
    headers?: HttpHeaders
  ): Observable<T> {
    const body: GraphQLRequest = { query, variables };
    
    let httpHeaders = headers || new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Agregar token JWT si existe en localStorage
    const token = localStorage.getItem('token');
    if (token && !httpHeaders.has('Authorization')) {
      httpHeaders = httpHeaders.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<GraphQLResponse<T>>(this.graphqlUrl, body, { headers: httpHeaders }).pipe(
      map(response => {
        if (response.errors && response.errors.length > 0) {
          throw new Error(response.errors.map(e => e.message).join(', '));
        }
        return response.data as T;
      }),
      catchError(error => {
        console.error('Error en petición GraphQL:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Ejecuta una mutación GraphQL (alias semántico de query).
   */
  mutate<T = any>(
    mutation: string, 
    variables?: Record<string, any>, 
    headers?: HttpHeaders
  ): Observable<T> {
    return this.query<T>(mutation, variables, headers);
  }
}
