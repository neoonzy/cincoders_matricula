import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, ArrowRight, ShieldCheck, Eye, EyeOff, School } from './icons';
import { CinBrand } from './brand';
import { api } from './api';
import { Shell, ToastProvider, ErrorMessage } from './components';
import { Offers, Enrollments, Progress, Planning } from './student';
import { Disciplines, Professors, Sections } from './secretary';
import './styles.css';
import './polish.css';
const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: true } } });
const startPath = user => user.perfil === 'SECRETARIA' ? '/secretaria/disciplinas' : '/aluno/ofertas';
function useMe() { return useQuery({ queryKey: ['me'], queryFn: ({ signal }) => api('/auth/me', { signal }), retry: false, staleTime: 60000 }); }
function SessionWatcher() { const navigate = useNavigate(), client = useQueryClient(); useEffect(() => { const fn = () => { client.setQueryData(['me'], null); navigate('/login', { replace: true }); }; window.addEventListener('sessao-expirada', fn); return () => window.removeEventListener('sessao-expirada', fn); }, [navigate, client]); return null; }
function Login() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { data: user } = useMe();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) navigate(startPath(user), { replace: true });
  }, [user, navigate]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await client.cancelQueries({ queryKey: ['me'] });
      await api('/auth/login', { method: 'POST', body: { username, password } });
      const me = await api('/auth/me');
      client.setQueryData(['me'], me);
      navigate(startPath(me), { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(account) {
    setUsername(account);
    setPassword('Teste@2026');
    setError(null);
  }

  return (
    <div className="login-page">
      <header className="login-header"><div className="institution-lockup"><CinBrand/><div className="institution-product"><strong>Matrícula</strong><span>Portal acadêmico</span></div></div><span className="edition-label">Ambiente de demonstração</span></header>
      <main className="login-layout" id="conteudo">
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-form-wrap">
            <div className="login-app-icon" aria-hidden="true"><GraduationCap size={32}/></div>
            <h1 id="login-title">Entrar no sistema</h1>
            <p className="welcome-description">Acesse sua conta para gerenciar as matrículas do semestre.</p>
            <form onSubmit={submit} className="login-form">
              <label htmlFor="login-username">Nome de usuário</label>
              <input id="login-username" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={e => setUsername(e.target.value)} placeholder="Ex.: ana.si" disabled={busy}/>
              <label htmlFor="login-password">Senha</label>
              <div className="password-wrap"><input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" disabled={busy}/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div>
              <ErrorMessage error={error}/>
              <button className="btn btn-primary login-submit" type="submit" disabled={busy} aria-busy={busy}>{busy ? <><span className="button-spinner" aria-hidden="true"/> Entrando…</> : <>Entrar no portal <ArrowRight size={19}/></>}</button>
            </form>
          </div>
          <details className="demo-box">
            <summary>Experimentar com uma conta de teste</summary>
            <p>Selecione um perfil. Os dados são fictícios.</p>
            <div className="demo-accounts">
              {['ana.si', 'bruno.ec', 'carla.ec', 'secretaria'].map(account => (
                <button key={account} type="button" className="demo-account" onClick={() => fillDemo(account)} disabled={busy}>
                  <span className="demo-avatar">{account === 'secretaria' ? <School size={20}/> : <GraduationCap size={20}/>}</span><span><strong>{account}</strong><small>{account === 'secretaria' ? 'Secretaria' : 'Aluno'}</small></span><ArrowRight size={18}/>
                </button>
              ))}
            </div>
          </details>
        </section>
      </main>
      <footer className="login-footer"><span>Centro de Informática · Universidade Federal de Pernambuco</span><span>Projeto demonstrativo CInCoders · Não é um serviço oficial da UFPE</span></footer>
    </div>
  );
}

function Guard({ role, children }) { const { data: user, isLoading, isError, error, refetch, isFetching } = useMe(); if (isLoading)
    return <div className="full-screen-loading" role="status">Carregando sessão…</div>; if (isError && error?.status !== 401 && !user)
    return <div className="full-screen-loading"><section className="state-panel session-error" role="alert"><h2>Não foi possível verificar sua sessão</h2><p>{error?.message}</p><button className="btn btn-primary" type="button" disabled={isFetching} onClick={() => refetch()}>Tentar novamente</button><button className="btn btn-ghost" type="button" onClick={() => window.location.assign('/login')}>Voltar ao acesso</button></section></div>; if (isError || !user)
    return <Navigate to="/login" replace/>; if (user.perfil !== role)
    return <Navigate to={startPath(user)} replace/>; return <Shell user={user}>{children}</Shell>; }
function AppRoutes() { return <><SessionWatcher /><Routes><Route path="/login" element={<Login />}/><Route path="/aluno/ofertas" element={<Guard role="ALUNO"><Offers /></Guard>}/><Route path="/aluno/matriculas" element={<Guard role="ALUNO"><Enrollments /></Guard>}/><Route path="/aluno/progresso" element={<Guard role="ALUNO"><Progress /></Guard>}/><Route path="/aluno/planejamento" element={<Guard role="ALUNO"><Planning /></Guard>}/><Route path="/secretaria/disciplinas" element={<Guard role="SECRETARIA"><Disciplines /></Guard>}/><Route path="/secretaria/professores" element={<Guard role="SECRETARIA"><Professors /></Guard>}/><Route path="/secretaria/turmas" element={<Guard role="SECRETARIA"><Sections /></Guard>}/><Route path="*" element={<DefaultRoute />}/></Routes></>; }
function DefaultRoute() { const { data: user, isLoading } = useMe(); if (isLoading)
    return null; return <Navigate to={user ? startPath(user) : '/login'} replace/>; }
createRoot(document.getElementById('root')).render(<React.StrictMode><QueryClientProvider client={qc}><BrowserRouter><ToastProvider><AppRoutes /></ToastProvider></BrowserRouter></QueryClientProvider></React.StrictMode>);
