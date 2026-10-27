export interface Cuentas {
    id_cuenta: number;
    descripcion: string;
    cantidad: number;
    fecha: string; // ISO 8601 date string
    tipo: string; // Assuming this is the ID of the related TipoCuenta
    anulada: boolean;
    isCuentas: boolean; // Unique property to identify Cuentas
}
