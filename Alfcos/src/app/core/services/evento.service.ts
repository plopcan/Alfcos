import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { Evento } from '../../interfaces/evento';
import { environment } from '../../../environments/environment.development';

interface Asiento {
  n_grupo: number;
  n_asiento: number;
  n_socio: number | null;
  nombre: string;
  fecha: string;
}

interface ListaEspera {
  socio: number;
  fecha_inscripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private eventoSubject = new BehaviorSubject<Evento | undefined>(undefined);
  evento$ = this.eventoSubject.asObservable();
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

    getEventoList(): Observable<Evento[]> {
      const url = `${environment.urlDjango}/api/eventos/`;
      console.log('Enviando solicitud a:', url);
      return this.http.get<Evento[]>(url, { headers: this.getAuthHeaders() });
    }
  
    getEvento(id_evento: number | null): Observable<Evento> {
      const url = `${environment.urlDjango}/api/eventos/filtrar/`;
      const body = { id_evento };
      const headers = this.getAuthHeaders();
  
      return this.http.post<{ results: Evento[] }>(url, body, { headers }).pipe(
        map(response => response.results[0]) // Tomar el primer evento del array results
      );
    }
  
    fetchAndStoreEvento(id_evento: number | null): void {
      console.log('Fetching evento with ID:', id_evento);
      this.getEvento(id_evento).subscribe(
        (evento) => {
          this.eventoSubject.next(evento);
          console.log('Evento fetched and stored:', evento);
          this.router.navigate(['/eventoForm']);  // Navegar después de almacenar el socio
        },
        (error) => {
          console.error('Error fetching evento:', error);
        }
      );
    }

    updateEvento(info: any, id: number | undefined): Observable<string> {
      const url = `${environment.urlDjango}/api/eventos/${id}/`;
      return this.http.put<string>(url, info, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }
  
    addEvento(info: any): Observable<string> {
      const url = `${environment.urlDjango}/api/eventos/`;
      return this.http.post<string>(url, info, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }
  
    deleteEvento(id: number): Observable<any> {
      const url = `${environment.urlDjango}/api/eventos/${id}/`;
      return this.http.delete(url, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }

    getAsientos(id_evento: number): Observable<Asiento[]> {
      const url = `${environment.urlDjango}/api/eventos/obtener-asientos/`;
      const body = { id_evento };

      return this.http.post<{ asientos: Asiento[] }>(url, body, {
        headers: this.getAuthHeaders(),
      }).pipe(
        map((response) => {
          return response.asientos || []; // Extrae el arreglo de la propiedad 'asientos'
        }),
        catchError((error) => {
          console.error('Error al obtener los asientos:', error);
          return []; // Devuelve un arreglo vacío en caso de error
        })
      );
    }

    getListaEspera(id_evento: number): Observable<ListaEspera[]> {
      const url = `${environment.urlDjango}/api/eventos/obtener-lista-espera/`;
      const body = { id_evento };

      return this.http.post<{ lista_espera: ListaEspera[] }>(url, body, {
        headers: this.getAuthHeaders(),
      }).pipe(
        map((response) => {
          return response.lista_espera || []; // Extrae el arreglo de la propiedad 'lista_espera'
        }),
        catchError((error) => {
          console.error('Error al obtener la lista de espera:', error);
          return []; // Devuelve un arreglo vacío en caso de error
        })
      );
    }
  
    private handleError(error: HttpErrorResponse): Observable<never> {
      console.error('An error occurred:', error);
      return throwError(() => new Error('Something bad happened; please try again later.'));
    }

    agregarLista(id_evento: number, n_socio: number): Observable<any> {
      const url = `${environment.urlDjango}/api/eventos/agregar-lista-espera/`;
      const body = { id_evento, n_socio };
      return this.http.post(url, body, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }
    eliminarLista(id_evento: number, n_socio: number): Observable<any> {
      const url = `${environment.urlDjango}/api/eventos/eliminar-lista-espera/`; // Asegúrate de que esta URL sea correcta
      const body = { id_evento, n_socio }; // Asegúrate de que las claves coincidan con lo que espera el backend
      return this.http.post(url, body, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }

    asignarAsiento(id_evento: number, n_socio: number, n_grupo: number, n_asiento: number, mesa?:number): Observable<any> {
      const url = `${environment.urlDjango}/api/eventos/asignar-asiento/`;
      const body = { id_evento, n_socio, n_grupo, n_asiento, mesa };
      return this.http.post(url, body, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }
    vaciarAsiento(id_evento: number, n_grupo: number, n_asiento: number): Observable<any> {
      const url = `${environment.urlDjango}/api/eventos/vaciar-asiento/`;
      const body = { id_evento, n_grupo, n_asiento };
      return this.http.post(url, body, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }

    getEventoListPaginated(page: number = 1, pageSize: number = 10): Observable<any> {
      let params = new HttpParams()
          .set('page', page.toString())
          .set('page_size', pageSize.toString());
      
      const url = `${environment.urlDjango}/api/eventos/paginar/`;
      console.log('Enviando solicitud a:', url, 'con parámetros:', params.toString());
      
      return this.http.get<any>(url, { 
          headers: this.getAuthHeaders(),
          params: params
      });
    }

    filterEventos(filters: any, page: number = 1, pageSize: number = 10): Observable<any> {
      const url = `${environment.urlDjango}/api/eventos/filtrar/`;
      const headers = this.getAuthHeaders();
      const body = { ...filters, page, page_size: pageSize };
      return this.http.post<any>(url, body, { headers }).pipe(
        catchError(this.handleError)
      );
    }

    clear(): void {
      this.eventoSubject.next(undefined);
    }
     
  descargarListado(datos: any = {}, mesa: boolean = false){
    let url: string;
    if(mesa){
      url = `${environment.urlDjango}/api/eventos/descargar_mesas/`;
    }else{
      url = `${environment.urlDjango}/api/eventos/descargar_listado/`;
    }
    const headers = this.getAuthHeaders();
    // Ahora enviamos los filtros como body en una petición POST
    return this.http.post(url, datos, { headers, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

}
