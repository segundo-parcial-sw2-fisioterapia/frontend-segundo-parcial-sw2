export const enviroment = {
  production: false,

  // URL del API Gateway (Punto de Entrada Único)
  apiUrl: 'http://localhost:4000/api', // Endpoints REST
  graphqlUrl: 'http://localhost:4000/graphql', // Endpoint GraphQL Federado
  socketUrl: 'ws://localhost:4000', // WebSocket del gateway (eventos globales)
  socketUrlClinica: 'ws://localhost:3000', // WebSocket directo al MS Clínica (sesiones)
  biUrl: 'http://localhost:8000', // REST del Motor BI
};
