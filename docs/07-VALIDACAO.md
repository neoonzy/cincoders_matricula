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
