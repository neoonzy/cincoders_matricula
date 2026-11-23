# Matrícula — acabamento da interface

Revisão incremental da direção aprovada em design/trama-modern. Não há mudança de arquitetura, contratos HTTP, banco ou regras de negócio.

## Referências e aplicação

- Apple HIG — [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/), [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts): hierarquia de ações, feedback de atividade, confirmação explícita de operações destrutivas. Aplicação: spinner no acesso e diálogo nativo estilizado para cancelar matrícula ou limpar planejamento.
- Google — [Material Components](https://developer.android.com/design/ui/mobile/guides/components/material-overview): consistência dos controles e navegação adaptável. Aplicação: busca com botão de limpeza e indicação de resultados, seletor lista/grade e áreas de interação consistentes.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): foco visível, foco não ocultado por barras fixas e tamanho de alvos. Aplicação: scroll-padding, foco no conteúdo ao navegar, controles de ação com mínimo de 44 px, diálogos com semântica e comportamento de teclado do navegador, redução de movimento.
- Manual de Identidade Visual CIn 2026: identidade horizontal, Inter, Phosphor Fill, vermelho #CF2D3B, amarelo #F5A623 e neutros. A identidade é preservada sem reproduzir a linguagem de peças publicitárias.

## Decisões
- Nome público: Matrícula. Subtítulo: Portal acadêmico. A demonstração não se apresenta como serviço oficial da UFPE.
- Preservar o workspace aprovado: barra lateral desktop, navegação inferior no celular, catálogo com visualização em grade/lista e resumo acadêmico.
- Melhorar estados de erro, hover, foco, carregamento e interação sem acrescentar efeitos ornamentais.
- Não utilizar confirmações do navegador para cancelar matrícula e limpar planejamento: apresentar consequência e ação explicitamente em diálogo com foco e Escape. Manter erro no diálogo caso a operação falhe.
- Tratar falha de consulta da sessão diferente de ausência de autenticação.
- Preferência lista/grade migra da chave antiga para matricula-offer-view quando usada. A identidade histórica Trama permanece apenas em documentos antigos e identificadores de infraestrutura.

## Verificação
A suíte E2E foi atualizada para verificar limpeza da busca, retorno de uma confirmação sem cancelamento e confirmação efetiva. A revisão requer execução da suíte e inspeção visual; não constitui certificação de conformidade WCAG.
