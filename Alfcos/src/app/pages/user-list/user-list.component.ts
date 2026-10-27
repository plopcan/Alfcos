import { Component} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../interfaces/usuario';
import { Router } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, filter, Observable, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { Socio } from '../../interfaces/socio';
import { CommonModule, NgFor } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Validation } from '../../utils/validation';
import { SocioService } from '../../core/services/socio.service';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [AsyncPipe, ErrorMessageComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})

export class UserListComponent {
  rol!: string | null
  user!: Usuario | undefined
  userList$!: Observable<Usuario[]>
  socioList$: Socio[] = []
  errorMessage!: string
  submitted = false;
  
  oldUserForm: FormGroup
  newUserForm: FormGroup

  constructor(private auth: AuthService, private router: Router, private Uservice: UsuarioService, private fb: FormBuilder
  ){
    this.oldUserForm = this.fb.group({
      user: ['', Validators.required],
      new_psw: ['', Validators.required],
      new_psw_confirm: ['', Validators.required],
    n_socio: ['', Validators.required],
    rol: ['', Validators.required],
    id: ['', Validators.required],
    tipoDocumento: ['dni', Validators.required]
    },
  {
    validators: [Validation.match('new_psw', 'new_psw_confirm')],
    valDoc: [Validation.validateDocument()]
  });
  this.newUserForm = this.fb.group({
    user: ['', Validators.required],
    new_psw: ['', Validators.required],
    new_psw_confirm: ['', Validators.required],
  n_socio: ['', Validators.required],
  rol: ['', Validators.required],
  tipoDocumento: ['dni', Validators.required]
  },
{
  validators: [Validation.match('new_psw', 'new_psw_confirm')],
  valDoc: [Validation.validateDocument()]
});
  }
    ngOnInit(): void{
      if(this.auth.isLoggedIn){
        this.rol = sessionStorage.getItem("rol");
        if(this.rol != null){
          if(this.rol == "admin"){
            this.userList$ = this.Uservice.getUserList().pipe(catchError((error:string)=>{
              this.errorMessage = error;
      
              return EMPTY;
            })) ;
          }else{
            this.Uservice.getRegistredUser(sessionStorage.getItem("user")).subscribe(user => {
              this.user = user;
            });
          }

        }
      }else{
        this.router.navigate(['/']);
      }
    }

    isloged(){
      return this.auth.isLoggedIn;
    }

    updateUser(n_socio: string){
      if (n_socio) {
        this.errorMessage = "";
        this.Uservice.fetchAndStoreUser(n_socio);
        console.log('Enviando socio:', n_socio);
      } else {
        this.errorMessage = "No se ha encontrado el socio";
      }
  }
    

    addUser(){
      this.Uservice.clearUser();
      this.router.navigate(['/usuarioForm']);
    }

    onReset(): void {
      this.submitted = false;
      this.oldUserForm.reset();
    }

  get f(): { [key: string]: AbstractControl } {
    return this.oldUserForm.controls;
  }

  delete(id:string){
    this.submitted = true;
    let success = this.Uservice.deleteUsuario(id).subscribe(
      () => {
        console.log('Socio eliminado');
        this.userList$ = this.Uservice.getUserList().pipe(
          catchError((error: string) => {
            this.errorMessage = error;
            return EMPTY;
          })
        );
      },
      (error) => {
        console.error('Error al eliminar el socio:', error);
        this.errorMessage = "Error al eliminar el socio";
      }
    );
  }

  
  getUser(n_socio: string): void {
    if (n_socio) {
      this.errorMessage = "";
      this.Uservice.fetchAndStoreUser(n_socio);
      console.log('Enviando socio:', n_socio);
    } else {
      this.errorMessage = "No se ha encontrado el socio";
    }
}
}
