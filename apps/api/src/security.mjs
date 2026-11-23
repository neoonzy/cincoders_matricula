import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
const SESSION_SECONDS = 8 * 60 * 60;
export function hashPassword(password) { const salt = randomBytes(16).toString('hex'); const hash = scryptSync(password, salt, 64).toString('hex'); return `${salt}:${hash}`; }
export function verifyPassword(password, stored) {
    if (typeof password !== 'string' || typeof stored !== 'string' || !stored.includes(':'))
        return false;
    const [salt, hex] = stored.split(':');
    try {
        const expected = Buffer.from(hex, 'hex');
        const actual = scryptSync(password, salt, expected.length);
        return expected.length === actual.length && timingSafeEqual(expected, actual);
    }
    catch {
        return false;
    }
}
function secret() { const key = process.env.SESSION_SECRET; if (!key || key.length < 32)
    throw new Error('SESSION_SECRET deve ter pelo menos 32 caracteres.'); return key; }
export function createSession(user) {
    const body = Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
    const signature = createHmac('sha256', secret()).update(body).digest('base64url');
    return `${body}.${signature}`;
}
export function readSession(token) {
    if (!token || typeof token !== 'string')
        return null;
    const [body, sig, ...rest] = token.split('.');
    if (!body || !sig || rest.length)
        return null;
    const expected = createHmac('sha256', secret()).update(body).digest();
    try {
        const actual = Buffer.from(sig, 'base64url');
        if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
            return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000))
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
export function readCookie(cookieHeader, name) {
    return (cookieHeader ?? '').split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}
export function sessionCookie(value = '', expires = false) {
    const production = process.env.NODE_ENV === 'production';
    return `matricula_session=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expires ? 0 : SESSION_SECONDS}${production ? '; Secure' : ''}`;
}
