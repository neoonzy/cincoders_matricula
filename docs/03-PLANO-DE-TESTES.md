# Plano de testes e matriz de cobertura — Sistema de Matrícula

**Objetivo:** provar os comportamentos pedidos pelo enunciado, não apenas a existência de rotas ou componentes. Cada cenário tem ID estável que pode ser referenciado em títulos `describe/it` e em revisões de código.

## 1. Ambiente e estratégia

- Testes unitários: Vitest, sem banco, para classificadores e calculadora CH.
- Testes integração: API Fastify com banco PostgreSQL temporário dedicado aos testes. Limpar estado entre casos; não usar banco de desenvolvimento ou produção.
- Testes UI: React Testing Library e navegação em React Router com URL realista.
- E2E: Playwright contra API+web com seed previsível, incluindo 360px.
- Regressão: rodar suite completa após ajustes em matrícula, vagas, currículo ou histórico.

**Convenção:** [E] exigência expressa do PDF; [D] decisão de implementação; prioridades P0 núcleo, P1 secretaria, P2 pré-requisitos, P3 planejamento (extras voluntários).

## 2. Autenticação e autorização

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-AUTH-01 | integração | RF-01 | secretaria faz login com credenciais válidas | sessão criada, perfil SECRETARIA retornado. |
| T-AUTH-02 | integração | RF-01 | usuário/senha inválidos | erro genérico seguro, nenhuma sessão. |
| T-AUTH-03 | integração | RF-02 | ALUNO tenta criar disciplina | HTTP 403; nenhuma alteração no banco. |
| T-AUTH-04 | integração | RF-02 | SECRETARIA tenta listar matrículas de aluno | HTTP 403. |
| T-AUTH-05 | integração + UI | RF-02 | requisição após expiração da sessão | HTTP 401 e UI redireciona para login. |
| T-AUTH-06 | e2e | RF-02 | login como cada perfil | navega à área certa; URL da outra área é bloqueada. |

## 3. Disciplinas e professores

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-CAT-01 | integração | RN-01, RF-04 | cadastrar disciplina com código já existente | 409 e sem duplicação. |
| T-CAT-02 | integração | RN-01, RF-05 | editar código para código já existente | 409 e valor original preservado. |
| T-CAT-03 | unitário+integração | RN-02 | CH 15, 30, 120 | aceitas. |
| T-CAT-04 | unitário+integração | RN-02 | CH 0, 14, 16, 121, negativa, decimal | recusadas; nenhuma gravação. |
| T-CAT-05 | integração | RF-03 | pesquisar pelo código/nome; navegar para página 2 | conteúdo filtrado, `total` e `page` corretos. |
| T-CAT-06 | integração | RF-05 | editar nome/CH válida | alterações persistem e são exibidas. |
| T-CAT-07 | integração | RN-03, RF-07 | criar professor com e-mail duplicado | 409; banco mantém único registro. |
| T-CAT-08 | integração | RN-03 | e-mail com maiúsculas/espaços de outro existente [D] | unicidade após normalização. |
| T-CAT-09 | integração | RF-06/07 | cadastrar docente e listar | docente consta na lista corretamente. |

## 4. Turmas e vagas

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-TURMA-01 | integração | RN-04, RF-09 | abrir turma com disciplina/professor existentes e capacidade 1 | criada com 0 ocupadas e 1 disponível. |
| T-TURMA-02 | integração | RN-04 | abrir turma sem professor/sem disciplina/capacidade 0 | erro de validação e não criada. |
| T-TURMA-03 | integração | RN-05 | turma com 3 ativas: reduzir capacidade de 5 para 3 | permitido. |
| T-TURMA-04 | integração | RN-05 | turma com 3 ativas: reduzir capacidade de 5 para 2 | 409 e capacidade continua 5. |
| T-TURMA-05 | integração | RF-08 | cancelar uma de 3 matrículas ativas | ocupadas vira 2; disponíveis sobe em 1. |

