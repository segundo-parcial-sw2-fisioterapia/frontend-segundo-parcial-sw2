export const enviroment = {
  production: true,

  // Usamos rutas relativas para que Netlify haga el Proxy en secreto (HTTPS -> HTTP)
  apiUrl: '/api', 
  graphqlUrl: '/graphql', 
  biUrl: '/bi',

  // Los WebSockets no soportan proxy en Netlify, van directo a la IP de AWS
  socketUrl: 'ws://18.223.0.133:4000', 
  socketUrlClinica: 'ws://18.223.0.133:3000', 
};
