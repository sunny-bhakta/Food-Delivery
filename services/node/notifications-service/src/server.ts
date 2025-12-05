import Fastify from 'fastify'; 
import dotenv from 'dotenv'; 
 
dotenv.config(); 
 
const app = Fastify({ logger: true }); 
 
app.get('/health', async () => ({ 
  status: 'ok', 
  service: 'notifications-service', 
})); 
 
const start = async () => { 
  try { 
    const port = Number(process.env.PORT) || 4003; 
    await app.listen({ port, host: '0.0.0.0' }); 
    app.log.info(`Notifications service listening on ${port}`); 
  } catch (error) { 
    app.log.error(error); 
    process.exit(1); 
  } 
}; 
 
start();