## 5. Matrícula e cancelamento

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-MAT-01 | integração | RN-06, RF-12 | turma já lotada | 409 `TURMA_LOTADA`, sem matrícula. |
| T-MAT-02 | integração concorrente | RN-06 | 2 alunos disputam última vaga | somente 1 sucesso; ocupação <= capacidade. |
| T-MAT-03 | integração | RN-07 | histórico contém `APROVADO` na disciplina | 409 `DISCIPLINA_APROVADA`. |
| T-MAT-04 | integração | RN-07 | histórico contém apenas `REPROVADO` | matrícula permitida se não houver outro impedimento. |
| T-MAT-05 | integração | PD-01 [D] | aluno tenta duas turmas da mesma disciplina simultaneamente | somente uma matrícula ativa. |
| T-MAT-06 | integração | PD-01 [D] | tentativa de matrícula repetida em turma já ativa | 409, sem ocupação duplicada. |
| T-MAT-07 | integração | RF-11 | consultar oferta disponível | vagas corretas e classificação do aluno. |
| T-MAT-08 | integração | RF-11 | buscar/paginar ofertas | filtros, página e metadados corretos. |
| T-MAT-09 | integração | RN-08 | aluno cancela matrícula própria ativa | estado `CANCELADA`; vaga liberada; 204. |
| T-MAT-10 | integração | RN-09 | aluno A tenta cancelar matrícula B | 404/403 conforme política, sem alteração. |
| T-MAT-11 | integração | RN-09, RF-13 | aluno A lista suas matrículas | lista só A e somente ativas; sem vazamento. |
| T-MAT-12 | integração | PD-02 [D] | cancelar e depois pedir nova vaga na mesma turma | reativa/cria corretamente se houver vaga. |

## 6. Progresso curricular

Usar função pura `calcularProgresso({ metas, estrutura, historico, matriculasAtivas })` e separar cenários por regra, com asserts numéricos exatos.

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-PROG-01 | unitário | RN-10 | IF101 em SI vs. EC (seed) | OBRIGATORIA em SI, PERFIL em EC. |
| T-PROG-02 | unitário | RN-10 | IF103 em EC sem relação curricular | LIVRE. |
| T-PROG-03 | unitário | RN-11 | exigido perfil 60h; aprovadas perfil 90h | 60h perfil integralizada; 30h adicionais em livre. |
| T-PROG-04 | unitário | RN-11 | exigido perfil 60h; aprovadas perfil 30h | 30h perfil; 0h de excedente em livre. |
| T-PROG-05 | unitário | RN-12 | apenas reprovação de 60h | 0h integralizada pela disciplina. |
| T-PROG-06 | unitário | RN-12 | matrícula ativa de 60h sem aprovação | 0h integralizada; 60h em curso na categoria. |
| T-PROG-07 | unitário | RN-13 | exigido livre 45h; integralizada livre 75h | percentual 100%, faltante 0h. |
| T-PROG-08 | unitário | RN-13 | exigido obrigatório 120h; aprovado 60h | percentual 50%, faltante 60h. |
| T-PROG-09 | integração | RF-15 | consultar progresso de Ana no seed | obrigatório 60/120, perfil 60/60, livre 60/90; faltam 60/0/30. |
| T-PROG-10 | unitário | PD-03/05 [D] | disciplina repetida aprovada e perfil em curso acima do mínimo | não duplica CH aprovada; excedente em curso classificado separadamente como livre. |

**Caso-limite adicional recomendado:** metas iguais a 0, ausência de registros, presença de CH obrigatório acima do mínimo e avanço maior que 100%. Obrigatórias excedentes **não** viram eletivas livres (transferência só existe para perfil).

