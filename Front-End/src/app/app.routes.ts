import type { Routes } from "@angular/router";
import { authGuard } from "./guards/auth-guard";
import { guestGuard } from "./guards/guest-guard";
import { Chat } from "./pages/chat/chat";
import { Home } from "./pages/home/home";
import { Landing } from "./pages/landing/landing";
import { Login } from "./pages/login/login";
import { Profile } from "./pages/profile/profile";
import { Register } from "./pages/register/register";
import { VerifyEmail } from "./pages/verify-email/verify-email";
import { chatMessagesResolver } from "./resolvers/chat-messages.resolver";

export const routes: Routes = [
	{
		path: "login",
		component: Login,
		canActivate: [guestGuard],
	},
	{
		path: "register",
		component: Register,
		canActivate: [guestGuard],
	},
	{
		path: "landing",
		component: Landing,
		canActivate: [guestGuard],
	},
	{
		path: "auth/verifyEmail",
		component: VerifyEmail,
	},
	{
		path: "home",
		component: Home,
		canActivate: [authGuard],
	},
	{
		path: "home/chat/:id",
		component: Chat,
		canActivate: [authGuard],
		resolve: { chatPrefetch: chatMessagesResolver },
	},
	{
		path: "home/profile",
		component: Profile,
		canActivate: [authGuard],
	},
	{
		path: "",
		redirectTo: "/login",
		pathMatch: "full",
	},
	{
		path: "**",
		redirectTo: "/login",
	},
];
