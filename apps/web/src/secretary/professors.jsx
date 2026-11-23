import React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../api';
import { PageTitle, QueryState, Badge, ErrorMessage, useNotify } from '../components';
import { FormPanel } from './shared';

export function Professors() {
    const qc = useQueryClient(), notify = useNotify(), [show, setShow] = useState(false), [form, setForm] = useState({ name: '', email: '' });
    const q = useQuery({ queryKey: ['professores'], queryFn: () => api('/professores') });
    const save = useMutation({ mutationFn: data => api('/professores', { method: 'POST', body: data }), onSuccess: () => { notify('Professor cadastrado.'); qc.invalidateQueries({ queryKey: ['professores'] }); qc.invalidateQueries({ queryKey: ['referencias'] }); setShow(false); setForm({ name: '', email: '' }); }, onError: e => notify(e.message, 'error') });
    return <><PageTitle eyebrow="GESTÃO ACADÊMICA / DOCENTES" title="Professores." description="Mantenha os dados dos docentes responsáveis pelas turmas." actions={<button className="btn btn-primary" onClick={() => setShow(true)}><Plus size={17}/> Novo professor</button>}/>{show && <FormPanel title="Cadastrar professor" description="O e-mail deve ser único no sistema." onClose={() => setShow(false)}><form className="admin-form" onSubmit={e => { e.preventDefault(); save.mutate(form); }}><label>Nome completo<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do professor"/></label><label>E-mail institucional<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="professor@exemplo.edu.br"/></label><div className="form-actions"><button type="button" className="btn btn-outline" onClick={() => setShow(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Cadastrar professor'}</button></div><ErrorMessage error={save.error}/></form></FormPanel>}<div className="section-label"><h2>Corpo docente</h2><span>{q.data?.length ?? '—'} registros</span></div><QueryState loading={q.isLoading} error={q.error} retry={() => q.refetch()} empty={q.data?.length === 0 ? { title: 'Sem professores cadastrados', description: 'Cadastre um docente para abrir a primeira turma.' } : null}><div className="professor-grid">{q.data?.map(p => <article className="professor-card" key={p.id}><div className="prof-avatar">{p.nome.slice(0, 1).toUpperCase()}</div><div><h3>{p.nome}</h3><a href={`mailto:${p.email}`}>{p.email}</a></div><Badge kind="neutral">Docente</Badge></article>)}</div></QueryState></>;
}
