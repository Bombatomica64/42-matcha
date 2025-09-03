export const environment = {
	production: false,
	apiUrl: 'https://matcha.bombatomica64.dev/api',
	socketUrl: 'https://matcha.bombatomica64.dev', // Socket.IO will use /socket.io path
	// SSR server-side URLs (internal Docker network)
	serverApiUrl: 'http://backend:3000/api',
	serverSocketUrl: 'http://backend:3000' // Internal backend URL for SSR
};
