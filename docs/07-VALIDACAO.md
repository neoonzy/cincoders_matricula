# Evidência de validação disponível nesta execução

Data: **22 de novembro de 2026**.

## Verificações executadas e aprovadas

- `npm test` — **14 testes unitários do domínio, 14 aprovados, 0 falhas**, com Node.js 22.16.0 (runner nativo `node --test`).
- `node --check` — sintaxe verificada dos arquivos `.mjs` das aplicações, scripts, domínio e integração.
- `typescript.createSourceFile(..., ScriptKind.JSX)` — parsing de todos os quatro arquivos React `.jsx` sem erros de sintaxe. Isso **não** substitui a compilação Vite/React.
- `JSON.parse` — quatro `package.json` válidos.

## Não executados e por quê

- `npm install` e `npm run build`: o container não consegue resolver `registry.npmjs.org`, e não há pacotes locais instalados.
- Testes HTTP + PostgreSQL: a API depende das bibliotecas e de um servidor PostgreSQL; Docker, `psql` e as dependências não estão presentes no ambiente.
- Teste de navegador: Chromium e Playwright existem localmente, mas a navegação foi bloqueada pelo administrador tanto para `file://` quanto para servidor HTTP local. O smoke E2E está disponível para execução em ambiente autorizado.
- Testes reais de responsividade, acessibilidade e desempenho: pendentes. O código CSS possui media queries e estados, mas ainda não foi inspecionado com a aplicação em execução.

**Importante:** essas ausências são uma limitação de verificação, não uma aprovação tácita. O checklist de liberação consta em `05-DECISOES-E-IMPLEMENTACAO.md`.


## Revisão corretiva — 23 de novembro de 2026 (execução local)

- Node.js **22.16.0**: `npm test` após acréscimo de testes de paginação — **16/16 aprovados**.
- O parâmetro `--env-file-if-exists` foi exercitado sem arquivo `.env`: não interrompe a execução por arquivo ausente.
- O algoritmo de paginação agora normaliza `page=999` e listas vazias, coberto pelos testes puros.
- Foram ampliados os casos de integração para verificar e-mail duplicado, redução de capacidade de turma abaixo de ocupação maior que um, autorização e requisitos de histórico. Esses casos **ainda precisam ser executados** em runner com PostgreSQL.
- O código React foi dividido por jornadas e parseado por TypeScript AST; isto **não comprova build**.
- O stylesheet foi reformatado com PostCSS, e seu parsing foi verificado sem erros.
- O runner local permanece sem DNS para o registro npm (`EAI_AGAIN registry.npmjs.org`); não há `package-lock.json` gerado nesta execução.
- A automação `.github/workflows/ci.yml` permite validar `npm test`, `npm run test:integration` e `npm run build` em CI conectado; só considerar aprovado após conferir as execuções.

## Evidência adicional: GitHub Actions (runner hospedado)

- Commit `099ac7d61aa3cbb96ce38fd016603c3d7c49aa32`: **CI aprovado** (`npm test` 16/16; `npm run test:integration` 16/16; `npm run build` sucesso), execução `45096194462`.
- O lockfile npm foi gerado a partir da instalação real em outro job do mesmo workflow, coletado como artefato e incorporado para habilitar `npm ci`.
- O teste E2E em Chromium foi executado e aprovado com PostgreSQL real no GitHub Actions, execução `45096902829`: aluno em 360px (login, ofertas, planejamento, matrícula, cancelamento e progresso) e secretaria em 1280px (navegação e abertura do formulário de turma). As três capturas de tela estão no artefato `screenshots-smoke`. Não substitui auditoria WCAG completa.

- Revisão final da auditoria: commit `425191c4b804ded5412836efd40762aefa147490`, **16/16 testes de domínio/paginação, 16/16 integração com PostgreSQL, `npm run build` e smoke E2E Playwright aprovados**, [execução do CI](https://github.com/neoonzy/cincoders_matricula/actions/runs/45096902829). Repositório GitHub não substitui GitLab do CIn.
