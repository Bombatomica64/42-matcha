import { Component, inject } from '@angular/core';
import { GetUserProfile } from '../../services/user/get-user-profile';
import { ProfileForm } from '../../components/forms/profile-form/profile-form';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { RatingModule } from 'primeng/rating';

import { adultValidator } from '../../components/forms/register-form/register-form';
import { SelectModule } from 'primeng/select';
import { components } from '../../../types/api';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../services/http-request';
import { Card } from "../../components/card/card";


type User = components['schemas']['User'];
// type SexualOrientation = User['sexual_orientation'];
// type Gender = User['gender'];
// type ProfileData = components['schemas']['User'];
// type ErrorResponse = components['schemas']['ErrorResponse'];

@Component({
  selector: 'app-profile',
  imports: [
    CardModule,
    ButtonModule,
    SelectModule,
    BadgeModule,
    OverlayBadgeModule,
    Card,
    ProfileForm,
    RatingModule,
    FormsModule
],
  template: `
    <div style="padding: 1rem;">
      <app-card [user]="profileService.profile()"/>
    </div>

    <div style="display: flex; flex-direction: column; padding: 1rem;">
      <p>{{ profileService.profile().name }}</p>
      <br />

      <app-profile-form />
    </div>
    
    <div style="padding: 1rem;">
      <p>Hashtags: {{ profileService.profile().hashtags }}</p>
      <p>Photos: {{ profileService.profile().photos }}</p>

      <!-- <p>Online Status: {{ profileService.profile()?.online_status }}</p> -->
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>Fame Rating:</span>
        <p-rating [ngModel]="profileService.profile().fame_rating" [readonly]="true" style="pointer-events: none;" />
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>Likes Received:</span>
        <p-button [rounded]="true" size="small" label="{{profileService.profile().likes_received}}" icon="pi pi-thumbs-up" severity="success" iconPos="right"/>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>Views:</span>
        <p-button [rounded]="true" size="small" label="{{profileService.profile().views}}" icon="pi pi-eye" severity="info" iconPos="right"/>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>Matches:</span>
        <p-button [rounded]="true" size="small" label="{{profileService.profile().matches}}" icon="pi pi-heart" severity="warn" iconPos="right"/>
      </div>

      <p-button label="Change Password" icon="pi pi-lock" severity="secondary"></p-button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: row;
      height: 100%;
      gap: 1rem;
    }
    :host > div:first-child {
      align-self: center; /* Centers the first child vertically */
      /* Other styles for the first div */
    }
    :host > div:last-child {
      /* Styles for the second div - it will stay at the top due to align-items: flex-start on the parent */
    }
  `,
})
export class Profile {
  profileService = inject(GetUserProfile);

  //hastag dopo
  //foto dopo
}

