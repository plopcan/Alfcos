import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { SessionService } from './core/services/session.service';
import { AuthService } from './core/services/auth.service';
import { UsuarioService } from './core/services/usuario.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Alfcos';
  errorMessage!: string
  constructor(private session: SessionService,
    private authService: AuthService, private router: Router, private Uservice: UsuarioService){}
  isloged(){
    return this.authService.isLoggedIn;
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
    
  getUser(): void {
    if (sessionStorage.getItem("rol") === "admin") {
      this.router.navigate(['/usuarios']);
    } else {
      this.errorMessage = "";
      this.Uservice.fetchAndStoreUser(sessionStorage.getItem("n_socio"));
    }
    
  }

  logout(): void {
    // Elimina los datos de la sesión
    sessionStorage.clear();

    // Redirige al usuario a la página de inicio de sesión o a la página principal
    this.router.navigate(['/']);
  }
  
}
