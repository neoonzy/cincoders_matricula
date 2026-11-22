# Especificação de requisitos — Sistema de Matrícula

**Projeto:** Teste Prático nº 5/2026 — Bolsa de Inovação Tecnológica em Engenharia de Software — CIn/UFPE  
**Versão:** 2.0 — dois diferenciais especificados (planejamento pré-implementação)  
**Fonte primária:** `Seleção Nº 5_2026 - Teste Prático Sistema de Matrícula.pdf` (6 páginas).  
**Convenção:** **[E]** exigência textual do enunciado; **[D]** decisão de projeto sugerida; **[A]** hipótese para esclarecer/documentar. Nenhuma decisão ou hipótese deve ser apresentada como exigência do edital.

## 1. Objetivo, atores e fronteira do sistema

Construir uma aplicação web com front-end e back-end para a secretaria administrar disciplinas, docentes e ofertas de turmas; e para alunos matricularem-se em turmas do semestre corrente, cancelarem suas matrículas e acompanharem a integralização da carga horária curricular. [E]

**Atores**
- **Secretaria de Graduação:** cadastra/edita disciplinas; cadastra professores; abre turmas; altera número de vagas; consulta dados de oferta. [E]
- **Aluno:** consulta turmas, matricula-se, cancela as próprias matrículas e consulta seu progresso acadêmico. [E]

**Incluído:** autenticação por nome de usuário; autorização por perfil; consultas com busca/paginação requeridas; dados iniciais; regras de carga horária; testes; **pelo menos um requisito adicional**; documentação; monorepo. [E] **Decisão adotada:** implementar dois adicionais: pré-requisitos e planejamento de matrícula [D].

**Fora do escopo:** cadastro por tela de cursos, alunos, estruturas curriculares e históricos; múltiplos semestres correntes; turmas de períodos passados. [E] Como decisão de escopo [D], ficam de fora emissão de comprovantes oficiais, boletos, notas e frequências, calendário acadêmico, horários, aprovação automática ao fim do período e integrações SIGAA.

## 2. Glossário de domínio

| Termo | Definição operacional |
|---|---|
| Curso | Curso ao qual o aluno pertence, com mínimos de CH por três grupos. |
| Disciplina | Unidade acadêmica identificada por código único e CH. |
| Estrutura curricular | Associação curso–disciplina, classificada obrigatória ou eletiva de perfil. |
| Eletiva livre | Disciplina ausente da estrutura curricular do curso do aluno; também recebe o excedente de CH aprovada de eletivas de perfil. |
| Turma | Oferta de uma disciplina no semestre corrente, com professor e capacidade total. |
| Matrícula | Associação de aluno a turma atual; `ATIVA` até cancelamento. |
| Histórico | Ocorrência de disciplina cursada anteriormente, com `APROVADO` ou `REPROVADO`. |
| CH integralizada | Carga horária proveniente **somente** de aprovações no histórico. |
| CH em curso | Carga horária das matrículas atualmente ativas; não soma à integralizada. |
| Vaga disponível | `capacidade_total - quantidade_de_matriculas_ativas`. |
| Pré-requisito | Disciplina cuja **aprovação anterior no histórico** é exigida para cursar outra disciplina. [D] |
| Plano de matrícula | Seleção persistente de turmas para simulação; **não é matrícula**, não ocupa vagas e não assegura disponibilidade. [D] |
| Elegibilidade de oferta | Avaliação atual de impedimentos: vagas, aprovação anterior, matrícula ativa e pré-requisitos. [D] |
| CH planejada elegível | CH das turmas selecionadas sem impedimentos **na consulta atual**; usada apenas na projeção hipotética. [D] |

## 3. Requisitos funcionais (RF)

