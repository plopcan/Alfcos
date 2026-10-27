import { Component, OnInit } from '@angular/core';
import { CuentasService } from '../../../core/services/cuentas.service';
import { Cuentas } from '../../../interfaces/cuentas';
import { Cuota } from '../../../interfaces/cuota';
import { CuentaEvento } from '../../../interfaces/cuenta_evento';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cuentas-show',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cuentas-show.component.html',
  styleUrls: ['./cuentas-show.component.css']
})
export class CuentasShowComponent implements OnInit {
  cuenta: Cuentas | null = null;
  cuota: Cuota | null = null;
  cuentaEvento: CuentaEvento | null = null;

  constructor(private cuentasService: CuentasService) {}

  ngOnInit(): void {
    this.cuentasService.cuentas$.subscribe((cuenta) => {
      if (cuenta) {
        if ('tipo' in cuenta && !('n_socio' in cuenta) && !('eventoId' in cuenta)) {
          this.cuenta = cuenta as Cuentas;
          this.cuota = null;
          this.cuentaEvento = null;
        } else if ('n_socio' in cuenta) {
          console.log('cuota:' + cuenta.n_socio);
          this.cuota = cuenta as Cuota;
          this.cuenta = null;
          this.cuentaEvento = null;
        } else if ('eventoId' in cuenta) {
          console.log('evento:' + cuenta);
          this.cuentaEvento = cuenta as CuentaEvento;
          this.cuenta = null;
          this.cuota = null;
        }
      }
    });
  }
  imprimir(): void {
    let info;
    if (this.cuenta) {
      info = {'cantidad': this.cuenta.cantidad, 'descripcion': this.cuenta.descripcion, 'tipo_id': this.cuenta.tipo == 'Ingreso' ? 3 : 4, 'fecha': this.cuenta.fecha};
      
    } else if (this.cuota) {
      info = {'n_socio': this.cuota.n_socio, 'cantidad': this.cuota.cantidad, 'periodo': this.cuota.periodo, 'tipo_id': 2, 'descripcion': this.cuota.descripcion, 'fecha': this.cuota.fecha};
      
    } else if (this.cuentaEvento) {
      let datos = this.extraerGrupoYAsiento(this.cuentaEvento.descripcion);
      info = {'id_evento': this.cuentaEvento.eventoId, 'cantidad': this.cuentaEvento.cantidad, 'descripcion': this.cuentaEvento.descripcion,
         'subtipo': this.cuentaEvento.subtipo, 'tipo_id': 1, 'fecha': this.cuentaEvento.fecha, 'n_grupo': datos ? datos.grupo : null, 'n_asiento': datos ? datos.asiento : null};
      
    }
    
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

  extraerGrupoYAsiento(descripcion: string): { grupo: number, asiento: number } | null {
  const regex = /Reserva de asiento\s+(\d+)-(\d+)/;
  const match = descripcion.match(regex);

  if (match) {
    return {
      grupo: parseInt(match[1], 10),
      asiento: parseInt(match[2], 10)
    };
  }
  return null;
}

}

