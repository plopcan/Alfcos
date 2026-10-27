import { Cuentas } from './cuentas';

export interface CuentaEvento extends Cuentas {
    eventoId: number; // ID del evento relacionado
    isCuentaEvento: boolean; // Unique property to identify CuentaEvento
    subtipo: string; 
}