import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, Observable } from 'rxjs';
import { Evento } from '../../interfaces/evento';
import { EventoService } from '../../core/services/evento.service';
import { Router } from '@angular/router';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-evento-list',
  standalone: true,
  imports: [AsyncPipe, ErrorMessageComponent, FormsModule, CommonModule],
  templateUrl: './evento-list.component.html',
  styleUrl: './evento-list.component.css'
})
export class EventoListComponent {
public eventoList$!: Observable<any>;
  public errorMessage!: string;
  public socio$ = new BehaviorSubject<Evento | undefined>(undefined);
  showForm = false;

  // Pagination properties
  currentPage = 1;
  hasNextPage = true;
  totalPages = 1;

  // Filtro properties
  filterNombre: string = '';
  filterTipo: string = '';
  filterFecha: string = '';

  constructor(private service: EventoService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.loadPage(this.currentPage);
  }

  onFilterSubmit(): void {
    this.currentPage = 1;
    this.filterEventos(this.currentPage);
  }

  clearFilters(): void {
    this.filterNombre = '';
    this.filterTipo = '';
    this.filterFecha = '';
    this.currentPage = 1;
    this.loadPage(this.currentPage);
  }

  getFilterData(): any {
    const filterData: any = {};
    if (this.filterNombre) filterData.nombre = this.filterNombre;
    if (this.filterTipo) filterData.tipo = this.filterTipo;
    if (this.filterFecha) filterData.fecha = this.filterFecha;
    return filterData;
  }

  hasActiveFilters(): boolean {
    return !!(this.filterNombre || this.filterTipo || this.filterFecha);
  }

  filterEventos(page: number = 1): void {
    this.eventoList$ = this.service.filterEventos(this.getFilterData(), page).pipe(
      catchError((error: string) => {
        this.errorMessage = error;
        return EMPTY;
      })
    );
    this.eventoList$.subscribe(response => {
      if (Array.isArray(response)) {
        // Si el backend devuelve un array plano, lo adaptamos al formato esperado por la tabla
        const filters = this.getFilterData();
        let filtered = response;
        if (filters.nombre) filtered = filtered.filter((e: any) => e.nombre?.toLowerCase().includes(filters.nombre.toLowerCase()));
        if (filters.tipo) filtered = filtered.filter((e: any) => e.tipo == filters.tipo);
        if (filters.fecha) filtered = filtered.filter((e: any) => {
          const filtroFecha = filters.fecha.split('T')[0];
          if (e.fecha_ini) {
            return e.fecha_ini.split('T')[0] === filtroFecha;
          } else if (e.fecha) {
            return e.fecha.split('T')[0] === filtroFecha;
          }
          return false;
        });
        this.hasNextPage = false;
        this.eventoList$ = new BehaviorSubject({ results: filtered }).asObservable();
      } else if (response && Array.isArray(response.results)) {
        // Si el backend ya devuelve {results: [...]}, lo dejamos tal cual
        this.hasNextPage = !!response?.next;
      this.totalPages = Math.ceil(response.count / 10); // 10 es el tamaño de página
      this.currentPage = page;
      } else {
        // Si el backend devuelve un objeto pero no tiene results, lo adaptamos
        this.eventoList$ = new BehaviorSubject({ results: [] }).asObservable();
        this.hasNextPage = false;
      }
    });
  }

  loadPage(page: number): void {
    if (this.hasActiveFilters()) {
      this.filterEventos(page);
      return;
    }
    this.eventoList$ = this.service.getEventoListPaginated(page).pipe(
      catchError((error: string) => {
        this.errorMessage = error;
        return EMPTY;
      })
    );
    this.eventoList$.subscribe(response => {
      this.hasNextPage = !!response?.next;
    });
  }

  getEvento(id_evento: number): void {
      if (id_evento) {
        this.errorMessage = "";
        this.service.fetchAndStoreEvento(id_evento);
        console.log('Enviando socio:', id_evento);
      } else {
        this.errorMessage = "No se ha encontrado el socio";
      }
  }

  addEvento() {
    this.service.clear();
    this.router.navigate(['/eventoForm']);
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

  deleteEvento(id_evento: number) {
  const confirmar = confirm(
    `¿Estás seguro de que quieres eliminar el evento?`
  );
  if(confirmar){
    this.service.deleteEvento(id_evento).subscribe(
      () => {
        console.log('Socio eliminado');
        this.loadPage(this.currentPage);
      },
      (error) => {
        console.error('Error al eliminar el socio:', error);
        this.errorMessage = "Error al eliminar el socio";
      }
    );
  }
  }
}
