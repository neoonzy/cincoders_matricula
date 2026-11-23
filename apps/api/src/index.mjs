import { createPool } from './db.mjs';
import { createApp } from './app.mjs';

// Entrada exclusiva do deploy na Vercel; o servidor local continua em server.mjs.
// Credenciais são configuradas como variáveis protegidas da plataforma.
export default createApp(createPool(), { logger: true });
