import { TestBed } from '@angular/core/testing';

import { GetUserProfile } from './get-user-profile';

describe('GetUserProfile', () => {
  let service: GetUserProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetUserProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
