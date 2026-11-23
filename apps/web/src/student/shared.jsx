import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, Plus, Trash2, TriangleAlert } from '../icons';
import { Badge, categoryName, Availability } from '../components';

const blockerText = b => b.code === 'PRE_REQUISITO_PENDENTE' ? `Pré-requisito pendente: ${(b.pendentes || []).join(', ')}` : b.message;

function PreReq({ items }) { if (!items?.length)
    return null; return <div className="prereqs"><strong>Pré-requisitos</strong><div>{items.map(r => <span key={r.id} className={'prereq ' + (r.cumprido ? 'prereq-ok' : 'prereq-pending')}>{r.cumprido ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>} {r.codigo} {r.cumprido ? '· concluído' : '· pendente'}</span>)}</div></div>; }

export function SectionCard({ item, onEnroll, onPlan, busy = false, planned = false, onRemove, alreadyPlanned = false }) {
    const { disciplina, professor, vagasDisponiveis, vagasTotais, classificacao, preRequisitos, impedimentos } = item;
    const cantPlan = impedimentos?.some(b => ['DISCIPLINA_APROVADA', 'JA_MATRICULADO'].includes(b.code));
    return <article className="offer-card"><div className="offer-main"><div className="offer-content"><div className="offer-meta"><span className="course-code">{disciplina.codigo}</span><Badge kind={classificacao}>{categoryName(classificacao)}</Badge></div><h2>{disciplina.nome}</h2><p className="offer-description">{professor.nome} <span className="dot-separator">·</span> {disciplina.ch}h de carga horária</p><div className="offer-availability"><Availability remaining={vagasDisponiveis} total={vagasTotais}/></div><PreReq items={preRequisitos}/>{Boolean(impedimentos?.length) && <div className="blockers" role="note">{impedimentos.map(b => <p key={b.code}><TriangleAlert size={16}/>{blockerText(b)}</p>)}</div>}</div><div className="offer-actions">{planned ? <><button className="btn btn-primary" disabled={busy || !item.elegivel} onClick={() => onEnroll(item.turmaId)}>Matricular-se <ArrowRight size={16}/></button><button className="btn btn-ghost" disabled={busy} onClick={() => onRemove(item.id)}><Trash2 size={16}/> Remover do plano</button></> : <><button className="btn btn-primary" disabled={busy || !item.elegivel} onClick={() => onEnroll(item.id)}>Matricular-se <ArrowRight size={16}/></button><button className="btn btn-outline" disabled={busy || cantPlan || alreadyPlanned} onClick={() => onPlan(item.id)}>{alreadyPlanned ? <CheckCircle2 size={17}/> : <Plus size={17}/>} {alreadyPlanned ? 'No planejamento' : 'Adicionar ao plano'}</button></>}</div></div></article>;
}

export const groupNames = { obrigatorias: 'Obrigatórias', perfil: 'Eletivas de perfil', livres: 'Eletivas livres' };
