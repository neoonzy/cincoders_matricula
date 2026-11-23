import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpenText, Layers3, ChevronRight } from '../icons';
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
    const [view, setView] = useState(() => { try { return (localStorage.getItem('matricula-offer-view') || localStorage.getItem('trama-offer-view')) === 'grid' ? 'grid' : 'list'; } catch { return 'list'; } });
    const setLayout = next => { setView(next); try { localStorage.setItem('matricula-offer-view', next); } catch { /* Preferences are optional. */ } };
    const currentEnrollments = useQuery({ queryKey: ['matriculas'], queryFn: () => api('/aluno/matriculas') });
    const currentPlan = useQuery({ queryKey: ['plano'], queryFn: () => api('/aluno/plano') });
    const plannedSubjects = new Set(currentPlan.data?.itens.map(x => x.disciplina.id) ?? []);
    useEffect(() => { const actual = data.data?.pagination?.page; if (actual && actual !== page)
        goPage(actual); }, [data.data?.pagination?.page, page, goPage]);
    const enroll = useMutation({ mutationFn: turmaId => api('/aluno/matriculas', { method: 'POST', body: { turmaId } }), onSuccess: () => { notify('Matrícula realizada. A vaga já está registrada para você.'); invalidateStudent(qc); }, onError: e => { notify(e.message, 'error'); invalidateStudent(qc); } });
    const plan = useMutation({ mutationFn: turmaId => api('/aluno/plano/itens', { method: 'POST', body: { turmaId } }), onSuccess: () => { notify('Turma adicionada ao planejamento. Nenhuma vaga foi reservada.'); qc.invalidateQueries({ queryKey: ['plano'] }); }, onError: e => notify(e.message, 'error') });
    return <>
      <PageTitle title="Ofertas de disciplinas" description="Encontre e escolha as turmas do seu semestre."/>
      <div className="semester-overview">
        <Link className="overview-card" to="/aluno/matriculas"><span className="overview-icon"><BookOpenText size={20}/></span><div><span>Matrículas ativas</span><strong>{currentEnrollments.data?.length ?? '—'}</strong></div><ChevronRight size={18}/></Link>
        <Link className="overview-card" to="/aluno/planejamento"><span className="overview-icon overview-yellow"><Layers3 size={20}/></span><div><span>No planejamento</span><strong>{currentPlan.data?.itens?.length ?? '—'}</strong></div><ChevronRight size={18}/></Link>
      </div>
      <section className="catalog" aria-label="Catálogo de ofertas">
        <div className="catalog-header">
          <div className="catalog-title"><h2>Turmas ofertadas</h2><span role="status" aria-live="polite">{data.data ? `${data.data.pagination.total} ${data.data.pagination.total === 1 ? 'resultado' : 'resultados'}` : 'Consulte o catálogo'}</span></div>
          <div className="catalog-controls"><SearchField value={search} onChange={setSearch} placeholder="Buscar por nome ou código"/><div className="view-switch" role="group" aria-label="Visualização das ofertas"><button type="button" aria-pressed={view === 'grid'} title="Grade" onClick={() => setLayout('grid')}><span className="layout-grid-icon" aria-hidden="true"/><span className="sr-only">Grade</span></button><button type="button" aria-pressed={view === 'list'} title="Lista" onClick={() => setLayout('list')}><span className="layout-list-icon" aria-hidden="true"/><span className="sr-only">Lista</span></button></div></div>
        </div>
        <p className="catalog-hint">O planejamento não reserva vagas. Você confirma a matrícula separadamente.</p>
        <QueryState loading={data.isLoading} error={data.error} retry={() => data.refetch()} empty={data.data && !data.data.items.length ? { title: query ? 'Nenhuma oferta encontrada' : 'Nenhuma turma aberta', description: query ? 'Tente buscar pelo código ou nome da disciplina.' : 'As turmas aparecerão quando forem abertas pela secretaria.', action: query ? <button className="btn btn-outline" onClick={() => setSearch('')}>Limpar busca</button> : undefined } : null}>
          <div className={`offer-list view-${view}`}>{data.data?.items.map(item => <SectionCard key={item.id} item={item} busy={enroll.isPending || plan.isPending} onEnroll={enroll.mutateAsync} onPlan={plan.mutate} alreadyPlanned={plannedSubjects.has(item.disciplina.id)}/>)}</div>
          <Pagination pagination={data.data?.pagination} onChange={goPage}/>
        </QueryState>
      </section>
    </>;
}
