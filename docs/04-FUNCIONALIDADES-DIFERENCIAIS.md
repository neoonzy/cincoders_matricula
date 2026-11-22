# Requisitos diferenciais integrados — RF-20 e RF-21

**Status:** especificação de projeto, **não implementação**.  
**Origem:** o PDF da seleção exige um requisito extra à escolha do candidato, com implementação back-end + front-end e explicação no README. **Escolhemos dois**, voluntariamente: pré-requisitos e planejamento. O enunciado **não exige** esses dois específicos, nem exige simulação.

## 1. Problema e objetivo

- **Problema do aluno:** não basta saber quais disciplinas existem. É útil saber quais pode cursar **agora** e como diferentes escolhas podem afetar a integralização futura.
- **RF-20:** impedir matrícula sem pré-requisitos concluídos e expor os motivos da recusa.
- **RF-21:** permitir construir uma seleção persistente, incluindo alternativas ainda inviáveis, e comparar progresso **oficial** com **projeção hipotética**.
- **Regra inegociável:** plano != matrícula. Nenhuma ação de planejar reserva vaga, altera histórico ou transforma CH futura em CH aprovada.

## 2. Atores e jornada principal

1. Aluno entra e consulta ofertas com nome/código, CH, tipo curricular, vagas e requisitos.
2. Em cada oferta, há `Matricular-se` e `Adicionar ao plano`. O primeiro executa matrícula real; o segundo salva preferência sem ocupar vaga.
3. Na página `/aluno/planejamento`, o aluno vê sua seleção, status dinâmico e possíveis impedimentos por item.
4. A simulação exibe, **se todas as matrículas ativas e planejadas elegíveis fossem futuramente aprovadas**, os resultados por grupo; sem atualizar o progresso real.
5. Ao clicar `Matricular-se` num item elegível, o **mesmo** serviço transacional de matrícula valida tudo novamente. Vaga ou pré-requisito podem ter mudado.
6. Uma matrícula efetivada sai automaticamente do plano. Uma tentativa recusada permanece no plano com explicação.

## 3. Máquina de estados de uma seleção

`PLANEJADA` é apenas a existência da associação no banco. Ao ler:

- `ELEGIVEL_AGORA`: nenhuma pendência atual; **não é reserva nem garantia**;
- `IMPEDIDA`: contém `impedimentos[]` com uma ou mais causas, como `TURMA_LOTADA`, `PRE_REQUISITO_PENDENTE`, `DISCIPLINA_APROVADA` (se histórico mudar), `MATRICULA_ATIVA` (se estado mudar), etc.

Esses estados **não são persistidos**. A API os calcula a cada consulta. Um item pode ir de `ELEGIVEL_AGORA` para `IMPEDIDA` e vice-versa sem alterar `itens_plano`, conforme disponibilidade e dados acadêmicos.

**Validação na inclusão:** rejeitar disciplina já aprovada, já matriculada ou disciplina selecionada em outra turma; permitir incluir lotada ou com pré-requisito pendente **para explorar alternativas**. A possibilidade de continuar planejando não dá direito de efetivar matrícula.

## 4. Regras de pré-requisitos — tabela de decisão

| Histórico do aluno sobre IF102 | IF106 exige IF102 | Pode efetivar IF106? |
|---|---|---|
| Aprovado | Sim | Sim, se as demais RN permitirem |
| Apenas reprovado | Sim | **Não** |
| IF102 apenas matriculada agora | Sim | **Não** |
| Sem registro | Sim | **Não** |
| Aprovado e reprovado em tentativas diferentes | Sim | Sim (existe aprovação) |
| Aprovado em só 1 de 2 exigências | Sim | **Não** (exige todos) |

Pré-requisitos são associações do tipo `disciplina → disciplinaExigida`, com par único, sem auto-referência e sem ciclos. Para o MVP, o seed define as associações e deve validar os ciclos. Não é necessário CRUD adicional.

## 5. Definição da simulação e invariantes

### 5.1. Fontes de CH — sem mistura

- **Integralizada:** somente aprovações anteriores; comportamento do edital **inalterado**.
- **Em curso:** matrículas `ATIVA` do semestre; separadas da integralizada.
- **Planejada selecionada:** soma informativa de todas as seleções, inclusive impedidas (por categoria original, não equivale a CH conquistável).
- **Planejada elegível:** somente seleções sem impedimentos atuais; alimenta o cenário hipotético.
- **Projetada:** integralizada + em curso + planejada elegível **sob hipótese explícita de aprovação futura**; não altera CH real.

### 5.2. Classificação e transferência do excesso de perfil

