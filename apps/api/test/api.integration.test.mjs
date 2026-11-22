/**
 * Testes de integração: executam apenas em banco exclusivo, indicado por TEST_DATABASE_URL.
 * Nunca usa DATABASE_URL de desenvolvimento para limpar tabelas.
 */
import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createApp} from '../src/app.mjs';
import {seed} from '../scripts/seed.mjs';

const url=process.env.TEST_DATABASE_URL;
if(!url){test('Integração PostgreSQL exige TEST_DATABASE_URL separado', {skip:'Configure um banco de testes exclusivo no ambiente.'},()=>{});}
else {
  const pool=new pg.Pool({connectionString:url});
  const app=createApp(pool);
  before(async()=>{await pool.query(await readFile(new URL('../sql/001_init.sql',import.meta.url),'utf8'));await app.ready();});
  beforeEach(async()=>{
    await pool.query('TRUNCATE plan_items, prerequisites, history, enrollments, sections, professors, curricula, subjects, users, students, courses CASCADE');
    await seed(pool);
  });
  after(async()=>{await app.close();await pool.end();});
  async function auth(username){const result=await app.inject({method:'POST',url:'/api/auth/login',payload:{username,password:'Teste@2026'}});assert.equal(result.statusCode,200);return result.headers['set-cookie'].split(';')[0];}
  const json=(cookie,method,url,payload)=>app.inject({method,url,headers:{cookie},payload});
  test('RF-01/02 credenciais e autorização por perfil',async()=>{
    const wrong=await app.inject({method:'POST',url:'/api/auth/login',payload:{username:'ana.si',password:'inválida'}});assert.equal(wrong.statusCode,401);
    const ana=await auth('ana.si'),admin=await auth('secretaria');
    assert.equal((await json(ana,'GET','/api/turmas')).statusCode,403);
    assert.equal((await json(admin,'GET','/api/aluno/ofertas')).statusCode,403);
    assert.equal((await app.inject({method:'GET',url:'/api/aluno/ofertas'})).statusCode,401);
  });
  test('RN-01/02: disciplina duplicada e CH inválida',async()=>{
    const admin=await auth('secretaria');
    assert.equal((await json(admin,'POST','/api/disciplinas',{code:'IF101',name:'Duplicada',hours:60})).statusCode,409);
    assert.equal((await json(admin,'POST','/api/disciplinas',{code:'IF700',name:'Teste',hours:17})).statusCode,422);
    assert.equal((await json(admin,'POST','/api/disciplinas',{code:'IF700',name:'Teste',hours:30})).statusCode,201);
  });
  test('RN-10/11/12/13: o progresso de Ana computa excedente, não reprovação',async()=>{
    const ana=await auth('ana.si');const r=await json(ana,'GET','/api/aluno/progresso');assert.equal(r.statusCode,200);
    const groups=r.json().grupos;assert.equal(groups.obrigatorias.integralizada,60);assert.equal(groups.perfil.integralizada,60);assert.equal(groups.livres.integralizada,60);assert.equal(groups.livres.faltante,30);assert.equal(groups.perfil.percentual,100);
  });
  test('RF-20: Ana bloqueada em IF106; Bruno permitido',async()=>{
    const ana=await auth('ana.si'),bruno=await auth('bruno.ec');
    const denied=await json(ana,'POST','/api/aluno/matriculas',{turmaId:'IF106-A'});
    assert.equal(denied.statusCode,409);assert.equal(denied.json().error.code,'PRE_REQUISITO_PENDENTE');assert.deepEqual(denied.json().error.details.pendentes,['IF102']);
    assert.equal((await json(bruno,'POST','/api/aluno/matriculas',{turmaId:'IF106-A'})).statusCode,201);
  });
  test('RN-06: duas solicitações concorrentes disputam uma vaga; só uma entra',async()=>{
    const carla=await auth('carla.ec'),ana=await auth('ana.si'),bruno=await auth('bruno.ec');
    assert.equal((await json(carla,'DELETE','/api/aluno/matriculas/demo-carla')).statusCode,204);
    const result=await Promise.all([json(ana,'POST','/api/aluno/matriculas',{turmaId:'IF105-B'}),json(bruno,'POST','/api/aluno/matriculas',{turmaId:'IF105-B'})]);
    assert.deepEqual(result.map(x=>x.statusCode).sort(),[201,409]);
    const occupied=await pool.query("SELECT COUNT(*)::int AS n FROM enrollments WHERE section_id='IF105-B' AND status='ATIVA'");assert.equal(occupied.rows[0].n,1);
  });
  test('RN-05 secretaria não pode reduzir abaixo de ocupação',async()=>{
    const admin=await auth('secretaria');const r=await json(admin,'PATCH','/api/turmas/IF105-B/vagas',{seats:0});assert.equal(r.statusCode,422);
    assert.equal((await json(admin,'PATCH','/api/turmas/IF105-B/vagas',{seats:1})).statusCode,200);
  });
  test('RN-08/09 cancelamento só pelo titular libera vaga',async()=>{
    const ana=await auth('ana.si'),carla=await auth('carla.ec');
    assert.equal((await json(ana,'DELETE','/api/aluno/matriculas/demo-carla')).statusCode,404);
    assert.equal((await json(carla,'DELETE','/api/aluno/matriculas/demo-carla')).statusCode,204);
    const t=await pool.query("SELECT COUNT(*)::int AS n FROM enrollments WHERE section_id='IF105-B' AND status='ATIVA'");assert.equal(t.rows[0].n,0);
    assert.equal((await json(carla,'DELETE','/api/aluno/matriculas/demo-carla')).statusCode,409);
  });
  test('RF-21 plano mantém progresso real e vagas sem mudanças',async()=>{
    const ana=await auth('ana.si');const beforeProgress=(await json(ana,'GET','/api/aluno/progresso')).json();
    const beforeSeats=(await pool.query("SELECT COUNT(*)::int AS n FROM enrollments WHERE status='ATIVA'")).rows[0].n;
    assert.equal((await json(ana,'POST','/api/aluno/plano/itens',{turmaId:'IF102-A'})).statusCode,201);
    assert.equal((await json(ana,'POST','/api/aluno/plano/itens',{turmaId:'IF105-A'})).statusCode,201);
    assert.equal((await json(ana,'POST','/api/aluno/plano/itens',{turmaId:'IF106-A'})).statusCode,201);
    const plan=(await json(ana,'GET','/api/aluno/plano')).json();
    assert.equal(plan.itens.length,3);assert.equal(plan.itens.find(x=>x.disciplina.codigo==='IF106').status,'IMPEDIDA');
    assert.equal(plan.simulacao.grupos.obrigatorias.projetada,120);assert.equal(plan.simulacao.grupos.livres.projetada,120);
    assert.equal((await pool.query("SELECT COUNT(*)::int AS n FROM enrollments WHERE status='ATIVA'")).rows[0].n,beforeSeats);
    assert.deepEqual((await json(ana,'GET','/api/aluno/progresso')).json().grupos,beforeProgress.grupos);
  });
  test('PLAN-03 impede adicionar segunda turma da mesma disciplina e plano de outro aluno',async()=>{
    const ana=await auth('ana.si'),bruno=await auth('bruno.ec');
    const created=await json(ana,'POST','/api/aluno/plano/itens',{turmaId:'IF102-A'});assert.equal(created.statusCode,201);
    assert.equal((await json(ana,'POST','/api/aluno/plano/itens',{turmaId:'IF102-B'})).json().error.code,'DISCIPLINA_JA_PLANEJADA');
    assert.equal((await json(bruno,'DELETE',`/api/aluno/plano/itens/${created.json().id}`)).statusCode,404);
    assert.equal((await json(bruno,'GET','/api/aluno/plano')).json().itens.length,0);
  });
  test('PLAN-10 matrícula efetivada elimina seleção; cancelamento restaura vaga',async()=>{
    const ana=await auth('ana.si');await json(ana,'POST','/api/aluno/plano/itens',{turmaId:'IF102-A'});
    assert.equal((await json(ana,'POST','/api/aluno/matriculas',{turmaId:'IF102-A'})).statusCode,201);
    assert.equal((await json(ana,'GET','/api/aluno/plano')).json().itens.length,0);
    const enrollment=(await json(ana,'GET','/api/aluno/matriculas')).json()[0];assert.equal(enrollment.disciplina.codigo,'IF102');
    assert.equal((await json(ana,'DELETE',`/api/aluno/matriculas/${enrollment.matriculaId}`)).statusCode,204);
  });
}
