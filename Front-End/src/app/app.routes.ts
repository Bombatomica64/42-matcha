import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { VerifyEmail } from './pages/verify-email/verify-email';
import { Home } from './pages/home/home';

export const routes: Routes = [
{
	path: 'login',
	component: Login
},
{
	path: 'register',
	component: Register
},
{
  path: 'auth/verifyEmail',
  component: VerifyEmail
},
{
  path: 'home',
  component: Home
},
// {
//   path: 'user/:username',
//   component: UserProfile
// },
{
	path: '',
	redirectTo: '/login',
	pathMatch: 'full'
}
];
