# Trama — Sistema de Matrícula

Teste prático nº 5/2026 · Bolsa de Inovação Tecnológica em Engenharia de Software · CIn/UFPE.

Aplicação web acadêmica com dois perfis: **aluno** (ofertas, matrícula, cancelamento, progresso e planejamento) e **secretaria** (disciplinas, professores, turmas e capacidade). O projeto preserva as **13 regras obrigatórias do edital** e especifica dois adicionais voluntários: **pré-requisitos** e **planejamento de matrícula com projeção curricular**.

> **Estado de verificação neste pacote:** código-fonte de API e interface implementados, testes unitários e de paginação executados com sucesso (16/16), sintaxe de `.mjs` e parsing de `.jsx` verificados. Integração com PostgreSQL, build Vite e smoke E2E estão preparados, mas **não foram executados neste ambiente**, pois faltam acesso ao registro npm, Docker/PostgreSQL e navegação Chromium local. Não interpretar o código como entrega validada de ponta a ponta antes dos passos de verificação abaixo.

## Requisitos locais

- Node.js **22 ou superior** e npm;
- PostgreSQL **16** (com Docker Compose ou instalação própria);
- Internet apenas na instalação das dependências npm;
- Navegador moderno.

## Executar do zero

```bash
# a partir da raiz do repositório
cp .env.example .env
# Troque SESSION_SECRET no .env por uma chave aleatória, com pelo menos 32 caracteres.
npm install --no-audit --no-fund

docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

Abra **http://127.0.0.1:5173**. O front-end Vite encaminha `/api` para `http://127.0.0.1:3333`, evitando CORS e permitindo cookie HttpOnly de mesmo domínio.

Se não tiver Docker, crie um banco PostgreSQL manualmente e altere `DATABASE_URL` no `.env` antes de executar a migração e o seed. **Não rode o seed em base de produção.**

### Contas fictícias (ambiente de desenvolvimento)

| Nome de usuário | Perfil | Senha |
|---|---|---|
| `secretaria` | Secretaria | `Teste@2026` |
| `ana.si` | Aluno de Sistemas de Informação | `Teste@2026` |
| `bruno.ec` | Aluno de Engenharia da Computação | `Teste@2026` |
| `carla.ec` | Aluno de Engenharia da Computação | `Teste@2026` |

O seed é **idempotente**: insere registros conhecidos com `ON CONFLICT DO NOTHING`, sem apagar mudanças feitas na aplicação. Para reiniciar os dados de demonstração, reinicie o volume **somente se for banco de desenvolvimento** (`docker compose down -v`) e execute o setup novamente.

## O que a aplicação implementa no código

**Aluno**: login e autorização; consulta de ofertas com busca/paginação na URL; classificação curricular por curso; verificação de vagas, aprovações e pré-requisitos; matrícula individual e cancelamento; progresso nas três categorias; plano persistido com itens viáveis/impedidos e projeção de CH sem reservar vagas.

**Secretaria**: cadastro e edição de disciplinas com validação de código/CH; listagem e cadastro de professores; abertura de turmas, listagem de capacidade/ocupação e alteração de vagas com proteção contra redução inferior à ocupação.

**Servidor**: cookie de sessão HttpOnly, SameSite=Lax, expiração de 8 horas, HMAC, senha com scrypt e sal individual; perfis autorizados no back-end; formato de erros consistente; validação de entrada pelo Fastify; transações PostgreSQL com locks para matrícula/cancelamento/alteração de capacidade; comparação de origem para chamadas mutáveis em navegadores. O limite de tentativas de login é local ao processo (suficiente apenas para demonstração).

**Requisitos adicionais**: pré-requisitos são definidos no seed, sem tela de CRUD adicional; o plano é uma seleção exploratória individual, não tem reserva, matrícula em lote nem múltiplos cenários.

## Testes

```bash
npm test                 # regras curriculares e paginação sem deps externas (16 testes)
npm run build            # build de produção React/Vite (após npm install)
```

