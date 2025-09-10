import { RenderMode, type ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
	{
		path: "login",
		renderMode: RenderMode.Server,
	},
	{
		path: "register",
		renderMode: RenderMode.Server,
	},
	{
		path: "auth/verifyEmail",
		renderMode: RenderMode.Server,
	},
	{
		path: "**",
		renderMode: RenderMode.Server,
	},
];
