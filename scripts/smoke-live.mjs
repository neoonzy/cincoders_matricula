/**
 * Smoke test de leitura, sem alteração de dados.
 *
 * Executar com:
 *   SMOKE_BASE_URL=https://... SMOKE_USERNAME=ana.si SMOKE_PASSWORD=... \
 *     node scripts/smoke-live.mjs
 *
 * Credenciais nunca devem ser incluídas no repositório.
 */
import assert from 'node:assert/strict';

const origin = process.env.SMOKE_BASE_URL?.replace(/\/$/, '');
const username = process.env.SMOKE_USERNAME;
const password = process.env.SMOKE_PASSWORD;
if (!origin || !username || !password) {
  console.error('Configure SMOKE_BASE_URL, SMOKE_USERNAME e SMOKE_PASSWORD.');
  process.exit(2);
}

async function request(path, options = {}) {
  const started = performance.now();
  const response = await fetch(origin + path, {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(12000),
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  });
  const elapsed = Math.round(performance.now() - started);
  console.log(`${response.status} ${path} (${elapsed} ms)`);
  return response;
}

const index = await request('/');
assert.equal(index.status, 200, 'Frontend deve carregar');

const health = await request('/api/health');
assert.equal(health.status, 200, 'Saúde precisa responder rapidamente');
assert.equal((await health.json()).status, 'ok');

const unauthenticated = await request('/api/auth/me');
assert.equal(unauthenticated.status, 401, 'Sessão ausente deve responder 401');

const login = await request('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin },
  body: JSON.stringify({ username, password }),
});
assert.equal(login.status, 200, 'Credenciais fictícias devem autenticar');

const cookie = login.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie?.startsWith('matricula_session='), 'Cookie HTTP de sessão ausente');
const session = await request('/api/auth/me', { headers: { Cookie: cookie } });
assert.equal(session.status, 200);
assert.equal((await session.json()).username, username);

const offers = await request('/api/aluno/ofertas?page=1&limit=5', { headers: { Cookie: cookie } });
assert.equal(offers.status, 200);

console.log('PASS: frontend, banco, 401, login, sessão e ofertas.');
