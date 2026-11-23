# Demonstração Trama — operação, diagnóstico e validação

> Ambiente isolado da implementação do desafio. Branch: `demo/vercel-preview`. A `main` não depende da Vercel.

## Arquitetura de execução

- **Frontend:** React/Vite, servido estaticamente pela Vercel.
- **Backend:** Fastify, `apps/api/src/index.mjs`, por meio de Vercel Services.
- **Banco:** PostgreSQL exclusivo no Neon, acessado apenas pelo backend.
- **Roteamento:** `/api/*` chega ao Fastify; demais caminhos ao Vite.
- **Configurações protegidas:** `DATABASE_URL` e `SESSION_SECRET` na Vercel. Nunca publicar essas variáveis no Git.

O código de desenvolvimento local continua iniciando em `apps/api/src/server.mjs`. O ponto de entrada da Vercel é separado para não modificar o comando `npm run dev`.

## Incidente do login — 23/11/2026

### Sintomas e reprodução antes da correção

Em uma requisição HTTP externa ao domínio da demonstração:

| Rota | Resultado |
| --- | --- |
| `GET /` | 200 em 0,34 s |
| `GET /api/health` | timeout após 20 s |
| `GET /api/auth/me` | timeout após 20 s |

Isso isolou o problema no backend, pois até uma rota que rejeita imediatamente usuários não autenticados não respondia.

### Causa identificada

`apps/api/src/index.mjs` apenas exportava a instância Fastify. Para o adaptador Fastify da Vercel utilizado por este projeto, o módulo precisa chamar `app.listen(...)` para inicializar o servidor HTTP.

A referência usada foi a [documentação oficial de Fastify na Vercel](https://vercel.com/docs/frameworks/backend/fastify) e o [guia de implantação](https://vercel.com/kb/guide/ship-a-fastify-app-on-vercel).

### Correções implementadas

1. Inicialização explícita da API via `app.listen`, com porta configurável e tratamento de falha de startup.
2. Preservação da inicialização local em `server.mjs` e isolamento do deploy na branch de demonstração.
3. Remoção do bloqueio do botão de login durante a checagem de sessão inicial, já corrigido anteriormente.
4. Tempo limite de requisição no frontend com mensagem de erro, sem mascarar os problemas do servidor.
5. Script de smoke test `scripts/smoke-live.mjs` com verificação de frontend, saúde, 401, login, cookie e ofertas.

### Verificação HTTP após a correção

| Rota | Resultado |
| --- | --- |
| `GET /api/health` | 200, 0,43 s |
| `GET /api/auth/me` sem cookie | 401, 0,19 s |
| `GET /api/aluno/ofertas` sem cookie | 401, 0,04 s |
| `POST /api/auth/login` com corpo inválido | 400, 0,33 s |

Os resultados demonstram que o listener Fastify atende solicitações, a API alcança o banco e as validações de entrada e autorização respondem sem travar. **Esses resultados não equivalem a uma verificação de login com credenciais válidas**; essa etapa deve ser conferida separadamente.

## Smoke test de login

O teste de integração da versão online está implementado em `scripts/smoke-live.mjs`. Ele só lê dados e não cria matrículas.

```bash
SMOKE_BASE_URL=https://trama-matricula-demo.vercel.app \
SMOKE_USERNAME=ana.si \
SMOKE_PASSWORD='<senha-de-demonstracao>' \
node scripts/smoke-live.mjs
```

As credenciais não devem ser comitadas nem inseridas em logs. Se um teste falhar, verificar separadamente `/api/health` e a autenticação para identificar o componente afetado.

## Critérios de aceite

- [x] Frontend servido pela Vercel.
- [x] API responde a `/api/health` e consulta o banco de dados.
- [x] Rejeição não autenticada retorna 401 sem timeout.
- [x] Validação de login retorna 400 rapidamente para dados inválidos.
- [x] Banco exclusivo do Neon e variáveis de ambiente criptografadas.
- [x] Código de smoke test de autenticação incluído.
- [ ] Executar smoke test com credenciais de demonstração e confirmar cookie, sessão e leitura de ofertas.
- [ ] Testar manualmente as telas de aluno e secretaria em computador/celular.

## Diagnóstico futuro

1. Se `/` carregar e `/api/health` não, investigar função Fastify e logs do backend na Vercel.
2. Se `/api/health` falhar com erro do PostgreSQL, verificar Neon, credenciais e configuração de SSL/pool.
3. Se `/api/health` retornar 200 e o login falhar com 401, verificar dados do usuário e hash, sem alterar senhas de produção.
4. Se houver 403 em POST, verificar a política de origem no `onRequest` e o cabeçalho `Origin`.
5. Não resolver falhas de backend aumentando indefinidamente o timeout do frontend.