| ID | Requisito | Perfil | Prioridade | Aceite mínimo |
|---|---|---|---|---|
| RF-01 | Fazer login com nome de usuário; senha é opcional no edital. | Ambos | P0 | Usuário válido autentica; inválido recebe erro claro. |
| RF-02 | Redirecionar ao espaço do perfil, negar acesso ao outro perfil e retornar ao login após expiração. | Ambos | P0 | Rotas e API negam acessos indevidos; sessão expirada gera redirecionamento. |
| RF-03 | Listar disciplinas com **busca e paginação**. | Secretaria | P1 | Busca e página alteram conteúdo e aparecem na URL. |
| RF-04 | Cadastrar disciplina. | Secretaria | P1 | Código único e CH válida. |
| RF-05 | Editar disciplina. | Secretaria | P1 | Mesmas validações de criação; mudanças persistem. |
| RF-06 | Listar professores. | Secretaria | P1 | Exibe docentes previamente cadastrados. |
| RF-07 | Cadastrar professor. | Secretaria | P1 | Rejeita e-mail duplicado. |
| RF-08 | Listar turmas mostrando vagas ocupadas e totais. | Secretaria | P1 | Ocupação considera apenas matrículas ativas. |
| RF-09 | Abrir turma com disciplina, professor e capacidade. | Secretaria | P1 | Exige capacidade >= 1. |
| RF-10 | Alterar capacidade total de turma. | Secretaria | P1 | Não aceita capacidade inferior à ocupação ativa. |
| RF-11 | Consultar ofertas com **busca e paginação**, vagas disponíveis, classificação por curso e ação de matrícula. | Aluno | P0 | A mesma disciplina pode receber classificação diferente conforme aluno. |
| RF-12 | Matricular-se em turma atual elegível. | Aluno | P0 | Vaga consumida uma única vez e recusas justificadas. |
| RF-13 | Listar apenas as próprias matrículas ativas. | Aluno | P0 | Dados de outros alunos não ficam expostos. |
| RF-14 | Cancelar uma das próprias matrículas ativas. | Aluno | P0 | Ela deixa a lista e a vaga é liberada. |
| RF-15 | Ver progresso por três grupos: CH exigida, integralizada, em curso e faltante. | Aluno | P0 | Regras de transferência de excedente, reprovação e limites aplicadas. |
| RF-16 | Refletir busca e página atual na URL de listagens pesquisáveis/paginadas. | Ambos | P0/P1 | Reload e navegação voltar/avançar preservam filtros. |
| RF-17 | Tratar carregamento, lista vazia, busca sem resultados, erro do servidor e tentativas de novo; apresentar mensagens de recusa. | Ambos | P0/P1 | Cada estado tem tratamento verificável. |
| RF-18 | Preparar dados iniciais: >=2 cursos que compartilham disciplinas com classificações diferentes; secretaria; alunos dos dois cursos com aprovações e reprovações. | Sistema | P0 | Seed repetível e demonstrável. |
| RF-19 | Documentar API/rotas. | Sistema | P0 | README ou OpenAPI descreve contratos. |
| RF-20 | **Pré-requisitos:** consultar exigências e bloquear matrícula sem aprovações anteriores necessárias. [D] | Aluno | P2 | API informa pendências; matrícula realmente bloqueada; interface explica; testes cobrem aprovação/reprovação/em curso. |
| RF-21 | **Planejamento:** selecionar e remover turmas, persistir plano, visualizar impedimentos e projetar progresso sem efetivar matrícula. [D] | Aluno | P3 | Plano só do aluno; não ocupa vagas; projeção separada da situação real; matrícula individual revalidada na API. |

> **Observação:** P0/P1/P2/P3 são nossas prioridades de execução, não nomenclatura do edital. O edital exige **um requisito adicional**, não dois: RF-20 e RF-21 são decisões voluntárias e **nunca devem prejudicar** o núcleo obrigatório e os testes. A página 6 prioriza login + fluxo aluno + testes; secretaria; requisito adicional.

## 4. Regras de negócio obrigatórias (RN)

IDs correspondem à numeração **1–13** do enunciado.

