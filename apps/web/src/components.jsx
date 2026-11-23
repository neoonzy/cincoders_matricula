import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { GraduationCap, BookOpenText, ClipboardList, TrendingUp, Layers3, UsersRound, School, LogOut, Menu, X, ArrowRight, ChevronLeft, ChevronRight, Search, RefreshCw, AlertCircle, CheckCircle2, Info, CalendarDays } from 'lucide-react';
import { api } from './api';
const ToastContext = createContext(() => { });
export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const notify = (message, type = 'success') => setToast({ message, type, id: Date.now() });
    useEffect(() => { if (!toast)
        return; const t = setTimeout(() => setToast(null), 5500); return () => clearTimeout(t); }, [toast]);
    return <ToastContext.Provider value={notify}>{children}{toast && <div className={'toast ' + (toast.type === 'error' ? 'toast-error' : '')} role={toast.type === 'error' ? 'alert' : 'status'}><span>{toast.type === 'error' ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>}</span><p>{toast.message}</p><button aria-label="Fechar notificação" onClick={() => setToast(null)}><X size={16}/></button></div>}</ToastContext.Provider>;
}
export const useNotify = () => useContext(ToastContext);
const STUDENT_NAV = [{ path: '/aluno/ofertas', label: 'Ofertas', icon: BookOpenText }, { path: '/aluno/matriculas', label: 'Minhas matrículas', icon: ClipboardList }, { path: '/aluno/progresso', label: 'Meu progresso', icon: TrendingUp }, { path: '/aluno/planejamento', label: 'Planejamento', icon: Layers3 }];
const ADMIN_NAV = [{ path: '/secretaria/disciplinas', label: 'Disciplinas', icon: BookOpenText }, { path: '/secretaria/professores', label: 'Professores', icon: UsersRound }, { path: '/secretaria/turmas', label: 'Turmas', icon: School }];
export function Shell({ user, children }) {
    const [mobileOpen, setMobileOpen] = useState(false), [isMobile, setIsMobile] = useState(false);
    const menuButton = useRef(null), closeButton = useRef(null);
    const location = useLocation(), navigate = useNavigate(), qc = useQueryClient(), notify = useNotify();
    useEffect(() => setMobileOpen(false), [location.pathname]);
    useEffect(() => { const mq = window.matchMedia('(max-width:700px)'); const sync = () => setIsMobile(mq.matches); sync(); mq.addEventListener('change', sync); return () => mq.removeEventListener('change', sync); }, []);
    useEffect(() => { if (!mobileOpen)
        return; closeButton.current?.focus(); const key = e => { if (e.key === 'Escape') {
        setMobileOpen(false);
        menuButton.current?.focus();
    } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [mobileOpen]);
    const isStudent = user.perfil === 'ALUNO', nav = isStudent ? STUDENT_NAV : ADMIN_NAV;
    const onLogout = async () => { try {
        await api('/auth/logout', { method: 'POST' });
        qc.clear();
        navigate('/login', { replace: true });
    }
    catch (error) {
        notify(error.message, 'error');
    } };
    return <div className="app-frame">
    <aside id="navegacao-principal" className={'sidebar ' + (mobileOpen ? 'sidebar-open' : '')} aria-label="Navegação principal" inert={isMobile && !mobileOpen}>
      <div className="brand-block"><div className="brand-icon" aria-hidden="true"><GraduationCap size={25} strokeWidth={1.8}/></div><div><span className="brand-name">trama<span className="brand-period">.</span></span><span className="brand-subtitle">portal acadêmico</span></div><button ref={closeButton} className="mobile-close icon-button" aria-label="Fechar navegação" onClick={() => setMobileOpen(false)}><X size={20}/></button></div>
      <div className="nav-group-label">ESPAÇO {isStudent ? 'DO ALUNO' : 'DA SECRETARIA'}</div>
      <nav className="side-nav">{nav.map(({ path, label, icon: Icon }) => <NavLink end key={path} to={path} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}><Icon size={19} strokeWidth={1.9}/>{label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="support-note"><div className="support-icon"><CalendarDays size={17}/></div><div><strong>Semestre corrente</strong><span>Suas informações em um só lugar.</span></div></div><div className="side-user"><div className="avatar">{user.nome?.slice(0, 1).toUpperCase()}</div><div className="side-user-name"><strong>{user.nome}</strong><span>{isStudent ? 'Estudante' : 'Secretaria de Graduação'}</span></div><button className="icon-button logout" title="Sair" aria-label="Sair da conta" onClick={onLogout}><LogOut size={19}/></button></div></div>
    </aside>
    {mobileOpen && <button className="menu-scrim" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"/>}
    <div className="workspace"><header className="topbar"><button ref={menuButton} className="icon-button menu-trigger" aria-label="Abrir navegação" aria-controls="navegacao-principal" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={22}/></button><div className="breadcrumbs"><span>Portal acadêmico</span><ArrowRight size={14}/><strong>{nav.find(n => location.pathname === n.path)?.label || 'Visão geral'}</strong></div><div className="topbar-right"><span className="top-badge">{isStudent ? 'ÁREA DO ALUNO' : 'SECRETARIA'}</span><span className="top-avatar">{user.nome?.slice(0, 1).toUpperCase()}</span></div></header><main className="page-content" id="conteudo"><div className="page-inner">{children}</div></main></div>
  </div>;
}
export function PageTitle({ eyebrow, title, description, actions }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>; }
export function Badge({ kind, children }) { const style = kind === 'OBRIGATORIA' ? 'badge-blue' : kind === 'PERFIL' ? 'badge-violet' : kind === 'LIVRE' ? 'badge-sand' : kind === 'good' ? 'badge-green' : kind === 'bad' ? 'badge-red' : 'badge-neutral'; return <span className={'badge ' + style}>{children}</span>; }
export const categoryName = kind => ({ OBRIGATORIA: 'Obrigatória', PERFIL: 'Eletiva de perfil', LIVRE: 'Eletiva livre' })[kind] || kind;
export function Availability({ remaining, total }) { const full = remaining === 0; return <span className={'availability ' + (full ? 'availability-full' : '')}><span className="availability-dot"/>{full ? 'Turma lotada' : `${remaining} de ${total} vagas disponíveis`}</span>; }
export function QueryState({ loading, error, retry, empty, children }) {
    if (loading)
        return <div className="skeleton-list" aria-label="Carregando informações" aria-busy="true">{[0, 1, 2].map(n => <div className="skeleton-card" key={n}><div className="skeleton-line medium"/><div className="skeleton-line small"/><div className="skeleton-line large"/></div>)}</div>;
    if (error)
        return <div className="state-panel" role="alert"><div className="state-icon"><AlertCircle /></div><h2>Não foi possível carregar</h2><p>{error.message}</p><button className="btn btn-outline" onClick={retry}><RefreshCw size={16}/> Tentar novamente</button></div>;
    if (empty)
        return <EmptyState {...empty}/>;
    return children;
}
export function EmptyState({ title = 'Nada por aqui ainda', description = 'Os registros aparecerão nesta área.', icon: Icon = Info, action }) { return <div className="state-panel"><div className="state-icon"><Icon size={23}/></div><h2>{title}</h2><p>{description}</p>{action}</div>; }
export function Pagination({ pagination, onChange }) { if (!pagination || pagination.totalPages <= 1)
    return null; const { page, totalPages, total } = pagination; return <div className="pagination"><span>{total} resultado{total !== 1 ? 's' : ''} · página {page} de {totalPages}</span><div className="pagination-buttons"><button aria-label="Página anterior" disabled={page <= 1} className="btn btn-outline btn-small" onClick={() => onChange(page - 1)}><ChevronLeft size={17}/> Anterior</button><button aria-label="Próxima página" disabled={page >= totalPages} className="btn btn-outline btn-small" onClick={() => onChange(page + 1)}>Próxima <ChevronRight size={17}/></button></div></div>; }
export function SearchField({ value, onChange, placeholder }) { return <label className="search-wrap"><Search size={19} aria-hidden="true"/><span className="sr-only">Buscar</span><input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Buscar por código ou nome'}/></label>; }
export function ErrorMessage({ error }) { return error ? <div className="form-error" role="alert"><AlertCircle size={17}/><span>{error.message}</span></div> : null; }
export function InlineNotice({ children, warning = false }) { return <p className={'notice-inline ' + (warning ? 'notice-warning' : '')}><Info size={16} aria-hidden="true"/>{children}</p>; }
export function HoursProgress({ name, data, projected = false }) {
    const percent = projected ? data.percentualProjetado : data.percentual;
    return <section className="progress-tile"><div className="progress-top"><h3>{name}</h3><strong>{percent}%</strong></div><div className="progress-track" role="progressbar" aria-label={`Conclusão ${name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }}/></div><div className="progress-metrics"><span><strong>{data.integralizada}h</strong> concluídas</span><span><strong>{data.exigida}h</strong> exigidas</span></div><div className="progress-divider"/><div className="progress-foot"><div><span className="stat-caption">Em curso</span><strong>{data.emCurso}h</strong></div>{projected && <div><span className="stat-caption">Planejadas viáveis</span><strong>{data.planejadaElegivel}h</strong></div>}<div><span className="stat-caption">{projected ? 'Faltam na projeção' : 'Ainda faltam'}</span><strong>{projected ? data.faltanteProjetada : data.faltante}h</strong></div></div></section>;
}
export function IntroLink({ to, children }) { return <Link to={to} className="text-link">{children} <ArrowRight size={16}/></Link>; }
