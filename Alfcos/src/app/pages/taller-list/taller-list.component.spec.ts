import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TallerListComponent } from './taller-list.component';

describe('TallerListComponent', () => {
  let component: TallerListComponent;
  let fixture: ComponentFixture<TallerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TallerListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TallerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
