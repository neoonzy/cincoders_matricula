import Fastify from 'fastify';
import { DomainError } from '@matricula/domain';
import { createSession, verifyPassword, readSession, readCookie, sessionCookie } from './security.mjs';
import { first } from './db.mjs';
import * as service from './services.mjs';
const err = (code, message, status = 403) => new DomainError(code, message, status);
const params = { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1 } }, additionalProperties: false };
const qPage = { type: 'object', properties: { q: { type: 'string', maxLength: 100 }, page: { type: 'integer', minimum: 1 }, limit: { type: 'integer', minimum: 1, maximum: 50 } }, additionalProperties: false };
const body = {
    login: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', minLength: 1, maxLength: 100 }, password: { type: 'string', minLength: 1, maxLength: 200 } }, additionalProperties: false },
    subject: { type: 'object', required: ['code', 'name', 'hours'], properties: { code: { type: 'string' }, name: { type: 'string' }, hours: { type: 'integer' } }, additionalProperties: false },
    patchSubject: { type: 'object', minProperties: 1, properties: { code: { type: 'string' }, name: { type: 'string' }, hours: { type: 'integer' } }, additionalProperties: false },
    professor: { type: 'object', required: ['name', 'email'], properties: { name: { type: 'string' }, email: { type: 'string' } }, additionalProperties: false },
    section: { type: 'object', required: ['subjectId', 'professorId', 'seats'], properties: { subjectId: { type: 'string' }, professorId: { type: 'string' }, seats: { type: 'integer' } }, additionalProperties: false },
    seats: { type: 'object', required: ['seats'], properties: { seats: { type: 'integer' } }, additionalProperties: false },
    select: { type: 'object', required: ['turmaId'], properties: { turmaId: { type: 'string', minLength: 1 } }, additionalProperties: false }
};
const limitLogins = new Map();
export function createApp(pool, { logger = false } = {}) {
    const app = Fastify({ logger, bodyLimit: 100000, trustProxy: false });
    app.decorate('pool', pool);
    app.addHook('onRequest', async (req, reply) => {
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('Referrer-Policy', 'same-origin');
        reply.header('X-Frame-Options', 'DENY');
        reply.header('Cache-Control', 'no-store');
        // Proteção de origem para sessões de navegador; Vite proxy é explícito no ambiente de desenvolvimento.
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
            const host = req.headers.host;
            const valid = new Set([`http://${host}`, `https://${host}`, ...(process.env.NODE_ENV === 'production' ? [] : ['http://127.0.0.1:5173', 'http://localhost:5173'])]);
            if (process.env.APP_ORIGIN)
                valid.add(process.env.APP_ORIGIN);
            if (!valid.has(req.headers.origin))
                throw err('ORIGEM_INVALIDA', 'Origem não autorizada.', 403);
        }
    });
    app.addHook('preHandler', async (req) => {
        const path = req.url.split('?')[0];
        if (path === '/api/health' || path === '/api/auth/login')
            return;
        const payload = readSession(readCookie(req.headers.cookie, 'matricula_session'));
        if (!payload)
            throw err('NAO_AUTENTICADO', 'Sua sessão expirou. Faça login novamente.', 401);
        const user = await first(pool, 'SELECT id,username,role,student_id FROM users WHERE id=$1', [payload.sub]);
        if (!user)
            throw err('NAO_AUTENTICADO', 'Sessão inválida.', 401);
        req.user = user;
        if ((path.startsWith('/api/aluno/') && user.role !== 'ALUNO') ||
            ((path.startsWith('/api/disciplinas') || path.startsWith('/api/professores') || path.startsWith('/api/turmas') || path.startsWith('/api/secretaria/')) && user.role !== 'SECRETARIA'))
            throw err('ACESSO_NEGADO', 'Você não tem permissão para essa operação.', 403);
    });
    app.setErrorHandler((error, req, reply) => {
        if (error instanceof DomainError)
            return reply.code(error.status).send({ error: { code: error.code, message: error.message, details: error.details } });
        if (error.validation)
            return reply.code(400).send({ error: { code: 'ENTRADA_INVALIDA', message: 'Verifique os dados informados.', details: { campos: error.validation.map(x => x.instancePath || x.params?.missingProperty || 'formulário') } } });
        if (error.code === '23505')
            return reply.code(409).send({ error: { code: 'REGISTRO_DUPLICADO', message: 'Já existe um registro com esses dados.', details: {} } });
        if (error.code === '23503')
            return reply.code(422).send({ error: { code: 'REFERENCIA_INVALIDA', message: 'Um registro relacionado não existe.', details: {} } });
        req.log.error(error);
        return reply.code(500).send({ error: { code: 'ERRO_INTERNO', message: 'Não foi possível concluir a solicitação. Tente novamente.', details: {} } });
    });
    app.get('/api/health', async () => { await pool.query('SELECT 1'); return { status: 'ok' }; });
    app.post('/api/auth/login', { schema: { body: body.login } }, async (req, reply) => {
        const username = req.body.username.trim().toLowerCase(), key = `${req.ip}:${username}`, now = Date.now();
        let attempt = limitLogins.get(key);
        if (attempt && now - attempt.start > 15 * 60000) {
            limitLogins.delete(key);
            attempt = null;
        }
        if (attempt?.failures >= 5)
            throw err('MUITAS_TENTATIVAS', 'Muitas tentativas. Tente novamente mais tarde.', 429);
        const user = await first(pool, 'SELECT id,username,role,student_id,password_hash FROM users WHERE username=$1', [username]);
        if (!user || !verifyPassword(req.body.password, user.password_hash)) {
            limitLogins.set(key, { start: attempt?.start ?? now, failures: (attempt?.failures ?? 0) + 1 });
            throw err('CREDENCIAIS_INVALIDAS', 'Usuário ou senha incorretos.', 401);
        }
        limitLogins.delete(key);
        reply.header('Set-Cookie', sessionCookie(createSession(user)));
        return { id: user.id, username: user.username, perfil: user.role };
    });
    app.get('/api/auth/me', async (req) => {
        const name = req.user.student_id ? await first(pool, 'SELECT name FROM students WHERE id=$1', [req.user.student_id]) : null;
        return { id: req.user.id, username: req.user.username, perfil: req.user.role, alunoId: req.user.student_id, nome: name?.name ?? 'Secretaria de Graduação' };
    });
    app.post('/api/auth/logout', async (req, reply) => { reply.header('Set-Cookie', sessionCookie('', true)).code(204).send(); });
    app.get('/api/disciplinas', { schema: { querystring: qPage } }, req => service.getSubjects(pool, req.query));
    app.post('/api/disciplinas', { schema: { body: body.subject } }, async (req, reply) => reply.code(201).send(await service.createSubject(pool, req.body)));
    app.patch('/api/disciplinas/:id', { schema: { params, body: body.patchSubject } }, req => service.updateSubject(pool, req.params.id, req.body));
    app.get('/api/professores', () => service.getProfessors(pool));
    app.post('/api/professores', { schema: { body: body.professor } }, async (req, reply) => reply.code(201).send(await service.createProfessor(pool, req.body)));
    app.get('/api/turmas', () => service.getSections(pool));
    app.post('/api/turmas', { schema: { body: body.section } }, async (req, reply) => reply.code(201).send(await service.createSection(pool, req.body)));
    app.patch('/api/turmas/:id/vagas', { schema: { params, body: body.seats } }, req => service.updateSectionSeats(pool, req.params.id, req.body.seats));
    app.get('/api/secretaria/referencias', () => service.getReferences(pool));
    app.get('/api/aluno/ofertas', { schema: { querystring: qPage } }, req => service.getOffers(pool, req.user.student_id, req.query));
    app.get('/api/aluno/matriculas', req => service.listActiveEnrollments(pool, req.user.student_id));
    app.post('/api/aluno/matriculas', { schema: { body: body.select } }, async (req, reply) => reply.code(201).send(await service.enroll(pool, req.user.student_id, req.body.turmaId)));
    app.delete('/api/aluno/matriculas/:id', { schema: { params } }, async (req, reply) => { await service.cancelEnrollment(pool, req.user.student_id, req.params.id); return reply.code(204).send(); });
    app.get('/api/aluno/progresso', req => service.getProgress(pool, req.user.student_id));
    app.get('/api/aluno/plano', req => service.getPlan(pool, req.user.student_id));
    app.post('/api/aluno/plano/itens', { schema: { body: body.select } }, async (req, reply) => reply.code(201).send(await service.addPlanItem(pool, req.user.student_id, req.body.turmaId)));
    app.delete('/api/aluno/plano/itens/:id', { schema: { params } }, async (req, reply) => { await service.removePlanItem(pool, req.user.student_id, req.params.id); reply.code(204).send(); });
    app.delete('/api/aluno/plano', async (req, reply) => { await service.clearPlan(pool, req.user.student_id); reply.code(204).send(); });
    return app;
}