| ID | Regra, tal como solicitada | Critérios de aceitação verificáveis |
|---|---|---|
| RN-01 | Código da disciplina é único. | Duas disciplinas não podem usar mesmo código; edição também valida. |
| RN-02 | CH da disciplina é múltiplo de 15 entre 15h e 120h. | Aceitar 15/30/45/.../120; recusar 0, 14, 16, 121. |
| RN-03 | E-mail de professor é único. | Duplicata não persiste, nem em chamadas concorrentes. |
| RN-04 | Turma exige disciplina, professor e ao menos 1 vaga. | FKs válidas e capacidade inteira >=1. |
| RN-05 | Alteração de vagas não pode cair abaixo dos matriculados. | Ocupação 3: aceita 3 ou mais, recusa 2 ou menos. |
| RN-06 | Matrícula em turma lotada é proibida. | Última vaga é concedida só a uma solicitação; excesso recebe 409. |
| RN-07 | Aprovado na disciplina não pode cursá-la; reprovado pode. | Aprovado bloqueado; reprovado liberado, sujeito às demais regras. |
| RN-08 | Aluno pode cancelar matrícula ativa própria; vaga é liberada. | Cancela persistindo estado e reduzindo contagem ativa. |
| RN-09 | Aluno só vê/altera as próprias matrículas. | Não aceita alunoId arbitrário; outro proprietário é recusado. |
| RN-10 | Classificação é relativa ao curso: obrigatória, perfil ou livre. | Código compartilhado recebe classificações distintas conforme estrutura. |
| RN-11 | Excedente de CH eletiva de perfil conta como livre. | Perfil aprovado 90h/exigido 60h => perfil 60h, livre +30h. |
| RN-12 | Só aprovações contam como integralizadas; matrículas ativas são CH em curso separada. | Reprovada não soma; ativa não aparece como aprovada. |
| RN-13 | Percentual por grupo limitado a 100% e CH faltante não negativa. | Exigido 60h/aprovado 90h => 100% e falta 0h. |

### 4.1. Definição de cálculo de progresso [D]

Para cada aluno, classificar cada disciplina **em relação ao curso do próprio aluno**. Para **aprovadas** no histórico:

- `O = soma(CH aprovadas obrigatórias)`
- `P = soma(CH aprovadas de perfil)`
- `L = soma(CH aprovadas que não estão na estrutura curricular)`
- `excedentePerfil = max(0, P - exigidoPerfil)`
- `integralizadaObrigatoria = O`
- `integralizadaPerfil = min(P, exigidoPerfil)`
- `integralizadaLivre = L + excedentePerfil`
- para cada grupo `g`: `falta[g] = max(0, exigido[g] - integralizada[g])`
- para cada grupo `g` com exigência >0: `percentual[g] = min(100, 100 * integralizada[g]/exigido[g])`

**Regra de apresentação:** `integralizada` pode ultrapassar o mínimo do grupo obrigatório ou livre; apenas **percentual** é limitado a 100% e **falta** não pode ser negativa. [D] Se mínimo de determinado grupo for 0, apresentar 100% e falta 0, evitando divisão por zero. [A/D]

**CH em curso:** calcular independentemente das aprovações. Disciplinas obrigatórias em curso ficam em obrigatórias; livres em curso ficam em livres. Para eletivas de perfil em curso, reservar primeiro o espaço ainda não cumprido de perfil (`max(0, exigidoPerfil - integralizadaPerfil)`), e atribuir o eventual excedente à coluna **em curso** das eletivas livres. Isso não transforma matrícula ativa em aprovação. [D, interpretação explícita de RN-11 e RN-12]

**Exemplo verificável:** exigido (obrigatória=120, perfil=60, livre=90); aprovada obrigatória de 60h; duas aprovadas de perfil de 60h cada; uma reprovada de 60h. Resultado: obrigatórias `60/120`, perfil `60/60`, livres `60/90`, faltantes `60/0/30` e reprovação soma `0`.

## 5. Requisitos não funcionais e restrições (RNF)

| ID | Requisito/condição | Origem | Verificação |
|---|---|---|---|
| RNF-01 | Front-end em React. | [E] | `apps/web` usa React. |
| RNF-02 | Back-end em framework JavaScript/TypeScript. | [E] | `apps/api` usa Fastify/Express/Nest etc. |
| RNF-03 | Banco livremente escolhido. | [E] | Persistência configurada e documentada. |
| RNF-04 | Área do aluno opera a partir de **360px** de largura. | [E] | Teste manual/automatizado em viewport 360px sem overflow horizontal. |
| RNF-05 | Área da secretaria precisa funcionar em desktop. | [E] | Fluxos completos em viewport desktop. |
| RNF-06 | Validações e erros consistentes; uso adequado do HTTP; cuidados básicos de segurança. | [E] | 400/401/403/404/409/422 coerentes; não confiar no front-end. |
| RNF-07 | Testes automatizados reais para regras de negócio. | [E] | Suite testa casos positivos, negativos e limites. |
| RNF-08 | Código organizado, legível, responsabilidades separadas e sem complexidade desnecessária. | [E] | Camadas organizadas; handlers não implementam regras diretamente. |
| RNF-09 | Monorepo pessoal no GitLab do CIn, compartilhado com `selecaogersist` antes do prazo. | [E] | URL do repo e acesso verificados. |
| RNF-10 | Commits distribuídos pelo desenvolvimento. | [E] | Histórico apresenta etapas pequenas e inteligíveis. |
| RNF-11 | README com setup do zero, seed, decisões, extra e trabalho futuro. | [E] | Outro desenvolvedor sobe o projeto apenas com README. |
| RNF-12 | Enunciado permite consultar IA e referências; candidato deve entender o código. | [E] | Consegue explicar e modificar uma regra na entrevista. |
| RNF-13 | Controle transacional de vagas sob concorrência. | [D] | Dois alunos simultâneos não ocupam uma única vaga. |
| RNF-14 | Normalização de identificadores textuais (código/e-mail/username). | [D] | Unicidade permanece consistente após trim/case. |

