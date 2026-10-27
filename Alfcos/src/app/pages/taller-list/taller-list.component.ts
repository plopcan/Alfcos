import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, catchError, EMPTY } from 'rxjs';
import { Taller } from '../../interfaces/taller';
import { TallerService } from '../../core/services/taller.service';
import { Router } from '@angular/router';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-taller-list',
  standalone: true,
  imports: [AsyncPipe, ErrorMessageComponent, FormsModule],
  templateUrl: './taller-list.component.html',
  styleUrls: ['./taller-list.component.css']
})
export class TallerListComponent implements OnInit {
  public tallerList$!: Observable<any>;
  public errorMessage!: string;
  public taller$ = new BehaviorSubject<Taller | undefined>(undefined);
  showForm = false;

  // Pagination properties
  currentPage = 1;
  hasNextPage = true;

  // Filtro properties
  filterNombre: string = '';
  filterMonitor: string = '';
  filterDia: string = '';
  filterPlazas: string = '';

  diasDisponibles: string[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

  constructor(private service: TallerService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.loadPage(this.currentPage);
  }

  onFilterSubmit(): void {
    this.currentPage = 1;
    this.filterTalleres(this.currentPage);
  }

  clearFilters(): void {
    this.filterNombre = '';
    this.filterMonitor = '';
    this.filterDia = '';
    this.filterPlazas = '';
    this.currentPage = 1;
    this.loadPage(this.currentPage);
  }

  getFilterData(): any {
    const filterData: any = {};
    if (this.filterNombre) filterData.nombre = this.filterNombre;
    if (this.filterMonitor) filterData.monitor = this.filterMonitor;
    if (this.filterDia) filterData.dia = this.filterDia;
    if (this.filterPlazas) filterData.plazas = this.filterPlazas;
    return filterData;
  }

  hasActiveFilters(): boolean {
    return !!(this.filterNombre || this.filterMonitor || this.filterDia || this.filterPlazas);
  }

  filterTalleres(page: number = 1): void {
    this.tallerList$ = this.service.filterTalleres(this.getFilterData(), page).pipe(
      catchError((error: string) => {
        this.errorMessage = error;
        return EMPTY;
      })
    );
    this.tallerList$.subscribe(response => {
      // Si el backend no devuelve paginación, forzamos el formato para la tabla
      if (Array.isArray(response)) {
        // Filtrar en el frontend si el backend no filtra correctamente
        const filters = this.getFilterData();
        let filtered = response;
        if (filters.nombre) filtered = filtered.filter((t: any) => t.nombre?.toLowerCase().includes(filters.nombre.toLowerCase()));
        if (filters.monitor) filtered = filtered.filter((t: any) => t.monitor?.toLowerCase().includes(filters.monitor.toLowerCase()));
        if (filters.dia) {
          filtered = filtered.filter((t: any) =>
            Array.isArray(t.dia)
              ? t.dia.map((d: string) => d.trim().toLowerCase()).includes(filters.dia.toLowerCase())
              : typeof t.dia === 'string'
                ? t.dia.split(',').map((d: string) => d.trim().toLowerCase()).includes(filters.dia.toLowerCase())
                : false
          );
        }
        if (filters.plazas) filtered = filtered.filter((t: any) => String(t.plazas_libres) === String(filters.plazas));
        this.hasNextPage = false;
        this.tallerList$ = new BehaviorSubject({ results: filtered }).asObservable();
      } else {
        this.hasNextPage = !!response?.next;
      }
    });
  }

  loadPage(page: number): void {
    if (this.hasActiveFilters()) {
      this.filterTalleres(page);
      return;
    }
    this.tallerList$ = this.service.getTallerListPaginated(page).pipe(
      catchError((error: string) => {
        this.errorMessage = error;
        return EMPTY;
      })
    );
    this.tallerList$.subscribe(response => {
      this.hasNextPage = !!response?.next;
    });
  }

  getTaller(id_taller: number): void {
    console.log('ID Taller:', id_taller);
    if (id_taller) {
      this.errorMessage = "";
      this.service.fetchAndStoreTaller(id_taller.toString());
      console.log('Enviando taller:', id_taller);
    } else {
      this.errorMessage = "No se ha encontrado el taller";
    }
  }

  addTaller(): void {
    this.service.clear();
    this.router.navigate(['/tallerForm']);
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

  deleteTaller(id_taller: number): void {
  const confirmar = confirm(
    `¿Estás seguro de que quieres eliminar el taller?`
  );
  if(confirmar){
    this.service.deleteTaller(id_taller).subscribe(
      () => {
        console.log('Taller eliminado');
        this.loadPage(this.currentPage);
      },
      (error) => {
        console.error('Error al eliminar el taller:', error);
        this.errorMessage = "Error al eliminar el taller";
      }
    );
  }
}
}
