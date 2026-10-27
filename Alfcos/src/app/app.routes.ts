import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SocioListComponent } from './pages/socio-list/socio-list.component';
import { AppComponent } from './app.component';
import { UserListComponent } from './pages/user-list/user-list.component';
import { SocioFormComponent } from './pages/socio-list/socio-form/socio-form.component';
import { TallerListComponent } from './pages/taller-list/taller-list.component';
import { UserFormComponent } from './pages/user-list/user-form/user-form.component';
import { EventoListComponent } from './pages/evento-list/evento-list.component';
import { CuentasListComponent } from './pages/cuentas-list/cuentas-list.component';
import { EventoFormComponent } from './pages/evento-list/evento-form/evento-form.component';
import { CuentasFormComponent } from './pages/cuentas-list/cuentas-form/cuentas-form.component';
import { CuentasShowComponent } from './pages/cuentas-list/cuentas-show/cuentas-show.component';
import { TallerFormComponent } from './pages/taller-list/taller-form/taller-form.component';

export const routes: Routes = [{
    path: "", component: LoginComponent
    },{
    path: "socios", component: SocioListComponent
    },{
        path: "home", component: AppComponent
        },{
            path: "usuarios", component: UserListComponent
            },{
                path: "usuarioForm", component: UserFormComponent
                },{
                    path: "socioForm", component: SocioFormComponent
                    },{
                        path: "eventoForm", component: EventoFormComponent
                        },{
                            path: "tallerForm", component: TallerFormComponent
                            },{
                            path: "cuentaForm", component: CuentasFormComponent
                            },{
                                path: "cuentaShow", component: CuentasShowComponent
                                },{
                        path: "talleres", component: TallerListComponent
                        },{
                            path: "eventos", component: EventoListComponent
                            },{
                                path: "cuentas", component: CuentasListComponent
                                }];
