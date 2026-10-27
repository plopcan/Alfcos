import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '../../interfaces/usuario';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
    private usuarioSubject = new BehaviorSubject<Usuario | undefined>(undefined);
    user$ = this.usuarioSubject.asObservable();
    usuario!: Usuario;
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

  getUser(loginInfo: any): Observable<Usuario> {
    const { nombre, password } = loginInfo;
    const url = `${environment.urlDjango}/api/usuarios/buscar/?nombre=${nombre}&password=${password}`;
    console.log('Enviando solicitud a:', url);
    return this.http.get<Usuario>(url, { headers: this.getAuthHeaders() });
  }

  getRegistredUser(n_socio: string | null): Observable<Usuario | undefined> {
    const url = `${environment.urlDjango}/api/usuarios/buscarRegistrado/`;
    console.log('Enviando solicitud a:', url);
    const body = { n_socio }; // Envía los datos en el body
    const headers = this.getAuthHeaders(); // Asegúrate de que sean correctos
    return this.http.post<Usuario>(url, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getUserList(): Observable<Usuario[]>{
    const url = `${environment.urlDjango}/api/usuarios/`;
    console.log('Enviando solicitud a:', url);
    return this.http.get<Usuario[]>(url, { headers: this.getAuthHeaders() });
  }


  updateUser(userInfo: any, id: string  | undefined): Observable<string> {
    const url = `${environment.urlDjango}/api/usuarios/${id}/`;
    console.log('Enviando solicitud a:', url);
    return this.http.put<string>(url, userInfo, { headers: this.getAuthHeaders() });
  }
  
  addSocio(userInfo: any): Observable<string> {
    const url = `${environment.urlDjango}/api/usuarios/`;
    return this.http.post<string>(url, userInfo, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
  
  deleteUsuario(id: string): Observable<any> {
    const url = `${environment.urlDjango}/api/usuarios/${id}/`;
    return this.http.delete(url, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
      
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

        
  fetchAndStoreUser(n_socio: string | null): void {
    this.getRegistredUser(n_socio).subscribe(
      (user) => {
        if (user) {
          this.usuarioSubject.next(user);
          console.log('Usuario fetched and stored:', user);
          this.router.navigate(['/usuarioForm']); // Navegar después de almacenar el usuario
        } else {
          console.error('Usuario no encontrado');
        }
      },
      (error) => {
        console.error('Error fetching usuario:', error);
      }
    );
  }
  clearUser(): void {
    this.usuarioSubject.next(undefined);
  }

}
