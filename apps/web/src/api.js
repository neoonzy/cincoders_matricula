/** Mesmo domínio no desenvolvimento (proxy Vite) e em produção. */
export async function api(path, { method = 'GET', body, signal } = {}) {
    let response;
    try {
        response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal });
    }
    catch (error) {
        if (error.name === 'AbortError')
            throw error;
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
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
