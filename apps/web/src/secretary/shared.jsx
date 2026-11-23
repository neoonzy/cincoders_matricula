import React from 'react';
import { useEffect, useState } from 'react';
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

export function FormPanel({ title, description, onClose, children }) { return <section className="editor-panel" aria-label={title}><div className="editor-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" aria-label="Fechar formulário" onClick={onClose}><X size={20}/></button></div>{children}</section>; }
