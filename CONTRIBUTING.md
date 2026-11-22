# Guia de contribuição

1. Consulte o edital e `docs/01-REQUISITOS.md`; não transforme políticas [D] em requisitos oficiais sem anotá-las.
2. Implemente uma regra curricular em `packages/domain` quando não depender de HTTP/SQL.
3. Mantenha todo acesso ao banco transacional relevante em `apps/api/src/services.mjs`, com parâmetros SQL; nunca confie no `alunoId` do navegador.
4. Adicione um caso automatizado positivo, um negativo e um limite para regras de matrícula/CH.
5. Trate sucesso, falha e carregamento nas interfaces sem perder o contexto do usuário.
6. Rode `npm test`, `npm run test:integration` em base exclusiva, `npm run build` e smoke 360px.
7. Commits sugeridos: `feat(domain): ...`, `feat(api): ...`, `feat(web): ...`, `test: ...`, `docs: ...`.