## 6. Histórias de usuário + critérios de aceite

**HU-01 — Login.** Como usuário, quero entrar com minha conta para acessar apenas as operações permitidas. **Dado** uma conta válida, **quando** faço login, **então** entro na área do meu perfil. **Dada** sessão expirada, **quando** faço requisição, **então** volto ao login. **Dado** aluno, **quando** tento rota da secretaria, **então** recebo acesso negado inclusive pela API.

**HU-02 — Publicar oferta.** Como secretaria, quero cadastrar disciplina, professor e turma com vagas para disponibilizá-la aos alunos. **Dada** CH inválida, **quando** salvo disciplina, **então** o sistema recusa. **Dada** turma ocupada por 3, **quando** reduzo capacidade a 2, **então** recusa sem alterar dados.

**HU-03 — Consultar ofertas.** Como aluno, quero pesquisar turmas e saber quantas vagas restam e a qual grupo curricular elas pertencem. **Dada** disciplina compartilhada, **quando** alunos de cursos diferentes consultam a mesma turma, **então** a classificação pode ser diferente. **Quando** altero busca/página, **então** a URL reflete a mudança.

**HU-04 — Matricular-se.** Como aluno, quero garantir vaga em uma oferta válida. **Dada** turma com 1 vaga livre, **quando** dois alunos solicitam simultaneamente, **então** apenas um é matriculado. **Dada** disciplina já aprovada, **quando** tento matrícula, **então** recebo recusa específica. **Dada** reprovação anterior sem aprovação posterior, **quando** tento, **então** não sou bloqueado por esse histórico.

**HU-05 — Cancelar matrícula.** Como aluno, quero liberar minha vaga. **Dada** uma matrícula ativa minha, **quando** cancelo, **então** ela deixa a lista ativa e uma vaga reaparece. **Dada** matrícula de outra pessoa, **quando** tento cancelar, **então** nenhuma alteração ocorre.

**HU-06 — Acompanhar progresso.** Como aluno, quero ver CH exigida, aprovada, em curso e faltante por categoria. **Dado** excesso aprovado de perfil, **quando** consulto progresso, **então** o excedente aparece em livres. **Dada** reprovação, **então** não gera CH integralizada. **Dado** excesso em qualquer grupo, **então** porcentagem não ultrapassa 100% e a falta não fica negativa.

## 7. Políticas propostas e ambiguidades a registrar (não estão explícitas no PDF)

| ID | Questão em aberto | Política sugerida para a implementação |
|---|---|---|
| PD-01 | Matrícula ativa duplicada na **mesma disciplina** em turmas distintas. | Bloquear para o mesmo aluno no semestre; documentar como prevenção de duplicidade. |
| PD-02 | Matrícula cancelada pode ser refeita? | Sim, se houver vaga e outras regras forem satisfeitas. |
| PD-03 | Histórico pode conter múltiplas tentativas de mesma disciplina? | Sim; computar uma aprovação por disciplina no progresso, nunca dobrar CH. |
| PD-04 | Alterar CH de disciplina com histórico existente muda progresso? | MVP usa CH atual de `disciplina`; registrar limitação e discutir possibilidade de snapshot de CH. |
| PD-05 | Como classificar CH **em curso** de perfil excedente? | Alocar primeiro no espaço de perfil remanescente, depois em livre; mostrar em curso separadamente. |
| PD-06 | Como calcular percentual quando CH mínima é 0? | Apresentar 100% e 0h faltante (ou indicar não aplicável; escolher e documentar). |
| PD-07 | Busca/paginação sem especificação de tamanho/ordem. | `page=1`, `limit=10`; ordenação estável por código/nome, com limites validados. |
| PD-08 | Como normalizar unicidade. | Código uppercase + trim; e-mail lowercase + trim; username lowercase + trim. |
| PD-09 | Senha opcional. | Implementar senha em vez de entrada só por username; contas de demonstração via seed. |

