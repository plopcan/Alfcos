import { Cuentas } from './cuentas';

export interface Cuota extends Cuentas {
    n_socio: number; // ID del socio relacionado
    isCuota: boolean; // Unique property to identify Cuota
    periodo: string
}