Para executar testes HTTP e PostgreSQL com limpeza de tabelas, **use banco exclusivo de testes**:

```bash
# crie matricula_test no PostgreSQL separadamente e exporte:
export TEST_DATABASE_URL=postgres://matricula:matricula@localhost:5432/matricula_test
npm run test:integration
```

O script de integração **recusa executar limpeza em DATABASE_URL**: exige `TEST_DATABASE_URL`. A opção `--env-file-if-exists` (Node 22) permite rodar com `.env` local ou com variáveis injetadas pelo CI, sem precisar versionar segredos. O navegador deve poder acessar a aplicação para o smoke:

```bash
python scripts/smoke_browser.py
```

Esse smoke verifica login, navegação nas áreas do aluno e overflow horizontal em viewport **360px**. Um workflow GitHub Actions em `.github/workflows/ci.yml` verifica regras, integração PostgreSQL e build quando o ambiente de execução disponibilizar as dependências. A matriz ampliada com 77 cenários planejados está em `docs/03-PLANO-DE-TESTES.md`; **não** é correto afirmar que todos foram automatizados ou executados.

## Arquitetura

```text
apps/
  api/
    sql/001_init.sql      # schema relacional e restrições
    scripts/              # migração e dados fictícios
    src/app.mjs           # HTTP, validação, auth e tratamento de erros
    src/services.mjs      # casos de uso e transações
    src/security.mjs      # sessão e hashing
    test/                 # testes de API + PostgreSQL
  web/
    src/main.jsx          # rotas, login e guards
    src/student/          # ofertas, matrículas, progresso e planejamento
    src/secretary/        # disciplinas, professores e turmas
    src/student.jsx       # exports das jornadas do aluno
    src/secretary.jsx     # exports das jornadas da secretaria
    src/components.jsx    # componentes e layouts reutilizáveis
    src/styles.css        # tokens e responsividade
packages/
  domain/
    src/index.mjs         # funções puras curriculares e validações
    test/                 # Node test runner, sem framework de testes adicional
docs/                    # requisitos, ADRs, fluxos, testes, design
```

A escolha deliberada é **JavaScript moderno com módulos ESM e JSDoc**, em vez de TypeScript com etapa de compilação. Isso diminui dependências de build do servidor e permite testar o domínio diretamente com `node --test`; o edital permite JavaScript ou TypeScript. Trade-off: algumas incoerências de contrato entre API e interface seriam capturadas mais cedo com TypeScript compartilhado — evolução recomendada antes de expansão do sistema.

### Consistência de vagas

- O servidor bloqueia primeiro a linha do estudante e depois a linha da turma (`SELECT … FOR UPDATE`).
- **Após adquirir o lock da turma**, uma segunda instrução consulta ocupação atual. Isso evita usar um snapshot anterior ao desbloqueio da linha sob `READ COMMITTED`.
- A verificação de aprovação, duplicidade, pré-requisito, criação/reativação e limpeza do item planejado ocorrem na mesma transação.
- O planejamento não cria matrícula nem modifica ocupação ou progresso oficial.
- Quando uma matrícula é cancelada, muda `ATIVA` para `CANCELADA`, preservando seu registro.

### Regras de CH

- Para o progresso real, **somente aprovações anteriores** integralizam CH. Matrículas ativas permanecem na coluna `emCurso`.
- A classificação é definida pelo par curso/disciplina, não por um atributo global da disciplina.
- Excedente de eletivas de perfil é transferido para livres.
- Na simulação, a alocação de CH é sequencial: **aprovada → em curso → planejada elegível**.
- Percentuais são limitados a 100% e a CH faltante nunca fica negativa.

## Contratos HTTP

Todos sob `/api`. O front não envia `alunoId`; ele é determinado pelo usuário autenticado.

