import { randomUUID } from 'node:crypto';
import { calculateProgress, classify, eligibility, DomainError, validateSeats, validateSubject, validateProfessor } from '@matricula/domain';
import { first, transaction } from './db.mjs';
import { clampPage } from './pagination.mjs';
const E = (code, msg, status = 409, details = {}) => new DomainError(code, msg, status, details);
const requirements = course => ({ obrigatorias: course.required_hours, perfil: course.profile_hours, livres: course.free_hours });
const paged = (page, limit, total, items) => ({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
const bounded = (page = 1, limit = 10) => ({ page: Math.max(1, Number(page) || 1), limit: Math.min(50, Math.max(1, Number(limit) || 10)) });
const mapSection = row => ({ id: row.id, disciplina: { id: row.subject_id, codigo: row.code, nome: row.subject_name, ch: row.hours }, professor: { id: row.professor_id, nome: row.professor_name }, vagasTotais: row.seats, vagasOcupadas: row.occupied, vagasDisponiveis: row.seats - row.occupied });
const SECTION_SQL = `SELECT s.id,s.subject_id,s.professor_id,s.seats,sub.code,sub.name AS subject_name,sub.hours,p.name AS professor_name,
 (SELECT COUNT(*)::int FROM enrollments e WHERE e.section_id=s.id AND e.status='ATIVA') AS occupied
 FROM sections s JOIN subjects sub ON sub.id=s.subject_id JOIN professors p ON p.id=s.professor_id`;
async function studentState(db, studentId) {
    const student = await first(db, `SELECT a.id,a.name,a.course_id,c.name AS course_name,c.required_hours,c.profile_hours,c.free_hours FROM students a JOIN courses c ON c.id=a.course_id WHERE a.id=$1`, [studentId]);
    if (!student)
        throw E('ALUNO_NAO_ENCONTRADO', 'Aluno não encontrado.', 404);
    const curriculum = (await db.query('SELECT subject_id AS "subjectId",kind FROM curricula WHERE course_id=$1', [student.course_id])).rows;
    const approved = (await db.query(`SELECT DISTINCT ON (h.subject_id) sub.id,sub.code,sub.name,sub.hours FROM history h JOIN subjects sub ON sub.id=h.subject_id WHERE h.student_id=$1 AND h.status='APROVADO' ORDER BY h.subject_id`, [studentId])).rows;
    const active = (await db.query(`SELECT e.id AS enrollment_id,e.section_id,sub.id,sub.code,sub.name,sub.hours FROM enrollments e JOIN sections sec ON sec.id=e.section_id JOIN subjects sub ON sub.id=sec.subject_id WHERE e.student_id=$1 AND e.status='ATIVA'`, [studentId])).rows;
    return { student, curriculum, approved, active };
}
function mapped(sub, state) { return { id: sub.id, hours: sub.hours, kind: classify(sub.id, state.curriculum) }; }
async function prerequisites(db) {
    const rows = (await db.query(`SELECT pr.subject_id,req.id AS required_id,req.code AS required_code,req.name AS required_name FROM prerequisites pr JOIN subjects req ON req.id=pr.required_subject_id ORDER BY req.code`)).rows;
    const bySubject = new Map();
    for (const r of rows) {
        const arr = bySubject.get(r.subject_id) ?? [];
        arr.push({ id: r.required_id, codigo: r.required_code, nome: r.required_name });
        bySubject.set(r.subject_id, arr);
    }
    return bySubject;
}
function decorateSection(row, state, prereqMap) {
    const item = mapSection(row), required = prereqMap.get(row.subject_id) ?? [];
    const approvedIds = state.approved.map(x => x.id);
    const result = eligibility({ subjectId: row.subject_id, approvedIds, activeIds: state.active.map(x => x.id), prerequisites: required.map(x => x.id), seats: row.seats, occupied: row.occupied });
    const reqById = new Map(required.map(x => [x.id, x.codigo]));
    return { ...item, classificacao: classify(row.subject_id, state.curriculum),
        preRequisitos: required.map(x => ({ ...x, cumprido: approvedIds.includes(x.id) })),
        elegivel: result.eligible, impedimentos: result.blocks.map(x => ({ ...x, pendentes: x.pendentes?.map(id => reqById.get(id)) })) };
}
export async function getSubjects(db, { q = '', page = 1, limit = 10 } = {}) {
    ({ page, limit } = bounded(page, limit));
    const pattern = `%${q.trim()}%`;
    const total = (await first(db, 'SELECT COUNT(*)::int AS count FROM subjects WHERE code ILIKE $1 OR name ILIKE $1', [pattern])).count;
    page = clampPage(page, limit, total);
    const rows = (await db.query('SELECT id,code AS codigo,name AS nome,hours AS ch FROM subjects WHERE code ILIKE $1 OR name ILIKE $1 ORDER BY code,id LIMIT $2 OFFSET $3', [pattern, limit, (page - 1) * limit])).rows;
    return paged(page, limit, total, rows);
}
export async function createSubject(db, body) { const d = validateSubject(body); try {
    return (await first(db, 'INSERT INTO subjects(id,code,name,hours) VALUES($1,$2,$3,$4) RETURNING id,code AS codigo,name AS nome,hours AS ch', [randomUUID(), d.code, d.name, d.hours]));
}
catch (e) {
    if (e.code === '23505')
        throw E('CODIGO_DUPLICADO', 'Já existe disciplina com esse código.');
    throw e;
} }
export async function updateSubject(db, id, body) {
    const old = await first(db, 'SELECT code,name,hours FROM subjects WHERE id=$1', [id]);
    if (!old)
        throw E('NAO_ENCONTRADO', 'Disciplina não encontrada.', 404);
    const d = validateSubject({ code: body.code ?? old.code, name: body.name ?? old.name, hours: body.hours ?? old.hours });
    try {
        return await first(db, 'UPDATE subjects SET code=$2,name=$3,hours=$4 WHERE id=$1 RETURNING id,code AS codigo,name AS nome,hours AS ch', [id, d.code, d.name, d.hours]);
    }
    catch (e) {
        if (e.code === '23505')
            throw E('CODIGO_DUPLICADO', 'Já existe disciplina com esse código.');
        throw e;
    }
}
export async function getProfessors(db) { return (await db.query('SELECT id,name AS nome,email FROM professors ORDER BY name,id')).rows; }
export async function createProfessor(db, body) { const d = validateProfessor(body); try {
    return await first(db, 'INSERT INTO professors(id,name,email) VALUES($1,$2,$3) RETURNING id,name AS nome,email', [randomUUID(), d.name, d.email]);
}
catch (e) {
    if (e.code === '23505')
        throw E('EMAIL_DUPLICADO', 'Este e-mail já está cadastrado.');
    throw e;
} }
export async function getSections(db) { return (await db.query(`${SECTION_SQL} ORDER BY sub.code,s.id`)).rows.map(mapSection); }
export async function createSection(db, body) {
    validateSeats(body.seats);
    if (!body.subjectId || !body.professorId)
        throw E('DADOS_INVALIDOS', 'Selecione disciplina e professor.', 422);
    try {
        const row = await first(db, `INSERT INTO sections(id,subject_id,professor_id,seats) VALUES($1,$2,$3,$4) RETURNING id`, [randomUUID(), body.subjectId, body.professorId, body.seats]);
        return row;
    }
    catch (e) {
        if (e.code === '23503')
            throw E('REFERENCIA_INVALIDA', 'Disciplina ou professor não encontrado.', 422);
        throw e;
    }
}
export async function updateSectionSeats(pool, id, seats) {
    return transaction(pool, async (db) => {
        const row = await first(db, 'SELECT * FROM sections WHERE id=$1 FOR UPDATE', [id]);
        if (!row)
            throw E('NAO_ENCONTRADO', 'Turma não encontrada.', 404);
        const occupied = (await first(db, "SELECT COUNT(*)::int AS n FROM enrollments WHERE section_id=$1 AND status='ATIVA'", [id])).n;
        validateSeats(seats, occupied);
        await db.query('UPDATE sections SET seats=$2 WHERE id=$1', [id, seats]);
        return { id, vagasTotais: seats, vagasOcupadas: occupied };
    });
}
export async function getReferences(db) { const [subjects, professors] = await Promise.all([db.query('SELECT id,code AS codigo,name AS nome,hours AS ch FROM subjects ORDER BY code'), db.query('SELECT id,name AS nome FROM professors ORDER BY name')]); return { disciplinas: subjects.rows, professores: professors.rows }; }
export async function getOffers(db, studentId, { q = '', page = 1, limit = 10 } = {}) {
    ({ page, limit } = bounded(page, limit));
    const pattern = `%${q.trim()}%`;
    const total = (await first(db, `SELECT COUNT(*)::int AS count FROM sections s JOIN subjects sub ON sub.id=s.subject_id WHERE sub.code ILIKE $1 OR sub.name ILIKE $1`, [pattern])).count;
    page = clampPage(page, limit, total);
    const rows = (await db.query(`${SECTION_SQL} WHERE sub.code ILIKE $1 OR sub.name ILIKE $1 ORDER BY sub.code,s.id LIMIT $2 OFFSET $3`, [pattern, limit, (page - 1) * limit])).rows;
    const [state, reqs] = await Promise.all([studentState(db, studentId), prerequisites(db)]);
    return paged(page, limit, total, rows.map(row => decorateSection(row, state, reqs)));
}
export async function listActiveEnrollments(db, studentId) {
    const rows = (await db.query(`SELECT e.id AS enrollment_id,e.created_at,sec.id AS section_id,sub.id AS subject_id,sub.code,sub.name AS subject_name,sub.hours,p.name AS professor_name,sec.seats,
 (SELECT COUNT(*)::int FROM enrollments a WHERE a.section_id=sec.id AND a.status='ATIVA') AS occupied
 FROM enrollments e JOIN sections sec ON sec.id=e.section_id JOIN subjects sub ON sub.id=sec.subject_id JOIN professors p ON p.id=sec.professor_id
 WHERE e.student_id=$1 AND e.status='ATIVA' ORDER BY sub.code`, [studentId])).rows;
    return rows.map(r => ({ ...mapSection({ ...r, id: r.section_id, professor_id: null }), matriculaId: r.enrollment_id, criadaEm: r.created_at }));
}
export async function getProgress(db, studentId) { const state = await studentState(db, studentId); const progress = calculateProgress({ requirements: requirements(state.student), approved: state.approved.map(s => mapped(s, state)), active: state.active.map(s => mapped(s, state)) }); return { aluno: state.student.name, curso: state.student.course_name, ...progress }; }
export async function enroll(pool, studentId, sectionId) {
    return transaction(pool, async (db) => {
        // Ordem única de locks: aluno -> turma. Impede duplicidade por disciplina e vagas excedidas.
        const lockedStudent = await first(db, 'SELECT id FROM students WHERE id=$1 FOR UPDATE', [studentId]);
        if (!lockedStudent)
            throw E('ALUNO_NAO_ENCONTRADO', 'Aluno não encontrado.', 404);
        const lockedSection = await first(db, 'SELECT id FROM sections WHERE id=$1 FOR UPDATE', [sectionId]);
        if (!lockedSection)
            throw E('NAO_ENCONTRADO', 'Turma não encontrada.', 404);
        // Contagem em OUTRA instrução após adquirir lock: snapshot atualizado sob READ COMMITTED.
        const section = await first(db, `${SECTION_SQL} WHERE s.id=$1`, [sectionId]);
        const state = await studentState(db, studentId), reqs = await prerequisites(db);
        const offer = decorateSection(section, state, reqs);
        if (!offer.elegivel) {
            const firstBlock = offer.impedimentos[0];
            throw E(firstBlock.code, firstBlock.code === 'PRE_REQUISITO_PENDENTE' ? 'Você precisa concluir os pré-requisitos antes da matrícula.' : firstBlock.message, 409, firstBlock.pendentes ? { pendentes: firstBlock.pendentes } : {});
        }
        const previous = await first(db, 'SELECT id FROM enrollments WHERE student_id=$1 AND section_id=$2', [studentId, sectionId]);
        const id = previous?.id ?? randomUUID();
        if (previous)
            await db.query("UPDATE enrollments SET status='ATIVA',created_at=now(),canceled_at=NULL WHERE id=$1", [id]);
        else
            await db.query("INSERT INTO enrollments(id,student_id,section_id,status) VALUES($1,$2,$3,'ATIVA')", [id, studentId, sectionId]);
        await db.query('DELETE FROM plan_items WHERE student_id=$1 AND section_id IN (SELECT id FROM sections WHERE subject_id=$2)', [studentId, section.subject_id]);
        return { id, turmaId: sectionId, disciplina: offer.disciplina };
    });
}
export async function cancelEnrollment(pool, studentId, enrollmentId) {
    return transaction(pool, async (db) => {
        await first(db, 'SELECT id FROM students WHERE id=$1 FOR UPDATE', [studentId]);
        const item = await first(db, 'SELECT e.id,e.section_id,e.status FROM enrollments e WHERE e.id=$1 AND e.student_id=$2', [enrollmentId, studentId]);
        if (!item)
            throw E('NAO_ENCONTRADO', 'Matrícula não encontrada.', 404);
        await first(db, 'SELECT id FROM sections WHERE id=$1 FOR UPDATE', [item.section_id]);
        if (item.status !== 'ATIVA')
            throw E('MATRICULA_INATIVA', 'Esta matrícula já foi cancelada.');
        await db.query("UPDATE enrollments SET status='CANCELADA',canceled_at=now() WHERE id=$1", [enrollmentId]);
    });
}
export async function addPlanItem(pool, studentId, sectionId) {
    return transaction(pool, async (db) => {
        await first(db, 'SELECT id FROM students WHERE id=$1 FOR UPDATE', [studentId]);
        const section = await first(db, 'SELECT s.id,s.subject_id,sub.code FROM sections s JOIN subjects sub ON sub.id=s.subject_id WHERE s.id=$1', [sectionId]);
        if (!section)
            throw E('NAO_ENCONTRADO', 'Turma não encontrada.', 404);
        const approved = await first(db, "SELECT 1 FROM history WHERE student_id=$1 AND subject_id=$2 AND status='APROVADO' LIMIT 1", [studentId, section.subject_id]);
        if (approved)
            throw E('DISCIPLINA_APROVADA', 'Você já foi aprovado nesta disciplina.');
        const enrolled = await first(db, "SELECT 1 FROM enrollments e JOIN sections s ON s.id=e.section_id WHERE e.student_id=$1 AND s.subject_id=$2 AND e.status='ATIVA' LIMIT 1", [studentId, section.subject_id]);
        if (enrolled)
            throw E('JA_MATRICULADO', 'Você já está matriculado nesta disciplina.');
        const planned = await first(db, 'SELECT 1 FROM plan_items p JOIN sections s ON s.id=p.section_id WHERE p.student_id=$1 AND s.subject_id=$2 LIMIT 1', [studentId, section.subject_id]);
        if (planned)
            throw E('DISCIPLINA_JA_PLANEJADA', 'Esta disciplina já está no seu planejamento.');
        const row = await first(db, 'INSERT INTO plan_items(id,student_id,section_id) VALUES($1,$2,$3) RETURNING id,section_id AS "turmaId"', [randomUUID(), studentId, sectionId]);
        return row;
    });
}
export async function removePlanItem(db, studentId, itemId) { const result = await db.query('DELETE FROM plan_items WHERE id=$1 AND student_id=$2', [itemId, studentId]); if (!result.rowCount)
    throw E('NAO_ENCONTRADO', 'Item do planejamento não encontrado.', 404); }
export async function clearPlan(db, studentId) { await db.query('DELETE FROM plan_items WHERE student_id=$1', [studentId]); }
export async function getPlan(db, studentId) {
    const state = await studentState(db, studentId);
    const ids = (await db.query('SELECT p.id,p.section_id FROM plan_items p WHERE p.student_id=$1 ORDER BY p.created_at,p.id', [studentId])).rows;
    const rows = ids.length ? (await db.query(`${SECTION_SQL} WHERE s.id = ANY($1::text[])`, [ids.map(x => x.section_id)])).rows : [];
    const map = new Map(rows.map(r => [r.id, r])), reqs = await prerequisites(db);
    const items = ids.map(ref => ({ ...decorateSection(map.get(ref.section_id), state, reqs), id: ref.id, turmaId: ref.section_id })).map(x => ({ ...x, status: x.elegivel ? 'ELEGIVEL_AGORA' : 'IMPEDIDA' }));
    const approved = state.approved.map(s => mapped(s, state)), active = state.active.map(s => mapped(s, state));
    const planned = items.filter(x => x.elegivel).map(x => ({ id: x.disciplina.id, hours: x.disciplina.ch, kind: x.classificacao }));
    const sim = calculateProgress({ requirements: requirements(state.student), approved, active, planned });
    return { itens: items, simulacao: { ...sim, chSelecionadaTotal: items.reduce((n, x) => n + x.disciplina.ch, 0), chSelecionadaElegivel: items.filter(x => x.elegivel).reduce((n, x) => n + x.disciplina.ch, 0), chSelecionadaImpedida: items.filter(x => !x.elegivel).reduce((n, x) => n + x.disciplina.ch, 0) } };
}
