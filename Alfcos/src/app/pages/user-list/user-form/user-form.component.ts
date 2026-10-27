import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Usuario } from '../../../interfaces/usuario';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Validation } from '../../../utils/validation';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent {
  user: Usuario | undefined;
  public uF!: FormGroup;
  errorMessage!: string;
  submitted = false;
  full = false;

  constructor(private auth: AuthService,private fb: FormBuilder, private userServ: UsuarioService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.userServ.user$.subscribe((user) => {
      this.user = user;
      console.log('Socio:', this.user);

      this.uF = this.fb.group({
        nombre: [this.user?.nombre || '', Validators.required],
        password: ['', Validators.required],
        new_psw_confirm: ['', Validators.required],
        n_socio: [this.user?.n_socio || '', Validators.required],
        rol: [this.user?.rol, Validators.required]},
          {
            validators: [Validation.match('password', 'new_psw_confirm')],
            valDoc: [Validation.validateDocument()]
          });
          this.full = sessionStorage.getItem('rol') !== 'admin' || this.user?.rol === 'admin' ? false : true;
      this.cdr.markForCheck();
    });
  }

  isloged(){
    return this.auth.isLoggedIn;
  }

  sendData() {
    if (this.user) {
      this.updateUsuario();
    } else {
      this.addUsuario();
    }
  }

  updateUsuario() {
    this.uF.updateValueAndValidity();
    let info = this.uF.value;
    console.log('Enviando socio:', info, this.user?.n_user);
    this.userServ.updateUser(info, this.user?.n_user).subscribe(
      (response) => {
        this.router.navigate(['/usuarios']);
      },
      (error) => {
        this.errorMessage = "Error al actualizar el socio";
      }
    );
  }

  addUsuario() {
    this.uF.updateValueAndValidity();
    let info = this.uF.value;
    console.log('Enviando socio:', info);
    this.userServ.addSocio(info).subscribe(
      (response) => {
        this.router.navigate(['/usuarios']);
      },
      (error) => {
        this.errorMessage = "Error al añadir el socio";
      }
    );
  }

}
