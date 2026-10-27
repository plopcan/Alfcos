import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario } from '../../interfaces/usuario';
import { SessionService } from '../../core/services/session.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ErrorMessageComponent } from "../../components/error-message/error-message.component";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, ErrorMessageComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
    usuario!: Usuario

    loged: boolean = false;

    errorText!: string

    loginForm = new FormGroup({
    nombre: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
    })

    constructor(private service: UsuarioService, private router: Router,
      private authService: AuthService, private cdr: ChangeDetectorRef
    ){}


    handlerUserForm(): void{
      this.cdr.markForCheck();
        let loginInfo = this.loginForm.value;
        if(this.loginForm.valid){
          console.log('Enviando información de login:', loginInfo);
          this.service.getUser(loginInfo).subscribe(
            (response) => {
              console.log('Respuesta recibida:', response);
              this.usuario = response;
              if(this.usuario != null){
                this.errorText = "";
                sessionStorage.setItem("nombre", this.usuario.nombre);
                sessionStorage.setItem("rol", this.usuario.rol);
                sessionStorage.setItem("n_socio", this.usuario.n_socio);
                this.authService.login();
                this.router.navigate(['/socios']);
              } else {
                this.errorText = "Los datos introducidos no son correctos";
              }
            },
            (error) => {
              console.error('Error al recibir el usuario del servidor:', error);
              this.errorText = "Error al recibir el usuario del servidor";
            }
          );
        }
    }
}
