export const environment = {
  production: true,
  apiUrl: "https://api.matcha.bombatomica64.dev",
  socketUrl: "https://api.matcha.bombatomica64.dev", // Socket.IO will use /socket.io path
  // SSR server-side URLs (internal Docker network)
  serverApiUrl: "http://backend:3000",
  serverSocketUrl: "http://backend:3000", // Internal backend URL for SSR
};
