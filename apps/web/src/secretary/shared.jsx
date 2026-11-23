import React from 'react';
import { useEffect, useState, useRef, useId } from 'react';
import { useSearchParams } from 'react-router';
import { X } from '../icons';

export function useListParams() {
    const [params, setParams] = useSearchParams(), q = params.get('q') || '', page = Number.isInteger(Number(params.get('page') || 1)) && Number(params.get('page') || 1) > 0 ? Number(params.get('page') || 1) : 1, [input, setInput] = useState(q);
    useEffect(() => setInput(q), [q]);
    useEffect(() => { const timer = setTimeout(() => { if (q === input)
        return; const n = new URLSearchParams(); if (input.trim())
        n.set('q', input.trim()); setParams(n, { replace: true }); }, 300); return () => clearTimeout(timer); }, [q, input, setParams]);
    const setPage = n => { const p = new URLSearchParams(params); if (n <= 1)
        p.delete('page');
    else
        p.set('page', String(n)); setParams(p); };
    return { q, page, input, setInput, setPage };
}

export function FormPanel({ title, description, onClose, busy = false, children }) {
  const dialog = useRef(null), titleId = useId(), descId = useId();
  useEffect(() => {
    const el = dialog.current, previous = document.activeElement;
    if (!el.open) el.showModal();
    return () => { if (el.open) el.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="editor-panel editor-dialog" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <div className="editor-heading"><div><h2 id={titleId}>{title}</h2>{description && <p id={descId}>{description}</p>}</div><button type="button" className="icon-button" aria-label="Fechar formulário" onClick={onClose} disabled={busy}><X size={20}/></button></div>{children}
  </dialog>;
}
export function matchesSearch(value, query) {
  const normalize = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return normalize(value).includes(normalize(query.trim()));
}
