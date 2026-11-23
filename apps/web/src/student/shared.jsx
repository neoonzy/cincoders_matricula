import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Plus, Trash2, TriangleAlert, Info } from '../icons';
import { Link } from 'react-router';
import { Badge, categoryName, Availability, ConfirmDialog } from '../components';

const blockerText = b => b.code === 'PRE_REQUISITO_PENDENTE' ? `Pré-requisito pendente: ${(b.pendentes || []).join(', ')}` : b.message;

function PreReq({ items }) {
  if (!items?.length) return null;
  return <details className="requirement-details"><summary>Pré-requisitos ({items.length})</summary><div className="prereq-list">{items.map(r => <span key={r.id} className={'prereq ' + (r.cumprido ? 'prereq-ok' : 'prereq-pending')}>{r.cumprido ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>} {r.codigo} · {r.cumprido ? 'concluído' : 'pendente'}</span>)}</div></details>;
}

export function SectionCard({ item, onEnroll, onPlan, busy = false, planned = false, onRemove, alreadyPlanned = false }) {
  const { disciplina, professor, vagasDisponiveis, vagasTotais, classificacao, preRequisitos, impedimentos = [] } = item;
  const completed = impedimentos.some(b => b.code === 'DISCIPLINA_APROVADA');
  const enrolled = impedimentos.some(b => b.code === 'JA_MATRICULADO');
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  async function confirmEnrollment() {
    setPending(true); setError(null);
    try { await onEnroll(planned ? item.turmaId : item.id); setConfirm(false); }
    catch (e) { setError(e); }
    finally { setPending(false); }
  }
  const start = () => { setError(null); setConfirm(true); };
  return <article className="offer-card"><div className="offer-main">
    <div className="offer-content">
      <div className="offer-meta"><span className="course-code">{disciplina.codigo}</span><Badge kind={classificacao}>{categoryName(classificacao)}</Badge></div>
      <h2>{disciplina.nome}</h2>
      <p className="offer-description">{professor.nome} <span className="dot-separator">·</span> {disciplina.ch}h</p>
      <div className="offer-availability"><Availability remaining={vagasDisponiveis} total={vagasTotais}/></div>
      {impedimentos.length > 0 && <div className="offer-reasons">{impedimentos.map(b => <p key={b.code}>{completed || enrolled ? <Info size={15}/> : <TriangleAlert size={15}/>} {blockerText(b)}</p>)}</div>}
      <PreReq items={preRequisitos}/>
    </div>
    <div className="offer-actions">
      {(completed || enrolled) && !planned ? <div className="offer-finished"><CheckCircle2 size={19}/><span>{completed ? 'Disciplina concluída' : 'Matrícula ativa'}</span>{enrolled && <Link to="/aluno/matriculas">Ver matrícula</Link>}</div> : <>
        {item.elegivel ? <button className="btn btn-primary" disabled={busy} onClick={start}>Matricular-se <ArrowRight size={16}/></button> : <span className="offer-unavailable">Matrícula indisponível</span>}
        {planned ? <button className="btn btn-ghost" disabled={busy} onClick={() => onRemove(item.id)}><Trash2 size={16}/> Remover do plano</button> : <button className="btn btn-outline" disabled={busy || alreadyPlanned} onClick={() => onPlan(item.id)}>{alreadyPlanned ? <CheckCircle2 size={17}/> : <Plus size={17}/>} {alreadyPlanned ? 'No planejamento' : 'Adicionar ao plano'}</button>}
      </>}
    </div>
  </div>{confirm && <ConfirmDialog title="Confirmar matrícula" description="Confira a turma antes de efetivar sua matrícula." destructive={false} confirmLabel="Confirmar matrícula" busy={pending} error={error} onClose={() => setConfirm(false)} onConfirm={confirmEnrollment}>
    <dl className="review-list"><div><dt>Disciplina</dt><dd>{disciplina.codigo} · {disciplina.nome}</dd></div><div><dt>Professor</dt><dd>{professor.nome}</dd></div><div><dt>Carga horária</dt><dd>{disciplina.ch}h</dd></div><div><dt>Vagas na última consulta</dt><dd>{vagasDisponiveis} de {vagasTotais}</dd></div></dl>
    <p className="review-note">A disponibilidade será conferida novamente. Se a matrícula for confirmada, uma vaga será ocupada.</p>
  </ConfirmDialog>}</article>;
}

export const groupNames = { obrigatorias: 'Obrigatórias', perfil: 'Eletivas de perfil', livres: 'Eletivas livres' };
