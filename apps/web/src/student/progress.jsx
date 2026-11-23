import React from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, GraduationCap, Layers3 } from '../icons';
import { api } from '../api';
import { PageTitle, QueryState, HoursProgress, InlineNotice } from '../components';
import { groupNames } from './shared';

export function Progress() { const q = useQuery({ queryKey: ['progresso'], queryFn: () => api('/aluno/progresso') }); return <><PageTitle eyebrow="GRADUAÇÃO / INTEGRALIZAÇÃO" title="Progresso acadêmico" description="Veja o que já foi concluído, o que está em andamento e o que ainda falta para alcançar as cargas horárias exigidas." actions={<Link to="/aluno/planejamento" className="btn btn-primary"><Layers3 size={17}/> Simular meu semestre <ArrowRight size={16}/></Link>}/><QueryState loading={q.isLoading} error={q.error} retry={() => q.refetch()}>{q.data && <><div className="progress-hero"><div><span className="eyebrow">SEU CURSO</span><h2>{q.data.curso}</h2><p>Os resultados abaixo consideram apenas disciplinas aprovadas em semestres anteriores.</p></div><div className="progress-total"><strong>{Math.min(100, Math.round(Object.values(q.data.grupos).reduce((n,g)=>n+Math.min(g.integralizada,g.exigida),0)/Math.max(1,Object.values(q.data.grupos).reduce((n,g)=>n+g.exigida,0))*100))}%</strong><span>da carga horária exigida</span></div></div><div className="progress-grid">{Object.entries(groupNames).map(([key, name]) => <HoursProgress key={key} name={name} data={q.data.grupos[key]}/>)}</div><InlineNotice>Disciplinas em curso ainda não são carga horária integralizada. Somente aprovações no histórico contam como concluídas.</InlineNotice></>}</QueryState></>; }
