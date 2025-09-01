import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TinderCard } from './tinder-card';

describe('TinderCard', () => {
  let component: TinderCard;
  let fixture: ComponentFixture<TinderCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TinderCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TinderCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
