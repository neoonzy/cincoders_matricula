# Trama — revisão de interface: produto digital moderno

## Direção visual
O redesign anterior aplicava linguagem de comunicação institucional diretamente na interface. Nesta revisão a referência é a experiência de um produto acadêmico de uso diário: Apple Human Interface Guidelines (layout adaptável, hierarquia, agrupamento, navegação lateral e tab bar) e Google Workspace (superfície de trabalho, busca, navegação e alternância lista/grade). Não se pretende reproduzir componentes proprietários.

## Sistema de design
- Cores do CIn: vermelho #CF2D3B para ações e seleção, amarelo #F5A623 como referência estudantil, neutros de base. Estados de sucesso/aviso/erro têm cores semânticas.
- Inter e fallback system-ui; ícones Phosphor Fill e assinatura institucional preservados. Sem grafismos repetidos, selos editoriais ou banners promocionais.
- Superfícies claras, bordas discretas, cantos moderados (12–22 px); botões e controles de navegação em formato cápsula. Desfoque restrito à navegação móvel, com fundo opaco de fallback.
- Hierarquia: título direto, descrição breve, ação contextual. Sem caixa alta ornamental.

## Jornada
- Login centralizado, formulário único, seletor de contas fictícias recolhível e preenchimento explícito.
- Navegação lateral no desktop e barra inferior no celular, com a mesma arquitetura da informação.
- Catálogo: resumo real de matrículas e planejamento, busca e número de resultados; duas visualizações, preferência local opcional. Cartões exibem disciplina, docente, carga horária, classificação, disponibilidade, pré-requisitos e impedimentos. Nenhuma regra de negócio alterada.
- Progresso: indicador geral ponderado por carga horária exigida, com categorias detalhadas. Limite de contribuição por categoria para evitar que excedentes produzam um percentual enganoso.
- Secretaria: mesma linguagem visual e ações consistentes; tabelas e formulários mantêm a funcionalidade.

## Verificação
CI localiza as telas pelo conteúdo, exercita login, alternância lista/grade, planejamento, matrícula, cancelamento, progresso e secretaria em 360px e 1280px. A demonstração usa banco e API já existentes, sem alteração de schema.