Classificar cada disciplina conforme estrutura curricular **do aluno**: OBRIGATÓRIA, PERFIL ou LIVRE. Para CH PERFIL, alocar por estágio:

1. **Aprovadas:** preencher a exigência de perfil com aprovadas até o limite; excedente de aprovadas vai para livre **aprovada**.
2. **Ativas:** preencher o que restou no grupo perfil após as aprovadas; excedente vai para livre **em curso**.
3. **Planejadas elegíveis:** preencher o que restou no perfil depois de aprovadas + ativas; excedente vai para livre **planejada**.

Assim, se requisito perfil é `60h`, e o aluno tem `30h` aprovadas, `15h` em curso e `30h` planejadas elegíveis de perfil: `30h` aprovadas perfil, `15h` em curso perfil e `15h` planejadas perfil, com `15h` da etapa planejada classificada em livre. Nenhuma CH é contada duas vezes.

Percentual **real** continua calculado só sobre integralizada. Percentual **projetado** usa o total hipotético, limitado a 100%; faltantes projetadas usam `max(0, exigida - projetada)`.

### 5.3. Invariantes para teste

- `POST/DELETE plano` **nunca** muda matrícula, histórico, vagas ou progresso real.
- Uma disciplina só pode aparecer uma vez no plano do mesmo aluno, mesmo em turmas diferentes.
- Uma matrícula real bem-sucedida remove, na mesma transação, item planejado daquela disciplina; falha não remove.
- Uma vaga não pode ser ocupada apenas porque estava elegível na consulta anterior.
- Apenas disciplinas elegíveis entram na projeção; impedidas ficam identificadas no plano, sem gerar CH projetada.
- O aluno só pode ler/alterar seus próprios itens; secretaria não tem acesso à área de planejamento.

## 6. Contratos HTTP propostos

### GET /api/aluno/plano — 200 (esquema ilustrativo)

```json
{
  "itens": [
    {
      "id": "plan-1",
      "turmaId": "turma-if102",
      "disciplina": { "codigo": "IF102", "nome": "Estruturas de Dados", "ch": 60 },
      "classificacao": "OBRIGATORIA",
      "vagasDisponiveis": 2,
      "status": "ELEGIVEL_AGORA",
      "impedimentos": []
    },
    {
      "id": "plan-2",
      "turmaId": "turma-if106",
      "disciplina": { "codigo": "IF106", "nome": "Sistemas Embarcados", "ch": 60 },
      "classificacao": "LIVRE",
      "vagasDisponiveis": 3,
      "status": "IMPEDIDA",
      "impedimentos": [{ "code": "PRE_REQUISITO_PENDENTE", "disciplinas": ["IF102"] }]
    }
  ],
  "simulacao": {
    "hipotese": "aprovação futura das matrículas ativas e dos itens elegíveis do plano",
    "grupos": {
      "obrigatorias": {
        "exigida": 120, "integralizada": 60, "emCurso": 0,
        "planejadaElegivel": 60, "projetada": 120,
        "faltanteReal": 60, "faltanteProjetada": 0,
        "percentualReal": 50, "percentualProjetado": 100
      }
    },
    "chSelecionadaTotal": 120,
    "chSelecionadaImpedida": 60
  }
}
```

*Valores ilustrativos, não um contrato definitivo de formato/semântica; no código real, devolver também grupos de perfil e livres. A soma `chSelecionadaTotal` inclui as duas ofertas ilustrativas e `chSelecionadaImpedida` contabiliza a impedida.*

### Endpoints mutáveis

| Método e rota | Entrada | Sucesso | Erros esperados |
|---|---|---|---|
| `POST /api/aluno/plano/itens` | `{ "turmaId": "..." }` | 201 e item | 400/422 inválido, 403 papel, 404 turma, 409 aprovado/ativa/duplicada |
| `DELETE /api/aluno/plano/itens/:id` | ID de item próprio | 204 | 401, 403, 404 item ausente/alheio |
| `DELETE /api/aluno/plano` | sem corpo | 204 | 401, 403 |
| `POST /api/aluno/matriculas` | `{ "turmaId": "..." }` | 201 e matrícula; limpa plano da mesma disciplina | 409 turma lotada/pré-requisito pendente/duplicidade; 404 turma |

**Erro de matrícula com pré-requisitos:**

```json
{
  "error": {
    "code": "PRE_REQUISITO_PENDENTE",
    "message": "Conclua as disciplinas exigidas antes de se matricular.",
    "details": { "pendentes": ["IF102"] }
  }
}
```

## 7. Modelo e algoritmo de cálculo

