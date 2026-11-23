import React, { createContext, useContext, useEffect, useState, useRef, useId } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { GraduationCap, BookOpenText, ClipboardList, TrendingUp, Layers3, UsersRound, School, LogOut, Menu, X, ArrowRight, ChevronLeft, ChevronRight, Search, RefreshCw, AlertCircle, CheckCircle2, Info, CalendarDays } from './icons';
import { api } from './api';
import { CinBrand } from './brand';
const ToastContext = createContext(() => { });
export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const notify = (message, type = 'success') => setToast({ message, type, id: Date.now() });
    useEffect(() => { if (!toast)
        return; const t = toast.type === "error" ? null : setTimeout(() => setToast(null), 6500); return () => clearTimeout(t); }, [toast]);
    return <ToastContext.Provider value={notify}>{children}{toast && <div className={'toast ' + (toast.type === 'error' ? 'toast-error' : '')} role={toast.type === 'error' ? 'alert' : 'status'}><span>{toast.type === 'error' ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>}</span><p>{toast.message}</p><button aria-label="Fechar notificação" onClick={() => setToast(null)}><X size={16}/></button></div>}</ToastContext.Provider>;
}
export const useNotify = () => useContext(ToastContext);
const STUDENT_NAV = [
  { path: '/aluno/ofertas', label: 'Ofertas', icon: BookOpenText },
  { path: '/aluno/matriculas', label: 'Minhas matrículas', mobile: 'Matrículas', icon: ClipboardList },
  { path: '/aluno/progresso', label: 'Meu progresso', mobile: 'Progresso', icon: TrendingUp },
  { path: '/aluno/planejamento', label: 'Planejamento', icon: Layers3 }
];
const ADMIN_NAV = [
  { path: '/secretaria/disciplinas', label: 'Disciplinas', icon: BookOpenText },
  { path: '/secretaria/professores', label: 'Professores', icon: UsersRound },
  { path: '/secretaria/turmas', label: 'Turmas', icon: School }
];
export function Shell({ user, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notify = useNotify();
  const isStudent = user.perfil === 'ALUNO';
  const nav = isStudent ? STUDENT_NAV : ADMIN_NAV;
  const persona = isStudent ? 'student' : 'secretary';
  const area = isStudent ? 'Área do aluno' : 'Secretaria';
  const current = nav.find(item => item.path === location.pathname);
  const mainRef = useRef(null);
  const firstRoute = useRef(true);
  useEffect(() => {
    document.title = `${current?.label || area} · Matrícula | CIn UFPE`;
    if (firstRoute.current) { firstRoute.current = false; return; }
    window.scrollTo(0,0);
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, current?.label, area]);
  const [leaving, setLeaving] = useState(false);

  async function onLogout() {
    setLeaving(true);
    try {
      await api('/auth/logout', { method: 'POST' });
      qc.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLeaving(false);
    }
  }
  return (
    <div className="app-frame" data-persona={persona}>
      <a href="#conteudo" className="skip-link">Ir para o conteúdo</a>
      <header className="institution-header">
        <div className="institution-header-inner">
          <div className="institution-lockup">
            <CinBrand />
            <div className="institution-product"><strong>Matrícula</strong><span>Portal acadêmico</span></div>
          </div>
          <div className="account-tools">
            <span className="workspace-semester"><CalendarDays size={17}/> Semestre atual</span>
            <details className="account-menu">
              <summary aria-label="Minha conta"><span className="avatar" aria-hidden="true">{(user.nome || user.username || 'U').slice(0,1).toUpperCase()}</span><span className="account-name"><strong>{user.nome || user.username}</strong><span>{area}</span></span><ChevronRight size={15}/></summary>
              <div className="account-popover"><strong>{user.nome || user.username}</strong><p>{user.username} · {area}</p><button type="button" className="btn btn-ghost logout-button" onClick={onLogout} disabled={leaving}><LogOut size={18}/> {leaving ? 'Saindo…' : 'Sair da conta'}</button></div>
            </details>
          </div>
        </div>
      </header>
      <div className="area-bar">
        <div className="area-bar-inner">
          <div className="area-label"><span className="persona-dot"/>{area}</div>
          <nav className="institution-nav" aria-label="Navegação principal">
            {nav.map(({ path, label, mobile, icon: Icon }) => (
              <NavLink key={path} end to={path} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
                <span className="nav-icon"><Icon size={22}/></span>
                <span className="nav-desktop-label">{label}</span>
                <span className="nav-mobile-label">{mobile || label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="workspace-note"><Info size={16}/><span>Demonstração · Dados fictícios</span></div>
        </div>
      </div>
      <main ref={mainRef} className="page-content" id="conteudo" tabIndex={-1}>
        <div className="page-inner">{children}</div>
        <footer className="institution-footer"><span>Centro de Informática · UFPE</span><span>Projeto demonstrativo · CInCoders</span></footer>
      </main>
    </div>
  );
}
export function PageTitle({ eyebrow, title, description, actions }) {
  return <div className="page-heading"><div className="page-heading-copy"><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}
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
export function SearchField({ value, onChange, placeholder }) {
  const field = useRef(null);
  return <div className="search-wrap" role="search"><Search size={19}/><input ref={field} aria-label="Buscar" type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Buscar por código ou nome'}/>{value && <button className="clear-search" type="button" aria-label="Limpar busca" onClick={() => { onChange(''); field.current?.focus(); }}><X size={16}/></button>}</div>;
}
export function ErrorMessage({ error }) { return error ? <div className="form-error" role="alert"><AlertCircle size={17}/><span>{error.message}</span></div> : null; }
export function InlineNotice({ children, warning = false }) { return <p className={'notice-inline ' + (warning ? 'notice-warning' : '')}><Info size={16} aria-hidden="true"/>{children}</p>; }
export function HoursProgress({ name, data, projected = false }) {
    const percent = projected ? data.percentualProjetado : data.percentual;
    return <section className="progress-tile"><div className="progress-top"><h3>{name}</h3><strong>{percent}%</strong></div><div className="progress-track" role="progressbar" aria-label={`${projected ? "Conclusão projetada" : "Conclusão"} ${name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }}/></div><div className="progress-metrics"><span><strong>{data.integralizada}h</strong> concluídas</span><span><strong>{data.exigida}h</strong> exigidas</span></div><div className="progress-divider"/><div className="progress-foot"><div><span className="stat-caption">Em curso</span><strong>{data.emCurso}h</strong></div>{projected && <div><span className="stat-caption">Planejadas viáveis</span><strong>{data.planejadaElegivel}h</strong></div>}<div><span className="stat-caption">{projected ? 'Faltam na projeção' : 'Ainda faltam'}</span><strong>{projected ? data.faltanteProjetada : data.faltante}h</strong></div></div></section>;
}
export function IntroLink({ to, children }) { return <Link to={to} className="text-link">{children} <ArrowRight size={16}/></Link>; }

/** Native modal: browser handles focus trapping, Escape and background inertness. */
export function ConfirmDialog({ title, description, confirmLabel, busy, error, onClose, onConfirm, destructive = true, children }) {
  const dialog = useRef(null);
  const titleId = useId(), descriptionId = useId();
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement;
    if (!el.open) el.showModal();
    return () => {
      if (el.open) el.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <div className={`confirm-icon ${destructive ? "" : "confirm-icon-neutral"}`}>{destructive ? <AlertCircle size={25}/> : <BookOpenText size={25}/>}</div>
    <h2 id={titleId}>{title}</h2>
    <p id={descriptionId}>{description}</p>
    {children}
    <ErrorMessage error={error}/>
    <div className="confirm-actions">
      <button type="button" className="btn btn-outline" autoFocus disabled={busy} onClick={onClose}>Voltar</button>
      <button type="button" className="btn btn-primary" aria-busy={busy} disabled={busy} onClick={onConfirm}>{busy ? <><span className="button-spinner" aria-hidden="true"/> Aguarde…</> : confirmLabel}</button>
    </div>
  </dialog>;
}
