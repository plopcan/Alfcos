import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuentasService } from '../../../core/services/cuentas.service';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-cuentas-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cuentas-form.component.html',
  styleUrl: './cuentas-form.component.css'
})
export class CuentasFormComponent {
  cuentasForm: FormGroup;
  errorMessage: string = '';

  // Nuevo getter para saber si el tipo es cuota
  get isCuota(): boolean {
    return this.cuentasForm.get('tipo_id')?.value == '2';
  }

  // Nuevo getter para saber si el tipo es cuenta_evento
  get isCuentaEvento(): boolean {
    return this.cuentasForm.get('tipo_id')?.value == '1';
  }

  constructor(private fb: FormBuilder, private cuentasService: CuentasService, private router: Router, private route: ActivatedRoute) {
    this.cuentasForm = this.fb.group({
      descripcion: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+\.?\d{0,2}$/)]],
      tipo_id: ['', Validators.required],
      n_socio: [''], // Optional
      id_evento: [''], // Optional
      periodo: [''],   // Nuevo campo para periodo
      subtipo: ['']    // Nuevo campo para subtipo
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      if (params['n_socio']) {
        this.cuentasForm.patchValue({
          tipo_id: '2', // Cuota
          n_socio: params['n_socio']
        });
        //this.cuentasForm.get('tipo_id')?.disable();
        //this.cuentasForm.get('n_socio')?.disable();
      }
      if (params['id_evento']) {
        this.cuentasForm.patchValue({
          tipo_id: '1', // Cuenta Evento
          id_evento: params['id_evento']
        });
        this.cuentasForm.get('tipo_id')?.disable();
        this.cuentasForm.get('id_evento')?.disable();
      }
    });
  }
  onSubmit(): void {
    if (this.cuentasForm.valid) {
      const formValue = { ...this.cuentasForm.value };

      // Remove unused fields based on the selected type
      if (formValue.tipo_id != '2') {
        delete formValue.n_socio;
        delete formValue.periodo; // Solo enviar periodo si es cuota
      }
      if (formValue.tipo_id != '1') {
        delete formValue.id_evento;
        delete formValue.subtipo; // Solo enviar subtipo si es cuenta_evento
      }
      console.log('Formulario enviado:', formValue);

      this.cuentasService.addCuentas(formValue).subscribe({
        next: (response) => {
          console.log('Cuenta creada exitosamente:', response);
          this.router.navigate(['/cuentas']); // Navigate to /cuentas
        },
        error: (error) => {
          console.error('Error al crear la cuenta:', error);
        }
      });
    }else{
      console.error('Formulario inválido:', this.cuentasForm.errors);
      // Aquí podrías mostrar un mensaje de error al usuario si lo deseas
    }
  }

  imprimir(): void {
    console.log('Imprimiendo ticket con los datos:', this.cuentasForm.getRawValue());
    let info = this.cuentasForm.getRawValue()
    
        this.cuentasService.imprimirTicket(info).subscribe({
          next: (response) => {
          const blob = new Blob([response], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
        error: (error) => {
          console.error('Error al imprimir el ticket:', error);
        }
        });
  }
}
