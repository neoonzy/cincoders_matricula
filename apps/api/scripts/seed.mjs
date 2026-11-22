import {createPool,transaction} from '../src/db.mjs';
import {hashPassword} from '../src/security.mjs';
import {validatePrerequisiteGraph} from '@matricula/domain';
export async function seed(pool){
  await transaction(pool,async db=>{
    const courses=[['si','Sistemas de Informação',120,60,90],['ec','Engenharia da Computação',120,60,90]];
    for(const c of courses)await db.query('INSERT INTO courses(id,name,required_hours,profile_hours,free_hours) VALUES($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',c);
    const subjects=[['IF101','Algoritmos'],['IF102','Estruturas de Dados'],['IF103','Projeto de Software'],['IF104','Interfaces Digitais'],['IF105','Eletrônica Digital'],['IF106','Sistemas Embarcados']];
    for(const [id,name] of subjects)await db.query('INSERT INTO subjects(id,code,name,hours) VALUES($1,$2,$3,60) ON CONFLICT (id) DO NOTHING',[id,id,name]);
    const curricula=[['si','IF101','OBRIGATORIA'],['si','IF102','OBRIGATORIA'],['si','IF103','PERFIL'],['si','IF104','PERFIL'],['ec','IF101','PERFIL'],['ec','IF102','OBRIGATORIA'],['ec','IF105','OBRIGATORIA'],['ec','IF106','PERFIL']];
    for(const c of curricula)await db.query('INSERT INTO curricula(course_id,subject_id,kind) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',c);
    for(const s of [['ana','Ana Lima','si'],['bruno','Bruno Costa','ec'],['carla','Carla Souza','ec']])await db.query('INSERT INTO students(id,name,course_id) VALUES($1,$2,$3) ON CONFLICT (id) DO NOTHING',s);
    const users=[['secretaria','secretaria',null,'SECRETARIA'],['ana','ana.si','ana','ALUNO'],['bruno','bruno.ec','bruno','ALUNO'],['carla','carla.ec','carla','ALUNO']];
    for(const [id,username,studentId,role] of users)await db.query('INSERT INTO users(id,username,password_hash,role,student_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',[id,username,hashPassword('Teste@2026'),role,studentId]);
    for(const p of [['prof-1','Marina Albuquerque','marina@exemplo.edu.br'],['prof-2','Paulo Nascimento','paulo@exemplo.edu.br']])await db.query('INSERT INTO professors(id,name,email) VALUES($1,$2,$3) ON CONFLICT (id) DO NOTHING',p);
    const sections=[['IF102-A','IF102','prof-1',3],['IF102-B','IF102','prof-2',3],['IF105-A','IF105','prof-2',3],['IF105-B','IF105','prof-1',1],['IF106-A','IF106','prof-1',4],['IF103-A','IF103','prof-2',4],['IF104-A','IF104','prof-1',4],['IF101-A','IF101','prof-1',4]];
    for(const s of sections)await db.query('INSERT INTO sections(id,subject_id,professor_id,seats) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',s);
    const history=[['h1','ana','IF101','APROVADO'],['h2','ana','IF103','APROVADO'],['h3','ana','IF104','APROVADO'],['h4','ana','IF102','REPROVADO'],['h5','bruno','IF102','APROVADO'],['h6','bruno','IF101','APROVADO'],['h7','bruno','IF105','REPROVADO'],['h8','carla','IF102','APROVADO'],['h9','carla','IF101','REPROVADO']];
    for(const h of history)await db.query('INSERT INTO history(id,student_id,subject_id,status) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',h);
    const prereqs=[{subjectId:'IF106',requiredSubjectId:'IF102'}];
    const existing=(await db.query('SELECT subject_id AS "subjectId", required_subject_id AS "requiredSubjectId" FROM prerequisites')).rows;
    const merged=[...existing,...prereqs.filter(p=>!existing.some(x=>x.subjectId===p.subjectId&&x.requiredSubjectId===p.requiredSubjectId))];
    validatePrerequisiteGraph(merged);
    for(const p of prereqs)await db.query('INSERT INTO prerequisites(subject_id,required_subject_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[p.subjectId,p.requiredSubjectId]);
    await db.query("INSERT INTO enrollments(id,student_id,section_id,status) VALUES('demo-carla','carla','IF105-B','ATIVA') ON CONFLICT (id) DO NOTHING");
  });
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href){const pool=createPool();try{await seed(pool);console.log('Seed aplicado. Contas: secretaria / ana.si / bruno.ec / carla.ec | senha: Teste@2026');}finally{await pool.end();}}
