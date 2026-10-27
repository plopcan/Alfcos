import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocioListComponent } from './socio-list.component';

describe('SocioListComponent', () => {
  let component: SocioListComponent;
  let fixture: ComponentFixture<SocioListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocioListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SocioListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
