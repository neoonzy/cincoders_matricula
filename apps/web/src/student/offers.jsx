import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpenText, Layers3 } from '../icons';
import { api, invalidateStudent } from '../api';
import { PageTitle, QueryState, Pagination, SearchField, useNotify } from '../components';
import { SectionCard } from './shared';

function useSearchList() {
    const [params, setParams] = useSearchParams();
    const query = params.get('q') || '', page = Number.isInteger(Number(params.get('page') || 1)) && Number(params.get('page') || 1) > 0 ? Number(params.get('page') || 1) : 1, [search, setSearch] = useState(query);
    useEffect(() => setSearch(query), [query]);
    useEffect(() => { const timer = setTimeout(() => { if (search === query)
        return; const next = new URLSearchParams(); if (search.trim())
        next.set('q', search.trim()); setParams(next, { replace: true }); }, 320); return () => clearTimeout(timer); }, [search, query, setParams]);
    const goPage = n => { const next = new URLSearchParams(params); if (n <= 1)
        next.delete('page');
    else
        next.set('page', String(n)); setParams(next); };
    return { query, page, search, setSearch, goPage };
}

export function Offers() {
    const { query, page, search, setSearch, goPage } = useSearchList(), qc = useQueryClient(), notify = useNotify();
    const data = useQuery({ queryKey: ['ofertas', query, page], queryFn: ({ signal }) => api(`/aluno/ofertas?${new URLSearchParams({ q: query, page: String(page), limit: '8' })}`, { signal }) });
    const currentPlan = useQuery({ queryKey: ['plano'], queryFn: () => api('/aluno/plano') });
    const plannedSubjects = new Set(currentPlan.data?.itens.map(x => x.disciplina.id) ?? []);
    useEffect(() => { const actual = data.data?.pagination?.page; if (actual && actual !== page)
        goPage(actual); }, [data.data?.pagination?.page, page, goPage]);
    const enroll = useMutation({ mutationFn: turmaId => api('/aluno/matriculas', { method: 'POST', body: { turmaId } }), onSuccess: () => { notify('Matrícula realizada. A vaga já está registrada para você.'); invalidateStudent(qc); }, onError: e => { notify(e.message, 'error'); invalidateStudent(qc); } });
    const plan = useMutation({ mutationFn: turmaId => api('/aluno/plano/itens', { method: 'POST', body: { turmaId } }), onSuccess: () => { notify('Turma adicionada ao planejamento. Nenhuma vaga foi reservada.'); qc.invalidateQueries({ queryKey: ['plano'] }); }, onError: e => notify(e.message, 'error') });
    return <><PageTitle eyebrow="GRADUAÇÃO / SEMESTRE CORRENTE" title="Ofertas de disciplinas" description="Consulte turmas, vagas e pré-requisitos para realizar suas matrículas." actions={<Link to="/aluno/planejamento" className="btn btn-outline"><Layers3 size={17}/> Meu planejamento <ArrowRight size={16}/></Link>}/><div className="stats-banner"><div className="banner-icon"><BookOpenText size={22}/></div><div><strong>Planejamento não é matrícula</strong><span>Adicionar ao plano é uma simulação — você só ocupa vaga quando confirmar uma matrícula.</span></div><Link className="banner-link" to="/aluno/planejamento">Ver planejamento <ArrowRight size={16}/></Link></div><div className="content-toolbar"><div><h2>Turmas ofertadas</h2><p>Filtre o catálogo pelo nome ou código da disciplina.</p></div><SearchField value={search} onChange={setSearch} placeholder="Buscar disciplina ou código"/></div><QueryState loading={data.isLoading} error={data.error} retry={() => data.refetch()} empty={data.data && !data.data.items.length ? { title: query ? 'Nenhuma oferta encontrada' : 'Nenhuma turma aberta', description: query ? 'Tente outro termo de busca.' : 'As turmas aparecerão quando forem abertas pela secretaria.' } : null}><div className="offer-list">{data.data?.items.map(item => <SectionCard key={item.id} item={item} busy={enroll.isPending || plan.isPending} onEnroll={enroll.mutate} onPlan={plan.mutate} alreadyPlanned={plannedSubjects.has(item.disciplina.id)}/>)}</div><Pagination pagination={data.data?.pagination} onChange={goPage}/></QueryState></>;
}
