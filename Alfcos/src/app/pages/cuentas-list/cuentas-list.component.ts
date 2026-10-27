import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CuentasService } from '../../core/services/cuentas.service';
import { catchError, EMPTY, Observable, BehaviorSubject, map, tap, of } from 'rxjs';
import { Cuentas } from '../../interfaces/cuentas';
import { ErrorMessageComponent } from "../../components/error-message/error-message.component";
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cuentas-list',
  standalone: true,
  imports: [AsyncPipe, ErrorMessageComponent, FormsModule, CommonModule],
  templateUrl: './cuentas-list.component.html',
  styleUrl: './cuentas-list.component.css'
})
export class CuentasListComponent implements OnInit {
  public cuentasList$!: Observable<any>;
  public errorMessage!: string;
  public cuenta$ = new BehaviorSubject<Cuentas | undefined>(undefined);
  showForm = false;

  // Pagination properties
  currentPage = 1;
  hasNextPage = true;
  totalPages: number = 1;

  // Filtro properties
  filterTipo: string = '';
  filterAnulada: string = '';
  // Nuevos filtros de intervalo de fechas
  filterFechaInicioDia: string = '';
  filterFechaInicioMes: string = '';
  filterFechaInicioAnio: string = '';
  filterFechaFinDia: string = '';
  filterFechaFinMes: string = '';
  filterFechaFinAnio: string = '';

  // Meses en español
  public meses: string[] = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  constructor(private service: CuentasService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.loadPage(this.currentPage);
  }

  loadPage(page: number): void {
    let obs: Observable<any>;
    if (this.hasActiveFilters()) {
      obs = this.service.filterCuentas(this.getFilterData(), page).pipe(
        tap(response => {
          this.hasNextPage = !!response?.next;
          this.totalPages = Math.ceil(response.count / 10); // 10 es el tamaño de página
          this.currentPage = page;
        }),
        map(response => response && response.results ? response : { results: [] }),
        catchError((error: string) => {
          this.errorMessage = error;
          return of({ results: [] });
        })
      );
    } else {
      obs = this.service.getCuentasList(page).pipe(
        tap(response => {
          this.hasNextPage = !!response?.next;
          this.totalPages = Math.ceil(response.count / 10); // <-- Añade esta línea aquí también
          this.currentPage = page;
        }),
        map(response => response && response.results ? response : { results: [] }),
        catchError((error: string) => {
          this.errorMessage = error;
          return of({ results: [] });
        })
      );
    }
    this.cuentasList$ = obs;
    this.cdr.detectChanges();
  }

  getFilterData(): any {
    const filterData: any = {};
    if (this.filterTipo) filterData.tipo = this.filterTipo;
    if (this.filterAnulada) filterData.anulada = this.filterAnulada;
    // Intervalo de fechas (enviamos el nombre del mes)
    if (this.filterFechaInicioDia) filterData.fecha_inicio_dia = this.filterFechaInicioDia;
    if (this.filterFechaInicioMes) filterData.fecha_inicio_mes = this.filterFechaInicioMes;
    if (this.filterFechaInicioAnio) filterData.fecha_inicio_anio = this.filterFechaInicioAnio;
    if (this.filterFechaFinDia) filterData.fecha_fin_dia = this.filterFechaFinDia;
    if (this.filterFechaFinMes) filterData.fecha_fin_mes = this.filterFechaFinMes;
    if (this.filterFechaFinAnio) filterData.fecha_fin_anio = this.filterFechaFinAnio;
    return filterData;
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filterTipo ||
      this.filterAnulada ||
      this.filterFechaInicioDia ||
      this.filterFechaInicioMes ||
      this.filterFechaInicioAnio ||
      this.filterFechaFinDia ||
      this.filterFechaFinMes ||
      this.filterFechaFinAnio
    );
  }

  filterCuentas(page: number = 1): void {
    this.cuentasList$ = this.service.filterCuentas(this.getFilterData(), page).pipe(
      tap(response => { this.hasNextPage = !!response?.next;
      this.totalPages = Math.ceil(response.count / 10); // 10 es el tamaño de página
      this.currentPage = page;
       }),
      map(response => response && response.results ? response : { results: [] }),
      catchError((error: string) => {
        this.errorMessage = error;
        return of({ results: [] });
      })
    );
    this.cdr.detectChanges();
  }

  onFilterSubmit(): void {
    this.currentPage = 1;
    this.loadPage(this.currentPage);
  }

  clearFilters(): void {
    this.filterTipo = '';
    this.filterAnulada = '';
    this.filterFechaInicioDia = '';
    this.filterFechaInicioMes = '';
    this.filterFechaInicioAnio = '';
    this.filterFechaFinDia = '';
    this.filterFechaFinMes = '';
    this.filterFechaFinAnio = '';
    this.currentPage = 1;
    this.loadPage(this.currentPage);
  }

  getCuenta(id_cuenta: number, tipo:string): void {
    if (id_cuenta) {
      this.errorMessage = "";
      this.service.fetchAndStoreCuenta(id_cuenta.toString(), tipo);
      console.log('Enviando cuenta:', id_cuenta);
    } else {
      this.errorMessage = "No se ha encontrado la cuenta";
    }
  }

  addCuenta() {
    this.service.clear();
    this.router.navigate(['/cuentaForm']);
  }

  deleteCuenta(id_cuenta: number) {
    this.service.deleteCuentas(id_cuenta).subscribe(
      () => {
        console.log('Cuenta eliminada');
        this.loadPage(this.currentPage);
      },
      (error) => {
        console.error('Error al eliminar la cuenta:', error);
        this.errorMessage = "Error al eliminar la cuenta";
      }
    );
  }

  anularCuenta(id_cuenta: number): void {
    
  const confirmar = confirm(
    `¿Estás seguro de que quieres anular la cuenta?`
  );
  if(confirmar){
    this.service.anularCuenta(id_cuenta).subscribe(
      () => {
        console.log('Cuenta anulada');
        this.loadPage(this.currentPage);
      },
      (error) => {
        console.error('Error al anular la cuenta:', error);
        this.errorMessage = "Error al anular la cuenta";
      }
    );
  }
}

  descargar() {
    // Enviar los filtros actuales al backend para descargar el PDF filtrado
    const filters = this.getFilterData();
    this.service.descargarCuentas(filters).subscribe(
      (response) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cuentas.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Error al descargar el PDF:', error);
      }
    );
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPage(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadPage(this.currentPage);
    }
  }
}
