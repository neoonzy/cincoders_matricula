# Decisões técnicas, diagnóstico e estado da implementação

**Data:** 2026-11-22 · **Base:** 01–04 do planejamento + edital. Não confundir com a matriz de testes *planejados*.

## Diagnóstico

O enunciado enfatiza a aplicação das regras de negócio e a entrevista sobre escolhas técnicas. O planejamento anterior tinha decisões [D] que ainda não estavam implementadas. O escopo foi preservado: um semestre corrente, dois perfis, carga horária em três categorias e dois diferenciais integrados. Não foram adicionados horários, aconselhamento automatizado, matrícula em lote ou cadastro de cursos/alunos.

## Decisões e trade-offs (ADRs compactos)

**ADR-01 · Monorepo com npm workspaces.** Um único comando de desenvolvimento e versionamento dos módulos web/API/domínio. Não exige ferramentas de workspace adicionais.

**ADR-02 · React, Vite e React Router declarativo.** SPA adequada ao teste, com URL persistindo busca/paginação. TanStack Query faz deduplicação, estado remoto e invalidação de caches. Componentes de UI próprios com CSS de tokens: nenhuma biblioteca visual pesada.

**ADR-03 · Fastify e PostgreSQL com SQL explícito.** Fastify valida entrada e organiza rotas; SQL centralizado em services cobre a persistência e locking. O planejamento sugeria Prisma, mas SQL explícito evita introduzir outra camada durante o teste e permite demonstrar diretamente transações, locks e constraints. Custo: mais código manual e eventual revisão ao aumentar número de entidades.

**ADR-04 · JavaScript ESM + JSDoc em vez de TS.** O domínio não necessita transpilar para execução/testes unitários em Node 22. Escolha permitida pelo edital, embora TS compartilhado seja preferível se o projeto crescer. Foi priorizada a possibilidade de teste direto do domínio num ambiente sem dependências.

**ADR-05 · PostgreSQL 16 em Docker Compose.** Acesso simples ao row locking, constraints e banco transacional. O código de API não simula persistência. Em ambientes sem Docker, usar PostgreSQL local.

**ADR-06 · Cookie assinado HttpOnly.** Sessão stateless de oito horas, mesma origem e cabeçalhos básicos. Logout apaga o cookie do navegador, mas não revoga um token já copiado; produção pediria sessão persistida/revogação, HTTPS e controle de abuso distribuído.

**ADR-07 · Consistência concorrente.** Lock **aluno → turma**, contagem de vagas em consulta posterior ao lock, tudo no mesmo `BEGIN/COMMIT`. Alteração de capacidade também bloqueia a turma. O aluno fica protegido contra matrícula simultânea na mesma disciplina em turmas diferentes; a turma evita dupla ocupação da última vaga.

**ADR-08 · Plano ≠ matrícula.** Plano guarda referência à turma, nunca uma reserva. Permite incluir turmas lotadas ou com pré-requisito pendente para explorar alternativas, exibe impedimentos em tempo real, e não entra na projeção viável. Matricular exige revalidar tudo na API.

**ADR-09 · Progresso real ≠ projetado.** Uma função pura calcula categorias e transfere excedentes de perfil. Em planejamento, a função recebe uma terceira etapa elegível depois das aprovações e das matrículas ativas, com premissa hipotética explícita.

## Matriz de evidência de implementação

| Bloco | Código | Evidência automatizada executada localmente |
|---|---|---|
| Validação CH/categorias/percentuais | `packages/domain/src/index.mjs` | Sim: testes Node (14/14) |
| Pré-requisitos e ciclo | `packages/domain/src/index.mjs`, `apps/api/scripts/seed.mjs` | Sim: testes puros; integração não executada |
| Matrícula, cancelamento e concorrência | `apps/api/src/services.mjs` | Suite PostgreSQL escrita, **não executada** |
| Sessão, perfis, HTTP | `apps/api/src/app.mjs`, `security.mjs` | Sintaxe verificada; HTTP não executado |
| Progresso e planejamento persistido | `apps/api/src/services.mjs`, `apps/web/src/student.jsx` | Domínio testado; integração não executada |
| Secretaria | `apps/api/src/services.mjs`, `apps/web/src/secretary.jsx` | Sintaxe verificada; UI não executada |
| Responsividade 360px, navegação, loading/erro/vazio | `apps/web/src/styles.css`, JSX | Parsing JSX verificado; navegador E2E bloqueado |
| Inicialização seed/migração | `apps/api/sql`, `scripts` | Sintaxe verificada; PostgreSQL indisponível aqui |

A matriz maior em `03-PLANO-DE-TESTES.md` contém **77 cenários planejados**, não 77 testes aprovados. A suíte de integração é condicional a `TEST_DATABASE_URL`, isolada do banco principal.

## Riscos e pendências antes de submeter

1. `npm install`, `npm run build` e validação do contrato entre React e API ainda precisam ser executados num ambiente com npm.
2. `docker compose up -d db` + migração + seed e `npm run test:integration` ainda precisam ser executados em PostgreSQL real.
3. Executar smoke em 360px, teste manual no desktop e navegação com teclado; verificar sobreposição, menus e leitura por tecnologia assistiva. É obrigatório não afirmar acessibilidade comprovada sem auditoria.
4. Conferir se `POST` concorrente não excede vagas em um PostgreSQL real e ajustar eventuais problemas observados.
5. Gerar `package-lock.json` após instalação e trocá-lo para `npm ci` no CI para builds reproduzíveis.
6. Publicar no GitLab institucional, compartilhar com o usuário exigido e verificar o prazo. Este ambiente não recebeu URL/credenciais de GitLab.

## Argumentos para entrevista

- **Por que não reservar no plano?** Planejar é explorar; reserva seria uma regra de expiração, conflito e concorrência adicional, fora do edital.
- **Por que lock aluno primeiro?** Serializa mutações concorrentes do mesmo estudante e impede duplicidade entre turmas da mesma disciplina.
- **Por que contagem em segunda consulta?** No PostgreSQL, a instrução que espera por lock pode ter começado com snapshot anterior. O cálculo após o lock lê os commits mais recentes em `READ COMMITTED`.
- **Por que a CH não duplica?** Aprovações são deduplicadas por disciplina. A função processa as etapas na ordem correta, limitando apenas o segmento de perfil pela meta; excedente migra para livre.
- **O que mudaria em produção?** Sessões revogáveis, gestão de secrets, RBAC com trilha de auditoria, monitoramento, migrações versionadas e homologação de políticas acadêmicas.
