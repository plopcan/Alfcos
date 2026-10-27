import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { Cuentas } from '../../interfaces/cuentas';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { Cuota } from '../../interfaces/cuota';
import { CuentaEvento } from '../../interfaces/cuenta_evento';

@Injectable({
  providedIn: 'root'
})
export class CuentasService {
  private cuentasSubject = new BehaviorSubject<Cuentas | Cuota | CuentaEvento | undefined>(undefined);
  cuentas$ = this.cuentasSubject.asObservable();
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
  getCuentasList(page: number = 1, pageSize: number = 10): Observable<any> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('page_size', pageSize.toString());
    
    
    const url = `${environment.urlDjango}/api/cuentas/paginar/`;
    console.log('Enviando solicitud a:', url, 'con parámetros:', params.toString());
    
    return this.http.get<any>(url, { 
        headers: this.getAuthHeaders(),
        params: params
    });
  }

  getCuentas(id_cuenta: string | null, tipo: string): Observable<Cuentas | Cuota | CuentaEvento> {
    let url = `${environment.urlDjango}/api/cuentas/buscar/`;
    console.log('Enviando solicitud a:', url);
    
    const body = { id_cuenta };  // Envía los datos en el body
    const headers = this.getAuthHeaders();  // Asegúrate de que sean correctos

    return this.http.post<Cuentas[]>(url, body, { headers }).pipe(
      map(cuentas => cuentas[0])  // Tomar el primer elemento del array
    );
  }

  fetchAndStoreCuenta(id_cuenta: string | null, tipo: string): void {
    if(tipo === 'Cuota') {
      this.getCuota(Number(id_cuenta)).subscribe(
        (cuota) => {
          this.cuentasSubject.next(cuota);
          console.log('Cuota fetched and stored:', cuota);
          this.router.navigate(['/cuentaShow']);  // Navegar después de almacenar el socio
        },
        (error) => {
          console.error('Error fetching cuota:', error);
        }
      );
      return;
    } else if(tipo === 'CuentaEvento') {
      this.getCuentaEvento(Number(id_cuenta)).subscribe(
        (cuentaEvento) => {
          this.cuentasSubject.next(cuentaEvento);
          console.log('CuentaEvento fetched and stored:', cuentaEvento);
          this.router.navigate(['/cuentaShow']);  // Navegar después de almacenar el socio
        },
        (error) => {
          console.error('Error fetching cuentaEvento:', error);
        }
      );
      return;
    }
    this.getCuentas(id_cuenta, tipo).subscribe(
      (cuentas) => {
        this.cuentasSubject.next(cuentas);
        console.log('Cuenta fetched and stored:', cuentas);
        this.router.navigate(['/cuentaShow']);  // Navegar después de almacenar el socio
      },
      (error) => {
        console.error('Error fetching cuentas:', error);
      }
    );
  }

  updateCuentas(info: any, id: number | undefined): Observable<string> {
    const url = `${environment.urlDjango}/api/cuentas/${id}/`;
    return this.http.put<string>(url, info, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  addCuentas(info: any): Observable<string> {
    const url = `${environment.urlDjango}/api/cuentas/`;
    console.log('Enviando solicitud:', info);
    return this.http.post<string>(url, info, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

    deleteCuentas(id: number): Observable<any> {
      const url = `${environment.urlDjango}/api/cuentas/${id}/`;
      return this.http.delete(url, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }
  
    private handleError(error: HttpErrorResponse): Observable<never> {
      console.error('An error occurred:', error);
      return throwError(() => new Error('Something bad happened; please try again later.'));
    }

    anularCuenta (id: number): Observable<any> {
      const url = `${environment.urlDjango}/api/cuentas/anular/`;

      const body = { id_cuenta: id };  // Envía los datos en el body
      return this.http.post(url, body, { headers: this.getAuthHeaders() }).pipe(
        catchError(this.handleError)
      );
    }

    getCuota(id_cuenta: number): Observable<Cuota> {
      const url = `${environment.urlDjango}/api/cuentas/get_cuota/`;
      const body = { id_cuenta: id_cuenta };  // Envía los datos en el body
      return this.http.post<{ cuenta: Cuentas; n_socio: number; periodo: string }>(url, body, { headers: this.getAuthHeaders() }).pipe(
        map((response) => {
          // Combina las propiedades de 'cuenta' con 'id_evento' para crear un objeto CuentaEvento
          return {
            ...response.cuenta,
            n_socio: response.n_socio, // Agrega la propiedad 'eventoId'
            isCuota: true, // Marca como CuentaEvento
            periodo: response.periodo || '' // Asegúrate de que periodo esté definido
          } as Cuota;
        }),
        catchError(this.handleError)
      );
    }
    getCuentaEvento(id_cuenta: number): Observable<CuentaEvento> {
      const url = `${environment.urlDjango}/api/cuentas/get_cuenta_evento/`;
      const body = { id_cuenta };

      return this.http.post<{ cuenta: Cuentas; id_evento: number, subtipo: string }>(url, body, { headers: this.getAuthHeaders() }).pipe(
        map((response) => {
          // Combina las propiedades de 'cuenta' con 'id_evento' para crear un objeto CuentaEvento
          return {
            ...response.cuenta,
            eventoId: response.id_evento, // Agrega la propiedad 'eventoId'
            isCuentaEvento: true, // Marca como CuentaEvento
            subtipo: response.subtipo || ''
          } as CuentaEvento;
        }),
        catchError((error) => {
          console.error('Error al obtener CuentaEvento:', error);
          return throwError(() => new Error('Error al obtener CuentaEvento'));
        })
      );
    }

  clear(): void {
    this.cuentasSubject.next(undefined);
  }

  descargarCuentas(filters: any = {}) {
    console.log('Descargando cuentas...');
    const url = `${environment.urlDjango}/api/cuentas/descargar_pdf/`;
    const headers = this.getAuthHeaders();
    // Ahora enviamos los filtros como body en una petición POST
    return this.http.post(url, filters, { headers, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  filterCuentas(filters: any, page: number = 1, pageSize: number = 10): Observable<any> {
    const url = `${environment.urlDjango}/api/cuentas/filtrar/`;
    const headers = this.getAuthHeaders();
    const body = { ...filters, page, page_size: pageSize };
    return this.http.post<any>(url, body, { headers }).pipe(
      map(response => {
        // Si el backend devuelve un array plano, lo envolvemos en { results: [...] }
        if (Array.isArray(response)) {
          return { results: response };
        }
        // Si ya es un objeto con results, lo devolvemos tal cual
        return response;
      }),
      catchError(this.handleError)
    );
  }
  imprimirTicket(info: any, asiento?: any): Observable<Blob> {
    const url = `${environment.urlDjango}/api/cuentas/imprimir_ticket/`;
    const headers = this.getAuthHeaders();
    return this.http.post(url, {info, asiento}, { headers, responseType: 'blob' }); 
  }

  comprobarPago(n_socio: number, mes: number): Observable<boolean> {
    const url = `${environment.urlDjango}/api/cuentas/comprobar_pago/`;
    const body = { 'n_socio':n_socio, 'mes': mes };
    return this.http.post<boolean>(url, body, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al comprobar pago:', error);
        return throwError(() => new Error('Error al comprobar pago'));
      })
    );
  }
}

