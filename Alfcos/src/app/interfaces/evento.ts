export interface Evento {
    id_evento: number;
    nombre: string;
    descripcion: string;
    fecha_ini: Date;
    fecha_fin: Date;
    num_grupos: number;
    mesas: number;
    cubiertos: number;
    usar_mesa: boolean;
    precio: number;
    tipo: string;
    tipo_id: string;
    plazasLibres: number;
    hora_ini: string | null;
    cubiertos_libres: number[];
}
