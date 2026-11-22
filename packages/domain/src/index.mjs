/** Regras curriculares puras. Sem HTTP, React ou banco de dados. */
export const KINDS = Object.freeze({OBRIGATORIA:'OBRIGATORIA', PERFIL:'PERFIL', LIVRE:'LIVRE'});
export class DomainError extends Error {
  constructor(code, message, status=409, details={}) {super(message);this.name='DomainError';this.code=code;this.status=status;this.details=details;}
}
export function classify(subjectId, curriculum) {
  return curriculum.find(row=>row.subjectId === subjectId)?.kind ?? KINDS.LIVRE;
}
export function validateSubject({code,name,hours}) {
  if (typeof code !== 'string' || !/^[A-Z0-9-]{2,16}$/.test(code.trim().toUpperCase())) throw new DomainError('CODIGO_INVALIDO','Informe um código válido (2–16 letras, números ou hífen).',422);
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) throw new DomainError('NOME_INVALIDO','O nome deve ter entre 2 e 120 caracteres.',422);
  if (!Number.isInteger(hours) || hours<15 || hours>120 || hours%15!==0) throw new DomainError('CH_INVALIDA','A carga horária deve ser múltipla de 15, entre 15h e 120h.',422);
  return {code:code.trim().toUpperCase(),name:name.trim(),hours};
}
export function validateProfessor({name,email}) {
  if (typeof name!=='string' || name.trim().length<2 || name.trim().length>120) throw new DomainError('NOME_INVALIDO','Informe o nome do professor.',422);
  const normalized=typeof email ==='string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length>240) throw new DomainError('EMAIL_INVALIDO','Informe um e-mail válido.',422);
  return {name:name.trim(),email:normalized};
}
export function validateSeats(seats, occupied=0) {
  if (!Number.isInteger(seats) || seats<1) throw new DomainError('VAGAS_INVALIDAS','Informe ao menos uma vaga.',422);
  if (seats<occupied) throw new DomainError('VAGAS_INSUFICIENTES',`Há ${occupied} matrícula(s) ativa(s). Não é possível reduzir para ${seats}.`,409,{occupied});
  return seats;
}
export function validatePrerequisiteGraph(edges) {
  const graph=new Map();
  for(const {subjectId,requiredSubjectId} of edges){
    if(subjectId===requiredSubjectId) throw new DomainError('PRE_REQUISITO_CICLICO','Uma disciplina não pode exigir a si mesma.',422);
    const list=graph.get(subjectId)??[];
    if(list.includes(requiredSubjectId)) throw new DomainError('PRE_REQUISITO_REPETIDO','Pré-requisito duplicado.',422);
    list.push(requiredSubjectId);graph.set(subjectId,list);
  }
  const visiting=new Set(), visited=new Set();
  function dfs(id){if(visiting.has(id)) throw new DomainError('PRE_REQUISITO_CICLICO','Há um ciclo entre pré-requisitos.',422);
    if(visited.has(id)) return;visiting.add(id);for(const next of graph.get(id)??[]) dfs(next);visiting.delete(id);visited.add(id);}
  for(const id of graph.keys())dfs(id);
  return true;
}
/** @param {{subjectId:string, approvedIds:string[], activeIds:string[], prerequisites:string[], occupied:number, seats:number}} p */
export function eligibility(p) {
  const blocks=[];
  if(p.approvedIds.includes(p.subjectId)) blocks.push({code:'DISCIPLINA_APROVADA',message:'Você já concluiu esta disciplina.'});
  if(p.activeIds.includes(p.subjectId)) blocks.push({code:'JA_MATRICULADO',message:'Você já está matriculado nesta disciplina.'});
  const pending=p.prerequisites.filter(id=>!p.approvedIds.includes(id));
  if(pending.length)blocks.push({code:'PRE_REQUISITO_PENDENTE',message:'Há pré-requisitos ainda não aprovados.',pendentes:pending});
  if(p.occupied>=p.seats)blocks.push({code:'TURMA_LOTADA',message:'Esta turma está sem vagas.'});
  return {eligible:blocks.length===0,blocks};
}
/**
 * Distribui CH na ordem APROVADA→ATIVA→PLANEJADA.
 * Excedente de perfil em qualquer etapa vai para livres da MESMA etapa.
 * @param {{requirements:{obrigatorias:number,perfil:number,livres:number},approved:Array<{id:string,hours:number,kind:string}>,active:Array<{id:string,hours:number,kind:string}>,planned?:Array<{id:string,hours:number,kind:string}>}} input
 */
export function calculateProgress(input) {
  const requirements=input.requirements;
  const names=['obrigatorias','perfil','livres'];
  const result=Object.fromEntries(names.map(name=>[name,{exigida:requirements[name]??0,integralizada:0,emCurso:0,planejadaElegivel:0}]));
  const sources=[['approved','integralizada'],['active','emCurso'],['planned','planejadaElegivel']];
  const used=new Set();
  for(const [source,target] of sources){
    for(const s of input[source]??[]){
      if(used.has(s.id))continue; used.add(s.id);
      if(!Number.isFinite(s.hours)||s.hours<0)throw new DomainError('CH_INVALIDA','Carga horária inválida no cálculo.',422);
      if(s.kind===KINDS.OBRIGATORIA)result.obrigatorias[target]+=s.hours;
      else if(s.kind===KINDS.PERFIL){
        const filled=result.perfil.integralizada+result.perfil.emCurso+result.perfil.planejadaElegivel;
        const allocation=Math.min(s.hours,Math.max(0,result.perfil.exigida-filled));
        result.perfil[target]+=allocation;
        result.livres[target]+=s.hours-allocation;
      }else result.livres[target]+=s.hours;
    }
  }
  for(const name of names){
    const row=result[name];
    row.faltante=Math.max(0,row.exigida-row.integralizada);
    row.percentual=row.exigida===0?100:Math.min(100,Math.round((row.integralizada/row.exigida)*100));
    row.projetada=row.integralizada+row.emCurso+row.planejadaElegivel;
    row.faltanteProjetada=Math.max(0,row.exigida-row.projetada);
    row.percentualProjetado=row.exigida===0?100:Math.min(100,Math.round((row.projetada/row.exigida)*100));
  }
  return {grupos:result,hipotese:'A projeção supõe aprovação futura nas matrículas ativas e nas turmas planejadas elegíveis.'};
}