| Método | Rota | Perfil |
|---|---|---|
| POST | `/auth/login` | Público |
| GET/POST | `/auth/me`, `/auth/logout` | Autenticado |
| GET/POST | `/disciplinas` | Secretaria |
| PATCH | `/disciplinas/:id` | Secretaria |
| GET/POST | `/professores` | Secretaria |
| GET/POST | `/turmas` | Secretaria |
| PATCH | `/turmas/:id/vagas` | Secretaria |
| GET | `/secretaria/referencias` | Secretaria |
| GET | `/aluno/ofertas?q=&page=&limit=` | Aluno |
| GET/POST | `/aluno/matriculas` | Aluno |
| DELETE | `/aluno/matriculas/:id` | Aluno |
| GET | `/aluno/progresso` | Aluno |
| GET/DELETE | `/aluno/plano` | Aluno |
| POST | `/aluno/plano/itens` | Aluno |
| DELETE | `/aluno/plano/itens/:id` | Aluno |
| GET | `/health` | Público |

Entrada exemplo de matrícula: `POST /api/aluno/matriculas` com `{ "turmaId": "IF102-A" }`.

Respostas de erro seguem o padrão:

```json
{"error":{"code":"PRE_REQUISITO_PENDENTE","message":"Você precisa concluir os pré-requisitos antes da matrícula.","details":{"pendentes":["IF102"]}}}
```

Códigos: `400` estrutura inválida; `401` sessão inválida; `403` sem permissão; `404` não encontrado ou pertencente a outro aluno; `409` regra de negócio; `422` dados semanticamente inválidos; `201` criação; `204` cancelamento/remoção.

## Decisões, limites e próximos incrementos

Consultar `docs/05-DECISOES-E-IMPLEMENTACAO.md` e `docs/06-DESIGN-SYSTEM.md`. Os quatro arquivos originais de planejamento foram preservados.

**Com mais tempo**: suíte E2E automatizada integrada ao CI, contrato compartilhado tipado, acessibilidade auditada por ferramentas automatizadas e usuários, suporte transacional a múltiplas condições de matrícula, atualização segura do snapshot histórico de CH, revogação de sessão no servidor, migrações incrementais versionadas, observabilidade e testes de carga. Não há integração com SIGAA, outros semestres, horários ou lista de espera.

## Correções após auditoria de 22/11/2026

- O CI e os scripts aceitam variáveis de ambiente sem exigir o arquivo `.env` (Node 22).
- Páginas fora do intervalo são normalizadas para a última página válida, sincronizando a URL.
- Ofertas indicam turmas já incluídas no planejamento e previnem inclusões repetidas.
- Planejamento distingue CH selecionada, CH elegível e CH impedida, sem confundir simulação com matrícula.
- Melhoria de contraste e uso intencional de fontes de sistema; preferência por movimento reduzido respeitada.
- Os testes de integração agora cobrem também redução de capacidade **abaixo de 2 matrículas ativas**, unicidade de e-mail e autorização.
- Foi adicionado workflow de verificação no GitHub, além do `.gitlab-ci.yml` exigido para o GitLab do CIn.

**Limitações verificadas:** sem acesso ao registro npm neste container, o lockfile ainda não pôde ser gerado de modo confiável. O CI utiliza `npm install` até que `npm install --package-lock-only` seja executado em ambiente com acesso à rede; após commitar o lockfile, substituir por `npm ci`. Não declarar compilação, integração ou E2E aprovados sem os respectivos logs.

## Entrega do processo seletivo

O edital pede monorepo em **repositório pessoal no GitLab do CIn**, compartilhado com **`selecaogersist`** antes do prazo, além de commits distribuídos. Este pacote contém **código-fonte local**; o histórico de commits também é fornecido em um Git bundle separado, mas **não foi publicado no GitLab**. É preciso criar o repositório pessoal, enviar o histórico e conferir o compartilhamento/acesso. Não substitua o repositório da seleção por uma URL do GitHub.

> Este sistema é demonstrativo. A identidade gráfica "Trama" e os dados fictícios não são serviços oficiais da UFPE. Não reutilizar credenciais do seed em produção.