**Importante:** se o tempo ficar curto, não comprometer RF-01/02/11–15 e RN-01–13 para desenvolver PDs menos relevantes ou extras. Sequência de corte: núcleo P0 → secretaria P1 → pré-requisitos P2 → planejamento P3.

## 8. Requisitos adicionais integrados — decisão voluntária [D]

O edital pede **um** adicional funcional do back-end ao front-end. Estamos deliberadamente especificando **dois**, ligados entre si. Ambos devem ser explicados no README, e cada um só é considerado entregue com API, interface e testes automatizados adequados.

### 8.1. RF-20 — Pré-requisitos

**Objetivo:** impedir matrículas para as quais o estudante ainda não concluiu disciplinas exigidas, com retorno explicativo.

| ID | Regra adicional definida por nós | Critério de aceitação |
|---|---|---|
| PRE-01 | Uma disciplina pode exigir zero, uma ou várias outras disciplinas. | Todas as exigências estão associadas por `disciplinaId` e disponíveis na API. |
| PRE-02 | **Todos** os pré-requisitos precisam ter aprovação registrada no histórico anterior. | Reprovação, ausência e matrícula ativa **não** satisfazem pré-requisito. |
| PRE-03 | A validação ocorre no **servidor no instante da matrícula**, inclusive se a oferta apareceu antes como elegível. | POST recusa com 409 e lista dos códigos pendentes. |
| PRE-04 | A relação não pode apontar para a própria disciplina, repetir o mesmo par ou formar ciclos. | Seed/serviço rejeita relação inválida antes da inserção; unicidade no banco. |
| PRE-05 | A interface apresenta pré-requisitos e distingue `cumprido` de `pendente`. | O aluno entende o bloqueio antes de tentar matrícula. |
| PRE-06 | O requisito só adiciona condição à matrícula, não altera histórico, classificação ou progresso real. | Aluno elegível continua submetido às outras RN (vaga, aprovado, duplicidade). |

**Exemplo do seed:** `IF106 Sistemas Embarcados` exige `IF102 Estruturas de Dados`. Ana (apenas reprovou IF102) fica bloqueada; Bruno (aprovado em IF102) pode solicitar IF106, se houver vaga. Não haverá CRUD de pré-requisitos pela secretaria neste MVP: configuração via seed [D].

### 8.2. RF-21 — Planejamento de matrícula

**Objetivo:** permitir comparar um conjunto de ofertas e visualizar seu efeito **hipotético** na conclusão do curso, mantendo absolutamente distinta a situação acadêmica oficial.

| ID | Regra adicional definida por nós | Critério de aceitação |
|---|---|---|
| PLAN-01 | Cada aluno tem uma seleção persistente de turmas do único semestre corrente. | Reabrir a sessão mantém os itens; outro aluno não os acessa. |
| PLAN-02 | Adicionar/remover/limpar plano **não** cria/cancela matrícula, não reserva vaga e não altera o progresso oficial. | Ocupação e `GET /aluno/progresso` permanecem iguais antes/depois. |
| PLAN-03 | Não permitir duas turmas da **mesma disciplina** no mesmo plano; recusar disciplinas já aprovadas ou com matrícula ativa ao tentar adicionar. | Solicitação inválida retorna erro específico; estado permanece consistente. |
| PLAN-04 | É possível adicionar ofertas lotadas ou com pré-requisito pendente **somente para explorar alternativas**. | Item fica no plano, com impedimentos explícitos, mas não entra na projeção viável. |
| PLAN-05 | A elegibilidade é recalculada ao consultar o plano; não é um status definitivo armazenado. | Se vaga acabar ou surgir, item muda de estado; planejamento não garante matrícula futura. |
| PLAN-06 | A visão apresenta `integralizada` (aprovações), `emCurso` (matrículas reais), `planejadaElegivel`, `planejadaImpedida` e `projetada` sem confundir categorias. | Somente itens elegíveis entram no cenário projetado; itens impedidos são listados à parte. |
| PLAN-07 | A simulação assume **hipoteticamente** aprovação futura de matrículas ativas e das turmas planejadas elegíveis; não altera histórico. | Há aviso visível e números reais idênticos ao progresso oficial. |
| PLAN-08 | O excedente de perfil é distribuído em ordem **aprovada → em curso → planejada elegível**, transferindo excedentes de cada etapa para livre, sem contar CH duas vezes. | Teste com perfil já completo: nova disciplina de perfil planejada contribui para livre, não excede 100% em perfil. |
| PLAN-09 | Percentuais projetados não excedem 100% e faltantes projetadas não são negativas. | Mesmo com CH planejada excessiva, percentuais são limitados. |
| PLAN-10 | A efetivação ocorre **por turma**, pelo endpoint oficial de matrícula; o servidor revalida vagas, pré-requisitos e demais regras. | Sucesso remove a disciplina do plano; falha mantém item e exibe motivo. |
| PLAN-11 | Nenhum ID de aluno vindo da UI determina a propriedade do plano. | Todos os endpoints usam aluno da sessão; outro perfil recebe 403. |
| PLAN-12 | MVP não oferece matrícula em lote, reserva, espera, múltiplos cenários ou edição do histórico. | Limites declarados no README, sem botões que prometam essas ações. |

