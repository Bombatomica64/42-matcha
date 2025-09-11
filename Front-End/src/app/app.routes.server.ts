import { RenderMode, type ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
	{
		path: "login",
		renderMode: RenderMode.Server,
	},
	{
		path: "home/chat/:id",
		renderMode: RenderMode.Client, // dynamic chat route: client-render (no prerender of params)
	},
	{
		path: "register",
		renderMode: RenderMode.Server,
	},
	{
		path: "home",
		renderMode: RenderMode.Server,
	},
	{
		path: "home/profile",
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
