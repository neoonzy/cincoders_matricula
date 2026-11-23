# Trama — sistema de design institucional CIn 2026

## Direção
Base: Manual de Identidade Visual CIn 2026 fornecido no projeto. A interface é um serviço acadêmico demonstrativo, não um portal oficial. O nome Trama permanece como identificação do software, subordinado à assinatura do Centro de Informática.

- Off-white #F5F5F5, preto #050505 e cinzas neutros são a base.
- Vermelho institucional #CF2D3B para acesso e secretaria; amarelo #F5A623 na área do aluno. Amarelo recebe texto preto; vermelho recebe branco. Tons auxiliares mais escuros garantem leitura dos textos pequenos.
- Inter, com fallback local system-ui. DM Serif Display foi reservada pelo manual para comunicação humanizada/noticiosa; não é necessária na operação acadêmica.
- Ícones Phosphor Fill originais, incorporados localmente sob licença MIT; não há dependência do CDN de ícones.
- Assinatura horizontal extraída do manual (p. 8), sem redesenho. Em uma publicação institucional real, substituir pelo SVG oficial fornecido pelo CIn, mantendo a área de proteção e o mínimo digital.
- Grafismos modulares derivados dos conceitos da estrela (alunos) e das faixas (administrativo); são interpretações para a interface, não arquivos oficiais. Monocromáticos, secundários ao conteúdo.

## Layout e experiência
A navegação horizontal no desktop organiza as tarefas em uma única faixa. No celular, a navegação inferior permanece acessível e identifica o módulo ativo; o cabeçalho mantém contexto da área e saída da conta. A página de acesso prioriza o formulário, com painel complementar para as duas personas e preenchimento explícito das contas fictícias. Listas de ofertas usam linhas delimitadas, não cartões promocionais. Busca, paginação, progresso, impedimentos e ações existentes são preservados. Títulos descritivos substituem slogans. Estados de erro, foco visível, rótulos dos campos, tamanho mínimo de ícones e redução de movimento foram contemplados.

## Validação necessária
Build de produção; teste dos fluxos de aluno e secretaria; captura visual nos tamanhos 360 e 1280 px; validação de contraste e teclado; avaliação manual da nova direção. A disponibilidade de Inter via Google Fonts depende da rede, com fallback sem perda funcional.

A branch design/cin-2026 deriva da versão demo funcional. Não modifica o banco nem as regras de matrícula. A publicação no endereço principal deve ser deliberada após revisão.