**Cenário de aceite integrado A — Ana, SI:** progresso oficial do seed = obrigatória `60/120`, perfil `60/60`, livre `60/90`. Ela planeja `IF102` (obrigatória, 60h; elegível apesar de reprovação) e `IF105` (livre, 60h; se houver vaga). A projeção passa a `120/120`, `60/60`, `120/90`, com percentuais `100/100/100` e faltantes `0/0/0`. `IF106` pode aparecer no plano, mas fica **impedida** até aprovação em IF102; não contribui para a projeção. Nada muda no histórico ou nas vagas.

**Cenário de aceite integrado B — Bruno, EC:** tem IF102 e IF101 aprovadas. Pode planejar IF106, cujo pré-requisito já foi atendido. Como IF101 já preencheu a exigência de eletiva de perfil (60h), as 60h planejadas de IF106 entram, na projeção, como **livres por excedente de perfil**, desde que haja vaga e nenhum outro impedimento.

**Decisão de UX:** uma página `/aluno/planejamento` apresenta lista de turmas selecionadas, impedimentos, comparação **situação atual × projeção**, botão para retirar item e botão de matrícula individual se elegível. A página de ofertas ganha ação **Adicionar ao plano**. Mais detalhes, contratos e casos limites em `04-FUNCIONALIDADES-DIFERENCIAIS.md`.

## 9. Rastreabilidade — requisito → teste → camada

| Requisito | Evidências de teste planejadas | Onde implementar |
|---|---|---|
| RF-01/02 | T-AUTH-01..06 | sessão, guardas da API, roteamento web |
| RN-01/02, RF-03..05 | T-CAT-01..06 | schema + disciplinaService + formulários |
| RN-03, RF-06/07 | T-CAT-07..09 | schema + professorService |
| RN-04/05, RF-08..10 | T-TURMA-01..05 | turmaService + banco + secretaria web |
| RN-06/07, RF-11/12 | T-MAT-01..08 | matriculaService + ofertas web |
| RN-08/09, RF-13/14 | T-MAT-09..12 | matriculaService + minhas matrículas web |
| RN-10..13, RF-15 | T-PROG-01..10 | progressoService + progresso web |
| RF-16/17, RNF-04/05 | T-UI-01..08 | web + e2e |
| RF-18 | T-SEED-01..03 | seed e smoke test |
| RF-20 / PRE-01..06 | T-EXTRA-01..08 | preRequisitosService + matrícula + ofertas web |
| RF-21 / PLAN-01..12 | T-PLAN-01..16 | planoService + simulador de CH + planejamento web |

## 10. Critério de pronto por requisito (Definition of Done)

Um RF só está concluído quando: (1) o comportamento corresponde ao critério de aceite; (2) validação e autorização são feitas no servidor; (3) caso de erro é apresentado claramente na interface; (4) testes automáticos relevantes passam; (5) não há falhas perceptíveis no viewport exigido; (6) o README/API e um commit descrevem a alteração.

---

**Atenção à autoria:** este documento é uma proposta inicial de planejamento para estudo e execução. Antes de entregar, revisar decisões [D]/[A], validar todos os testes com o código existente e evitar afirmar que funcionalidades não implementadas estão prontas.
