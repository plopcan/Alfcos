import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  loged: boolean = false;
  constructor() { }

  hasAttribute(name:string): boolean{
    if(sessionStorage == null){
      return false;
    }
    this.loged = (sessionStorage.getItem(name) !== null);
    return this.loged;
  }
}
