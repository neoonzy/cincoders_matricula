import { createPool } from './db.mjs';
import { createApp } from './app.mjs';

// A Vercel detecta a API Fastify pelo listener HTTP do arquivo de entrada.
// Exportar apenas a instância não inicia o servidor neste adaptador.
const pool = createPool();
const app = createApp(pool, { logger: true });

app.listen({
    port: Number(process.env.PORT) || 3000,
    host: '0.0.0.0'
}).catch(async (error) => {
    app.log.error(error, 'Falha ao inicializar a API');
    await pool.end();
    process.exitCode = 1;
});
