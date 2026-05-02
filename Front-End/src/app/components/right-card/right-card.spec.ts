import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightCard } from './right-card';

describe('RightCard', () => {
  let component: RightCard;
  let fixture: ComponentFixture<RightCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RightCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RightCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
