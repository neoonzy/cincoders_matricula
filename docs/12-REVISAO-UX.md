# Matrícula — revisão de experiência e densidade

## Objetivo e escopo
Evolução incremental da direção visual aprovada em design/matricula-polish. Identidade CIn preservada. Sem alteração nos contratos HTTP, regras curriculares ou esquema PostgreSQL. Não representa serviço oficial da UFPE.

## Diagnóstico da implementação
| Problema | Impacto | Decisão |
|---|---|---|
| Cartões repetem indicadores, botões e barras de vagas | Comparação lenta entre turmas | Lista agrupada como padrão, grade opcional; disponibilidade em texto, sem barra redundante |
| Botões desabilitados repetidos em turmas concluídas/matriculadas | Ruído e dúvida sobre próximo passo | Estado explícito e atalho às matrículas quando pertinente |
| Pré-requisitos e impedimentos repetem conteúdo | Excesso de informação | Impedimento sempre visível; detalhes dos pré-requisitos expansíveis |
| Clique em matricular efetiva ação imediatamente | Risco de selecionar a turma errada | Confirmação contextual com disciplina, professor, CH e última disponibilidade; revalidação real pelo servidor |
| Cadastro abre formulário inline e empurra lista | Perda de contexto | Diálogo nativo com foco, Escape, rótulos, preservação de campos e erro |
| Secretaria exige rolagem horizontal em catálogo estreito | Ação de editar pouco encontrável | Código/nome na mesma coluna, CH compacta e edição acessível |
| Listagens de turmas/docentes não têm busca | Mais esforço de localização | Busca sobre todos os registros retornados por essas rotas; não altera paginação de disciplinas/ofertas |
| Cabeçalho ocupa muito espaço e saída separada | Informação repetida | Conta agrupada com menu de saída, sidebar mais estreita, faixa compacta de resumo |
| Erros temporários desaparecem | Usuário pode perder informação | Notificação de erro permanece até fechamento ou substituição; erros de formulário continuam locais |

## Referências verificadas em 23/11/2026
- Apple HIG — [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Searching](https://developer.apple.com/design/human-interface-guidelines/searching), [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars). Prioridade de busca, agrupamento, navegação estável.
- Google — [Material 3 adaptive: list-detail](https://developer.android.com/develop/adaptive-apps/guides/list-detail). Princípio de adaptação do conteúdo ao tamanho da janela; não copiamos componentes nativos.
- GOV.UK — [Check answers](https://design-system.service.gov.uk/patterns/check-answers/), [Details](https://design-system.service.gov.uk/components/details/), [Recover from validation errors](https://design-system.service.gov.uk/patterns/validation/). Revisão antes de transação, detalhes sob demanda, recuperação de erros.
- IBM Carbon — [Data table guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines). Busca e ações por linha agrupadas com a tabela.
- W3C — [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Foco visível, alvo de interação, foco não oculto pelas barras fixas; referência, não certificação.

## Critérios de aceite
- Login e navegação aluno/secretaria; confirmação de matrícula não altera dados ao voltar; efetivação e cancelamento confirmados.
- Busca, limpeza, alternância lista/grade; estado vazio de turma administrativa; formulário em diálogo com fechamento.
- Verificação de overflow em 360px e 1280px, inclusive catálogo da secretaria em 360px; capturas de tela pelo smoke.
- Regressão de domínio e integração PostgreSQL. Inspeção visual humana e testes com usuários reais continuam recomendados.
