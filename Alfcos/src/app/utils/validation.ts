import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from "@angular/forms";

export class Validation { 
    static match(controlName: string, checkControlName: string): ValidatorFn {
    return (controls: AbstractControl) => {
      const control = controls.get(controlName);
      const checkControl = controls.get(checkControlName);

      if (checkControl?.errors && !checkControl.errors['matching']) {
        return null;
      }

      if (control?.value !== checkControl?.value) {
        controls.get(checkControlName)?.setErrors({ matching: true });
        return { matching: true };
      } else {
        return null;
      }
    };
  }

  static validateDocument(): ValidatorFn{
    return (formGroup:AbstractControl): ValidationErrors|null => {
        const dni = formGroup.get('dni')?.value
        const letters = ['T', 'R', 'W', 'A', 'G', 'M', 'Y', 'F', 'P', 'D', 'X', 'B', 'N', 'J', 'Z', 'S', 'Q', 'V', 'H', 'L', 'C', 'K', 'E'];

        const rexDni = /^[0-9]{8}[A-Z]$/i;
        const rexNie = /^[XYZ][0-9]{7}[A-Z]$/i;
        let codigo = dni;

        if(rexNie.test(dni)){
            let nie = dni.toUpperCase();
            nie = nie.replace('X', '0');
            nie = nie.replace('Y', '1');
            nie = nie.replace('Z', '2');
            codigo = nie
        }

          const numero = parseInt(codigo.substring(0, 8), 10);
          const letra = codigo.charAt(8).toUpperCase();
          const letraEsperada = letters[numero % 23];

        if((rexDni.test(dni) || rexNie.test(dni)) && letra === letraEsperada) {
          console.log('DNI válido');
            return null;
        }
        console.log('DNI inválido');
        return {DocValid: false};
    }
  }
}