## 7. Interface e responsividade

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-UI-01 | UI | RF-16 | alterar busca da lista de ofertas | `?q=...&page=1` refletido na URL. |
| T-UI-02 | UI | RF-16 | visitar diretamente URL com `?q=IF&page=2` | busca e página corretas após reload. |
| T-UI-03 | UI | RF-16 | clicar voltar no navegador | estado busca/página anterior restaurado. |
| T-UI-04 | UI | RF-17 | API pendente | carregamento visível e sem dados enganosos. |
| T-UI-05 | UI | RF-17 | lista vazia vs. busca sem resultado | mensagens distintas e adequadas. |
| T-UI-06 | UI | RF-17 | API indisponível e usuário clica "Tentar novamente" | nova requisição disparada; erros não silenciosos. |
| T-UI-07 | UI | RF-17 | matrícula recusada por lotação | erro específico exibido, oferta atualizada. |
| T-UI-08 | e2e | RNF-04 | área aluno em viewport 360px | ofertas/matrículas/progresso utilizáveis, sem overflow horizontal. |

**Verificação adicional manual:** secretaria em desktop, formulários acessíveis por teclado, labels e foco visível, mensagens não dependem apenas de cor.

## 8. Seed e pré-requisitos (RF-20)

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-SEED-01 | integração | RF-18 | carregar seed em banco vazio | dois cursos, classificações diferentes, secretaria, alunos e histórico presentes. |
| T-SEED-02 | integração | RF-18 | executar seed duas vezes | sem duplicação e com estado consistente. |
| T-SEED-03 | e2e | RF-18 | contas demo navegam e exibem histórico/progresso | dados permitem demonstração das 3 categorias e reprovação. |
| T-EXTRA-01 | unitário+integração | RF-20 [D] | pré-requisito aprovado | matrícula é permitida. |
| T-EXTRA-02 | unitário+integração | RF-20 [D] | pré-requisito só reprovado | matrícula bloqueada com erro específico. |
| T-EXTRA-03 | unitário+integração | RF-20 [D] | pré-requisito apenas em curso | matrícula bloqueada. |
| T-EXTRA-04 | integração | RF-20 [D] | dois pré-requisitos, apenas um aprovado | matrícula bloqueada; exige todos. |
| T-EXTRA-05 | UI | RF-20 [D] | oferta IF106 exige IF102 | UI mostra exigência e feedback consistente com API. |
| T-EXTRA-06 | integração | PRE-03 | oferta estava elegível, mas pré-requisito deixou de ser atendido ao matricular [cenário isolado] | validação reexecutada no POST; não confia na UI/cache. |
| T-EXTRA-07 | unitário/seed | PRE-04 | cadastrar auto-referência ou relação cíclica IF101→IF102→IF101 | carga/validação falha explicitamente sem gravar relação inválida. |
| T-EXTRA-08 | integração | PRE-03/06 | falta IF102 e turma IF106 tem vagas | 409 `PRE_REQUISITO_PENDENTE`, com `details.pendentes` e ocupação inalterada. |

## 9. Planejamento de matrícula (RF-21)

