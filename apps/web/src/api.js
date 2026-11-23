/** Mesmo domínio no desenvolvimento (proxy Vite) e em produção. */
export async function api(path, { method = 'GET', body, signal } = {}) {
    let response;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const requestSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
        response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: requestSignal });
    } catch (error) {
        if (error.name === 'AbortError' && signal?.aborted) throw error;
        if (error.name === 'AbortError') throw new Error('O servidor demorou a responder. Tente novamente.');
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    } finally {
        clearTimeout(timer);
    }
    if (response.status === 401 && !path.startsWith('/auth/login'))
        window.dispatchEvent(new Event('sessao-expirada'));
    if (!response.ok) {
        let payload;
        try {
            payload = await response.json();
        }
        catch { }
        const error = new Error(payload?.error?.message || 'Não foi possível concluir a operação.');
        error.code = payload?.error?.code;
        error.details = payload?.error?.details;
        error.status = response.status;
        throw error;
    }
    if (response.status === 204)
        return null;
    return response.json();
}
export function invalidateStudent(queryClient) { for (const key of ['ofertas', 'matriculas', 'progresso', 'plano'])
    queryClient.invalidateQueries({ queryKey: [key] }); }
