import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Socio } from '../../interfaces/socio';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SocioService {
  private socioSubject = new BehaviorSubject<Socio | undefined>(undefined);
  socio$ = this.socioSubject.asObservable();
  success!: string;

  constructor(private http: HttpClient, private router: Router) { }

  private getAuthHeaders(): HttpHeaders {
    const username = environment.userName;
    const password = environment.password;
    const auth = btoa(`${username}:${password}`);
    return new HttpHeaders({
        'Authorization': `Basic ${auth}`
    });
  }

  getSocioList(): Observable<Socio[]> {
    const url = `${environment.urlDjango}/api/socios/`;
    console.log('Enviando solicitud a:', url);
    return this.http.get<Socio[]>(url, { headers: this.getAuthHeaders() });
  }

  getSocioListPaginated(page: number = 1, pageSize: number = 10, ordering: string = '-n_socio'): Observable<any> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('page_size', pageSize.toString())
        .set('ordering', ordering);  // Ordenar por n_socio descendente
    
    const url = `${environment.urlDjango}/api/socios/paginar/`;
    console.log('Enviando solicitud a:', url, 'con parámetros:', params.toString());
    
    return this.http.get<any>(url, { 
        headers: this.getAuthHeaders(),
        params: params
    });
  }

  getSocio(n_socio: string | null): Observable<Socio> {
    const url = `${environment.urlDjango}/api/socios/mostrarSocio/`;
    const body = { n_socio: n_socio };
    const headers = this.getAuthHeaders();

    return this.http.post<any>(url, body, { headers });
  }

  fetchAndStoreSocio(n_socio: string | null): void {
    this.getSocio(n_socio).subscribe(
      (socio) => {
        this.socioSubject.next(socio);
        console.log('Socio fetched and stored:', socio);
        this.router.navigate(['/socioForm']);  // Navegar después de almacenar el socio
      },
      (error) => {
        console.error('Error fetching socio:', error);
      }
    );
  }

  updateSocio(socioInfo: any, n_socio: number | undefined): Observable<string> {
    const url = `${environment.urlDjango}/api/socios/${n_socio}/`;

    const formData = new FormData();
    for (const key in socioInfo) {
      if (socioInfo.hasOwnProperty(key) && socioInfo[key] !== undefined && socioInfo[key] !== null) {
        if (key === 'foto' && socioInfo[key]) {
          formData.append('foto', socioInfo[key], socioInfo[key].name);
        } else if (key !== 'foto') {
          formData.append(key, socioInfo[key]);
        }
      }
    }

    return this.http.put<string>(url, formData, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  addSocio(socioInfo: any): Observable<string> {
    const url = `${environment.urlDjango}/api/socios/`;
  
    const formData = new FormData();
    for (const key in socioInfo) {
      if (socioInfo.hasOwnProperty(key) && socioInfo[key] !== undefined && socioInfo[key] !== null) {
        console.log('enviando socio');
        if (key === 'foto' && socioInfo[key]) {
          formData.append('foto', socioInfo[key], socioInfo[key].name);
        } else if (key !== 'foto') {
          formData.append(key, socioInfo[key]);
        }
      }
    }
  
    return this.http.post<string>(url, formData, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteSocio(id: number): Observable<any> {
    const url = `${environment.urlDjango}/api/socios/${id}/`;
    return this.http.delete(url, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  filterSocios(filters: any, page: number = 1, pageSize: number = 10): Observable<any> {
    const url = `${environment.urlDjango}/api/socios/filtrar/`;
    const headers = this.getAuthHeaders();
    const body = { ...filters, page, page_size: pageSize };
    return this.http.post<any>(url, body, { headers }).pipe(
      // El backend ya devuelve {count, next, previous, results}
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
  
  clear(): void {
    this.socioSubject.next(undefined);
  }
  
  descargarSocios(filters: any = {}, orden: string) {
    const url = `${environment.urlDjango}/api/socios/descargar_socios/`;
    const headers = this.getAuthHeaders();
    const body = { ...filters, orden };
    // Ahora enviamos los filtros como body en una petición POST
    return this.http.post(url, body, { headers, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  descargarTarjetas(listadoSocios: number[]) {
    const url = `${environment.urlDjango}/api/socios/descargar_tarjetas/`;
    const headers = this.getAuthHeaders();
    const body = { 'listado_socios': listadoSocios };
    console.log('Descargando tarjetas para socios');
    // Ahora enviamos los filtros como body en una petición POST
    return this.http.post(url, body, { headers, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }
}

