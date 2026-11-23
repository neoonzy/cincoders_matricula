import React, { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpenText, Trash2 } from '../icons';
import { api, invalidateStudent } from '../api';
import { PageTitle, QueryState, ConfirmDialog, useNotify } from '../components';

export function Enrollments() {
    const qc = useQueryClient(), notify = useNotify();
    const [selected, setSelected] = useState(null);
    const q = useQuery({ queryKey: ['matriculas'], queryFn: () => api('/aluno/matriculas') });
    const cancel = useMutation({ mutationFn: id => api(`/aluno/matriculas/${id}`, { method: 'DELETE' }), onSuccess: () => { setSelected(null); notify('Matrícula cancelada. A vaga foi liberada.'); invalidateStudent(qc); }, onError: e => notify(e.message, 'error') });
    function cancelWithConfirm(item) { cancel.reset(); setSelected(item); }
    return <><PageTitle eyebrow="GRADUAÇÃO / SEMESTRE CORRENTE" title="Minhas matrículas" description="Acompanhe as turmas em que você está matriculado neste semestre." actions={<Link to="/aluno/ofertas" className="btn btn-primary"><BookOpenText size={17}/> Ver ofertas <ArrowRight size={16}/></Link>}/><div className="summary-strip"><div><span>MATRÍCULAS ATIVAS</span><strong>{q.data?.length ?? '—'}</strong></div><div><span>CARGA HORÁRIA EM CURSO</span><strong>{q.data ? `${q.data.reduce((n, x) => n + x.disciplina.ch, 0)}h` : '—'}</strong></div></div><div className="section-label"><h2>Disciplinas em curso</h2><span>Semestre atual</span></div><QueryState loading={q.isLoading} error={q.error} retry={() => q.refetch()} empty={q.data?.length === 0 ? { title: 'Nenhuma matrícula ativa', description: 'Explore as ofertas e faça sua primeira matrícula do semestre.', action: <Link to="/aluno/ofertas" className="btn btn-primary">Explorar ofertas <ArrowRight size={16}/></Link> } : null}><div className="enrollment-list">{q.data?.map(item => <article className="enrollment-item" key={item.matriculaId}><div className="enrollment-square"><BookOpenText size={23}/></div><div className="enrollment-info"><span className="course-code">{item.disciplina.codigo}</span><h3>{item.disciplina.nome}</h3><p>{item.professor.nome} · {item.disciplina.ch}h</p></div><span className="enroll-active"><span /> Ativa</span><button className="btn btn-outline btn-danger" disabled={cancel.isPending} onClick={() => cancelWithConfirm(item)}><Trash2 size={16}/> Cancelar</button></article>)}</div></QueryState>{selected && <ConfirmDialog title="Cancelar matrícula?" description={`Sua matrícula em ${selected.disciplina.nome} será cancelada e a vaga ficará disponível para outro aluno.`} confirmLabel="Cancelar matrícula" busy={cancel.isPending} error={cancel.error} onClose={() => setSelected(null)} onConfirm={() => cancel.mutate(selected.matriculaId)}/>}</>;
}
