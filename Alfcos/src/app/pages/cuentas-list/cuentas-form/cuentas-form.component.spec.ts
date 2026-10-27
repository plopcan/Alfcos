import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasFormComponent } from './cuentas-form.component';

describe('CuentasFormComponent', () => {
  let component: CuentasFormComponent;
  let fixture: ComponentFixture<CuentasFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentasFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CuentasFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
