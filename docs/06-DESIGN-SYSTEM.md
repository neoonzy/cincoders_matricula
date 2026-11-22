# Design System — Trama

## Objetivo

A interface deve ajudar uma pessoa a **saber o que já concluiu**, **entender por que uma matrícula foi recusada** e **planejar com segurança**, sem poluição visual. "Trama" é uma identidade demonstrativa, sem vínculo oficial com marcas da UFPE.

## Linguagem visual

- **Base:** verde escuro institucional `#163e32`, verde funcional `#156a53`, fundo `#f5f7f5` e superfícies brancas.
- **Hierarquia:** títulos em escala fluida, rótulos de contexto pequenos (eyebrow), números em destaque, descrições de baixa ênfase.
- **Estados curriculares:** obrigatória em azul suave, eletiva de perfil em violeta suave, eletiva livre em areia. Cada categoria tem *texto* além da cor.
- **Disponibilidade:** ponto visual + quantidade textual de vagas. Nunca comunicar condição apenas por cor.
- **Mensagens:** erro próximo ao contexto e toast com `role=alert`; sucesso com `role=status`; indicador de carregamento e botão de tentar novamente.
- **Progresso:** barra com `role=progressbar`, porcentagem legível, CH aprovada/em curso/faltante. Simulação explicitamente rotulada para não se passar por progresso oficial.

## Layout

- Desktop: sidebar fixa com 272px, topbar e área de conteúdo com largura máxima de 1180px. Secretaria funciona em desktop com tabelas e formulários editáveis.
- Tablet: ajuste de largura e cards em coluna quando necessário.
- Mobile a partir de **360px**: navegação lateral acionada por menu, cards de oferta em coluna, ações com largura cheia, comparação de CH vertical, sem necessidade de tabela para o aluno.
- Respeitar `prefers-reduced-motion` e `:focus-visible`.

## Componentes e responsabilidades

| Componente | Uso |
|---|---|
| `Shell` | Estrutura, navegação e identidade por perfil |
| `PageTitle` | Título, contexto e ação principal |
| `Badge` | Categoria curricular/status textual |
| `Availability` | Ocupação de turma |
| `QueryState` | Loading, indisponibilidade e recuperação |
| `SearchField`, `Pagination` | Busca/página sincronizadas à URL |
| `HoursProgress` | Comparação de CH com fonte claramente identificada |
| `FormPanel`, `ErrorMessage` | Formulários e feedbacks perto dos campos |
| `ToastProvider` | Feedback pós-mutações |

## Limitações atuais

Sem validação visual por navegador neste ambiente; é necessário verificar contraste, navegação por teclado, foco ao abrir/fechar o menu no celular, legibilidade de componentes em zoom de 200%, voz de leitores de tela e ações destrutivas. Os componentes estão preparados para iteração; a conformidade WCAG **não é declarada como comprovada**.
