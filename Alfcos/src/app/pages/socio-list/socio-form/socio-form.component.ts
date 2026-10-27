import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Socio } from '../../../interfaces/socio';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocioService } from '../../../core/services/socio.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Validation } from '../../../utils/validation';

@Component({
  selector: 'app-socio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './socio-form.component.html',
  styleUrls: ['./socio-form.component.css']
})
export class SocioFormComponent implements OnInit {
  socio: Socio | undefined;
  public sF!: FormGroup;
  errorMessage!: string;
  imgLink!: string;

  constructor(private fb: FormBuilder, private socioServ: SocioService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.socioServ.socio$.subscribe((socio) => {
      this.socio = socio;
      console.log('Socio:', this.socio);

      this.sF = this.fb.group({
        nombre: [this.socio?.nombre || '', Validators.required],
        apellido: [this.socio?.apellido || '', Validators.required],
        sexo_id: [this.socio?.sexo_id || '1', Validators.required],
        dni: [this.socio?.dni || '', Validators.required],
        tipoDocumento: ['dni', Validators.required],
        n_socio: [this.socio?.n_socio || ''],
        direccion: [this.socio?.direccion || '', Validators.required],
        c_postal: [this.socio?.c_postal || '', Validators.required],
        telefono: [this.socio?.telefono || '', Validators.required],
        fecha_nacimiento: [this.socio?.fecha_nacimiento || '', Validators.required],
        foto: [null]
      }, {
        validators: [Validation.validateDocument()]
      });

      this.cdr.markForCheck();
    });
  }

  sendData() {
    Object.values(this.sF.controls).forEach(control => {
    control.markAsTouched();
    control.markAsDirty();
  });

  this.sF.updateValueAndValidity();

    if (this.sF.invalid) {
      // Puedes personalizar el mensaje según el error
      console.log(this.sF.value)
      if (this.sF.errors && this.sF.errors['DocValid'] === false) {
        this.errorMessage = "El DNI no es válido.";
      } else {
        this.errorMessage = "Por favor, revisa los campos del formulario.";
      }
      return;
    }else{
      this.errorMessage = ""; // Limpiar mensaje de error si el formulario es válido
      if (this.socio) {
        console.log('actualizar')
        this.updateSocio();
      } else {
        console.log('creado socio');
        this.addSocio();
      }
     }
  }

  updateSocio() {
    this.sF.updateValueAndValidity();
    let info = this.sF.value;
    //info.nacimiento = this.formatDate(info.nacimiento); // Formatear la fecha
    this.socioServ.updateSocio(info, this.socio?.n_socio).subscribe(
      (response) => {
        this.router.navigate(['/socios']);
      },
      (error) => {
        this.errorMessage = "Error al actualizar el socio";
      }
    );
  }

  addSocio() {
    this.sF.updateValueAndValidity();
    let info = this.sF.value;
    info.nacimiento = this.formatDate(info.fecha_nacimiento); // Formatear la fecha
    console.log('Enviando socio:', info);
    this.socioServ.addSocio(info).subscribe(
      (response) => {
        this.router.navigate(['/socios']);
      },
      (error) => {
        this.errorMessage = "Error al añadir el socio";
      }
    );
  }

  private formatDate(date: string): string {
    const dateParts = date.split('-');
    if (dateParts.length === 3) {
      // Assuming the date is in yyyy-mm-dd format
      return date;
    } else {
      const [day, month, year] = date.split('/');
      return `${year}-${month}-${day}`;
    }
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.sF.patchValue({
      foto: file
    });
    this.sF.get('foto')?.updateValueAndValidity();
  }
  
}
