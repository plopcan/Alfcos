import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taller } from '../../interfaces/taller';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Router } from '@angular/router';
import { Clase } from '../../interfaces/clase';

@Injectable({
  providedIn: 'root'
})
export class TallerService {
  private tallerSubject = new BehaviorSubject<Taller | undefined>(undefined);
  taller$ = this.tallerSubject.asObservable();
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
  
  getTallerList(): Observable<Taller[]> {
    const url = `${environment.urlDjango}/api/talleres/`;
    console.log('Enviando solicitud a:', url);
    return this.http.get<Taller[]>(url, { headers: this.getAuthHeaders() });
  }

  getTaller(id_taller: string | null): Observable<Taller> {
    const url = `${environment.urlDjango}/api/talleres/filtrar/`;
    console.log('Enviando solicitud a:', url);
    
    const body = { id_taller };  // Envía los datos en el body
    const headers = this.getAuthHeaders();  // Asegúrate de que sean correctos

    return this.http.post<Taller[]>(url, body, { headers }).pipe(
      map(taller => taller[0])  // Tomar el primer elemento del array
    );
  }

  getTallerListPaginated(page: number = 1, pageSize: number = 10): Observable<any> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('page_size', pageSize.toString());
    
    const url = `${environment.urlDjango}/api/talleres/paginar/`;
    console.log('Enviando solicitud a:', url, 'con parámetros:', params.toString());
    
    return this.http.get<any>(url, { 
        headers: this.getAuthHeaders(),
        params: params
    });
  }

  getClasesPaginated(id_taller: number, page: number = 1, pageSize: number = 10): Observable<any> {
    let params = new HttpParams()
        .set('id_taller', id_taller.toString())
        .set('page', page.toString())
        .set('page_size', pageSize.toString());
    
    const url = `${environment.urlDjango}/api/talleres/paginar-clases/`;
    console.log('Enviando solicitud a:', url, 'con parámetros:', params.toString());
    
    return this.http.get<any>(url, { 
        headers: this.getAuthHeaders(),
        params: params
    }).pipe(
      catchError((error) => {
        console.error('Error al obtener las clases paginadas:', error);
        return throwError(() => new Error('Error al obtener las clases paginadas'));
      })
    );
  }

  deleteTaller(id: number): Observable<any> {
    const url = `${environment.urlDjango}/api/talleres/${id}/`;
    return this.http.delete(url, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  fetchAndStoreTaller(id_taller: string | null): void {
    this.getTaller(id_taller).subscribe(
      (taller) => {
        this.tallerSubject.next(taller);
        this.router.navigate(['/tallerForm']);  // Navegar después de almacenar el taller
      },
      (error) => {
        console.error('Error fetching taller:', error);
      }
    );
  }

  updateTaller(info: any, id: number | undefined): Observable<string> {
    const url = `${environment.urlDjango}/api/talleres/${id}/`;
    return this.http.put<string>(url, info, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  addTaller(info: any): Observable<string> {
    const url = `${environment.urlDjango}/api/talleres/`;
    return this.http.post<string>(url, info, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  inscribirSocio(id_taller: number, n_socio: number): Observable<any> {
    const url = `${environment.urlDjango}/api/talleres/inscribir/`;
    const body = { id_taller, n_socio };
    return this.http.post(url, body, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  quitarSocio(id_taller: number, nombre: string, apellidos: string): Observable<any> { 
    const url = `${environment.urlDjango}/api/talleres/quitar/`;
    const body = { id_taller, nombre, apellidos };
    return this.http.post(url, body, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  listarSocios(id_taller: number): Observable<Clase[]> {
    const url = `${environment.urlDjango}/api/talleres/listar-socios/`;
    const body = { id_taller };
    return this.http.post<Clase[]>(url, body, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
  
  filterTalleres(filters: any, page: number = 1, pageSize: number = 10): Observable<any> {
    const url = `${environment.urlDjango}/api/talleres/filtrar/`;
    const headers = this.getAuthHeaders();
    const body = { ...filters, page, page_size: pageSize };
    return this.http.post<any>(url, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  clear(): void {
    this.tallerSubject.next(undefined);
  }

  descargar_clases(id_taller: Number | null): Observable<Blob> {
    const url = `${environment.urlDjango}/api/talleres/descargar_clase/`;
    const body = { id_taller };
    return this.http.post(url, body, { 
      headers: this.getAuthHeaders(),
      responseType: 'blob'  // Indica que esperas un Blob (archivo binario)
    }).pipe(
      catchError(this.handleError)
    );
  }
}
