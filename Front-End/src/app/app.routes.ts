import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { VerifyEmail } from './pages/verify-email/verify-email';
import { Home } from './pages/home/home';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';
import path from 'path';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
{
	path: 'login',
	component: Login,
  canActivate: [guestGuard]
},
{
	path: 'register',
	component: Register,
  canActivate: [guestGuard]
},
{
  path: 'auth/verifyEmail',
  component: VerifyEmail
},
{
  path: 'home',
  component: Home,
  canActivate: [authGuard]
},
// {
//   path: 'user/:username',
//   component: UserProfile
// },
{
  path: 'home/profile',
  component: Profile,
  canActivate: [authGuard]
},
{
	path: '',
	redirectTo: '/login',
	pathMatch: 'full',
},
{
  path: '**',
  redirectTo: '/login',
}
];
