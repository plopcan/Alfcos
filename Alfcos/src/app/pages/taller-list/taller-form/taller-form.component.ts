import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TallerService } from '../../../core/services/taller.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Taller } from '../../../interfaces/taller';
import { Clase } from '../../../interfaces/clase';
import { catchError, EMPTY, Observable } from 'rxjs';
import { CuentasService } from '../../../core/services/cuentas.service';

@Component({
  selector: 'app-taller-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './taller-form.component.html',
  styleUrls: ['./taller-form.component.css']
})
export class TallerFormComponent implements OnInit {
  taller: Taller | undefined;
  public tF!: FormGroup;
  public inscribir!: FormGroup;
  errorMessage!: string;
  socios$: Observable<any> | undefined;

  // Pagination properties for classes
  currentPage = 1;
  hasNextPage = true;

  constructor(private fb: FormBuilder, private tallerServ: TallerService, private cdr: ChangeDetectorRef, private router: Router,
              private cuentaServ: CuentasService) {}

  ngOnInit(): void {
    this.tallerServ.taller$.subscribe((taller) => {
      this.taller = taller;
      console.log('Taller recibido:', taller);
      console.log('Taller:', taller?.dia);

      this.tF = this.fb.group({
        nombre: [taller?.nombre || '', Validators.required],
        descripcion: [this.taller?.descripcion || '', Validators.required],
        monitor: [this.taller?.monitor || '', Validators.required],
        hora_inicio: [this.taller?.hora_inicio || '', Validators.required],
        hora_fin: [this.taller?.hora_fin || '', Validators.required],
        plazas: [this.taller?.plazas || 0, [Validators.required, Validators.min(1)]],
        Lunes: [this.taller?.dia?.includes('Lunes') || false],
        Martes: [this.taller?.dia?.includes('Martes') || false],
        Miercoles: [this.taller?.dia?.includes('Miercoles') || false],
        Jueves: [this.taller?.dia?.includes('Jueves') || false],
        Viernes: [this.taller?.dia?.includes('Viernes') || false]
      });

      if (this.taller) {
        this.fetchSociosPaginated(this.taller.n_taller, this.currentPage); // Ensure socios are fetched
      }

      this.cdr.markForCheck();
    });

    this.inscribir = this.fb.group({
      n_socio: [null, Validators.required],
    });
  }

  fetchSocios(id_taller: number): void {
    this.socios$ = this.tallerServ.listarSocios(id_taller).pipe(
            catchError((error: string) => {
              this.errorMessage = error;
              return EMPTY;
            })
    );
  }

  fetchSociosPaginated(id_taller: number, page: number): void {
    if (!id_taller) {
      console.error('El ID del taller es inválido.');
      this.errorMessage = 'No se pudo cargar la lista de socios.';
      return;
    }

    this.socios$ = this.tallerServ.getClasesPaginated(id_taller, page).pipe(
      catchError((error: string) => {
        this.errorMessage = `Error al obtener la lista de clases: ${error}`;
        console.error(this.errorMessage);
        return EMPTY;
      })
    );
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchSociosPaginated(this.taller!.n_taller, this.currentPage);
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.fetchSociosPaginated(this.taller!.n_taller, this.currentPage);
    }
  }

  isDaySelected(day: string): boolean {
    const currentDias = this.tF.get('dias')?.value || [];
    return currentDias.includes(day); // Check only the form control value
  }

  toggleDay(day: string): void {
    const currentDias = this.tF.get('dias')?.value || [];
    if (currentDias.includes(day)) {
      this.tF.patchValue({ dias: currentDias.filter((d: string) => d !== day) });
    } else {
      this.tF.patchValue({ dias: [...currentDias, day] });
    }
  }

  sendData() {
    if (this.tF.valid) {
      const formData = this.tF.value;
      const selectedDias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'].filter(
        (dia) => formData[dia]
      );
      const finalData = { ...formData, dia: selectedDias };
      console.log('Datos del formulario:', finalData);
      if (this.taller) {
        this.updateTaller(finalData);
      } else {
        this.addTaller(finalData);
      }
    }else{
      this.errorMessage = "Por favor, completa todos los campos requeridos.";
    }
  }

  updateTaller(formData: any) {
    this.tF.updateValueAndValidity();
    console.log(this.taller?.n_taller);
    this.tallerServ.updateTaller(formData, this.taller?.n_taller).subscribe(
      () => this.router.navigate(['/talleres']),
      () => (this.errorMessage = "Error al actualizar el taller")
    );
  }

  addTaller(formData: any) {
    this.tF.updateValueAndValidity();
    console.log('Enviando taller:', formData);
    this.tallerServ.addTaller(formData).subscribe(
      () => this.router.navigate(['/talleres']),
      () => (this.errorMessage = "Error al añadir el taller")
    );
  }
  
  trackByAttributes(index: number, item: any): string {
    return `${item.nombre}-${item.apellido}`; // Combina los dos atributos en un string único
  }

  inscribirSocio() {
    if (this.inscribir.valid) {
      const formData = this.inscribir.value;
      this.cuentaServ.comprobarPago(formData.n_socio, new Date().getMonth() + 1).subscribe(
        (pago) => {
        if (pago) {
          console.log('Datos del formulario:', formData);
        if (this.taller) {
          this.tallerServ.inscribirSocio(this.taller.n_taller, formData.n_socio).subscribe(
            () => this.router.navigate(['/talleres']),
            () => (this.errorMessage = "Error al inscribir el socio")
          );
        } else {
          this.errorMessage = "No se ha encontrado el taller";
        }
      } else {
          this.errorMessage = "El socio no ha pagado la cuota correspondiente.";
        }
        },
        (error) => {
          console.error('Error al comprobar el pago:', error);
          this.errorMessage = "Error al comprobar el pago del socio.";
        }
      );
      
    }
  }
  quitarSocio(nombre: string, apellidos: string) {
    if (this.taller) {
      this.tallerServ.quitarSocio(this.taller.n_taller, nombre, apellidos).subscribe(
        () => this.router.navigate(['/talleres']),
        () => (this.errorMessage = "Error al quitar el socio")
      );
    } else {
      this.errorMessage = "No se ha encontrado el taller";
    }
  }
  descargarLista() {
    if (this.taller) {
      this.tallerServ.descargar_clases(this.taller.n_taller).subscribe(
        (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Listado_Alumnos_Taller_${this.taller?.nombre}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      );
    } else {
      this.errorMessage = "No se ha encontrado el taller";
    }
  }
}