- `pre_requisitos(disciplinaId, disciplinaExigidaId)`, par unique, FKs e validação de ciclo no seed.
- `itens_plano(id, alunoId, turmaId, criadoEm)`, unique `(alunoId,turmaId)`, FKs válidas. Não criar entidade `periodo`.
- Para impedir duas turmas da mesma disciplina no plano sem redundância de `disciplinaId`, bloquear a linha do aluno, consultar a disciplina de todas as turmas selecionadas e inserir só se inexistente. Aplicar mesmo lock em matrícula da mesma disciplina.
- Consultas de progresso e projeção chamam funções puras compartilhadas; não duplicar as regras de excedente de perfil em controllers.
- A classificação e os impedimentos da oferta dependem do contexto do aluno e são calculados na consulta; não persistir atributo global `tipoDaDisciplina`.

## 8. UX, estados e limites

**Ofertas:** duas ações diferenciadas, `Matricular-se` e `Adicionar ao plano`; nome da ação não deve sugerir que planejar garante vaga. Badge/texto neutro com exigências; motivo de bloqueio específico.

**Planejamento 360px:** cabeçalho `Meu planejamento`, legenda `simulação, não matrícula`, lista vertical de turmas, CH, classificação, vagas, requisitos, `Remover`, `Matricular-se` (somente elegível) e ação `Limpar plano` com confirmação. Resumo `Hoje` / `Se tudo for aprovado` em três grupos; apoio textual para leitores de tela. Cuidado com números e barras que pareçam progresso real. Estado vazio explica como adicionar, erro de rede oferece `Tentar novamente`.

**Mudança de estado:** ao carregar ou atualizar a lista, recalcule elegibilidade; se uma vaga acabar, mova o item para impedido, sem excluí-lo automaticamente. Ao efetivar, refaça a consulta; se API devolver 409, apresente motivo e recarregue plano/ofertas.

**Fora do escopo destes extras:** pré-requisitos co-requisitos, horários, matrícula em lote, reserva temporária, lista de espera, múltiplos cenários, recomendação inteligente e transferência de dados acadêmicos oficiais. Podem ser oportunidades de evolução futura, não recursos prometidos.

## 9. Exemplos completos para seed

**Ana (SI):** progresso real = obr `60/120`, perfil `60/60`, livre `60/90`. IF102 (obr) e IF105 (livre) elegíveis no plano produzem projeção obr `120/120`, perfil `60/60`, livre `120/90`; porcentagens projetadas `100/100/100`, faltantes `0/0/0`. IF106 tem pré-requisito IF102 não concluído, aparece impedida e não aumenta projetada.

**Bruno (EC):** IF102 e IF101 aprovadas. IF106 está liberada quanto ao pré-requisito; ao planejar IF106 com vaga, perfil já integralizado `60/60` pela IF101 e as 60h de IF106 entram como livre **na projeção**, sem mudar aprovação real. Demonstra RN-10 e RN-11 simultaneamente.

## 10. Sequência de entrega e pontos de corte

1. **P0/P1:** sistema obrigatório funcionando, regras RN-01..13 cobertas, UI aluno responsiva e secretaria em desktop.
2. **P2:** RF-20 implementado, documentação, seed e oito cenários T-EXTRA passando.
3. **P3:** RF-21 servidor e persistência → simulação pura → UI → testes T-PLAN e e2e 360px.
4. Revisar o README para explicar **os dois** diferenciais, o que realmente foi implementado, trade-offs e trabalho futuro.

**Critério de corte se o prazo apertar:** jamais ocultar pendências. Priorizar fluxo exigido, depois RF-20; RF-21 só é anunciado como entregue quando o fluxo completo e a prova de que não ocupa vaga estiverem implementados e testados.

## 11. Perguntas de entrevista que este projeto deve permitir responder

- Por que plano não é matrícula? Por que uma turma lotada ainda pode estar no plano?
- O que muda entre *elegível agora* e *matriculado*? Como evitar race condition entre os dois instantes?
- Por que a projeção exige hipótese de aprovação futura? Onde essa hipótese é visível na UI?
- Como a mesma disciplina é obrigatória num curso e de perfil/livre em outro?
- Como impedir CH duplicada ao transferir excedentes de perfil entre aprovado, ativo e planejado?
- Como validar pré-requisitos, reprovados e aprovações anteriores sem acoplar serviço ao Fastify?
- Como adicionar um terceiro critério futuro (choque de horários) sem reescrever a UI inteira?
- Onde o sistema diferencia 401, 403, 404 e 409?
- Quais são os trade-offs do plano persistido no banco em vez de estado local e da matrícula individual em vez de matrícula em lote?

---

**Revisão de autoria:** o candidato deve entender e concordar com cada política adicional antes de implementá-la e defendê-la na entrevista. Os exemplos são fictícios e o escopo atual é planejamento, não aplicação funcional.
