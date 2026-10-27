export interface Socio {
    n_socio: number
    dni: string
    nombre: string
    apellido: string
    email: string
    sexo_id: string
    periodo_pagado: string
    c_postal: string
    telefono: string
    foto: string
    direccion: string
    fecha_nacimiento: Date
    strickes: number
    periodos_pagados: string[] // Lista de periodos pagados
}