| ID | Nível | Requisitos | Cenário / entrada | Resultado esperado |
|---|---|---|---|---|
| T-PLAN-01 | integração | PLAN-01 | aluno adiciona IF102, sai e entra novamente | seleção persiste; nenhum outro aluno a visualiza. |
| T-PLAN-02 | integração | PLAN-02 | adicionar, remover e limpar plano | zero alterações em matrículas, ocupação, histórico e progresso real. |
| T-PLAN-03 | integração | PLAN-03 | tentar duas turmas de IF102 no mesmo plano | 409 `DISCIPLINA_JA_PLANEJADA`, uma seleção apenas. |
| T-PLAN-04 | integração | PLAN-03 | tentar planejar disciplina já aprovada ou já matriculada | 409 específico sem novo item. |
| T-PLAN-05 | integração/UI | PLAN-04 | adicionar IF106 com IF102 ainda não aprovada | item aparece marcado impedido por pré-requisito e CH não entra na projeção viável. |
| T-PLAN-06 | integração/UI | PLAN-04 | adicionar turma lotada | item permanece planejado, aviso de lotação; não entra na projeção viável. |
| T-PLAN-07 | integração | PLAN-05 | item elegível perde última vaga por matrícula de terceiro | nova consulta marca impedimento; nenhuma vaga reservada. |
| T-PLAN-08 | integração | PLAN-05 | terceiro cancela matrícula e libera vaga | plano volta a indicar elegível quando não há outros impedimentos. |
| T-PLAN-09 | unitário | PLAN-06/07 | histórico aprovado + matrícula ativa + plano elegível | três valores separados; integralizada original não muda; projetada soma cenário hipotético. |
| T-PLAN-10 | unitário | PLAN-08 | exigência perfil 60; aprovado perfil 30; ativa perfil 15; planejada elegível perfil 30 | perfil aprovada 30, emCurso 15, planejada 15, excedente planejado para livre 15; sem duplicidade. |
| T-PLAN-11 | unitário | PLAN-08 | Bruno EC já completou perfil 60 e planeja IF106 perfil 60 elegível | perfil projetado permanece 60 e 60h planejadas contribuem para livre. |
| T-PLAN-12 | unitário | PLAN-09 | CH planejada supera mínimas nos três grupos | percentuais projetados ≤100 e faltantes ≥0. |
| T-PLAN-13 | integração | PLAN-10 | efetivar matrícula de item do plano com vaga | POST matrícula cria 1 matrícula ativa, ocupa 1 vaga e remove item do plano atomicamente. |
| T-PLAN-14 | integração | PLAN-10 | tentar efetivar item cujo último assento foi tomado por terceiro | 409, nenhuma matrícula criada, plano permanece e mostra impedimento atualizado. |
| T-PLAN-15 | segurança | PLAN-11 | aluno tenta remover item de outro aluno; secretaria consulta plano | propriedade recusada sem vazamento; secretaria 403. |
| T-PLAN-16 | e2e/UI 360px | PLAN-01..12 | Ana adiciona IF102, IF105 e IF106, compara cenário, retira e efetiva uma matrícula | layout utilizável, status distintos, progresso real não muda até efetivar, nenhum overflow. |

**Cuidados de interpretação:** T-PLAN-10 é uma alocação entre colunas de *aprovação, CH em curso e CH planejada*. Apenas o percentual **projetado** agrega essas colunas; `integralizada` não aumenta. T-PLAN-13 deve validar o banco, não apenas usar um mock da UI.

## 10. Suíte mínima para garantir entrega (quando tempo apertar)

**Essenciais não negociáveis:** T-AUTH-01/03/05; T-MAT-01/02/03/04/09/10/11; T-PROG-01/02/03/05/06/07/09; T-UI-01/05/06/08; T-SEED-01. Isso cobre login, fluxo aluno, segurança, regra mais delicada do progresso, limite de vaga e interface do edital. Desenvolver o restante conforme evolução e prioridade, sem tratar a lista mínima como substituta da cobertura integral requerida.

## 11. Critérios de saída

- Todas as 13 RN obrigatórias têm pelo menos um teste automatizado associado e passando.
- Os cenários de concorrência e de autorização são executados contra API e banco reais.
- Login e todo fluxo aluno percorrem o sistema completo (web → API → banco).
- Nomes, codificação, mensagens e valores numéricos condizem com o que o usuário realmente vê.
- A área do aluno foi exercitada em viewport 360px.
- `build`, `test`, `migrate`, `seed` e inicialização do projeto funcionam a partir de instruções documentadas.
- RF-20 tem testes de pré-requisitos na API e UI; RF-21 tem testes de integridade do plano, projeção, propriedade e fluxo ponta a ponta **quando implementados**. Caso algum extra não seja entregue, README registra essa pendência sem alegar conclusão.
- Rastreabilidade planejada: **77 cenários** numerados (58 do plano original + 3 novos de pré-requisitos + 16 de planejamento); este número representa cenários especificados, **não testes já executados**.
