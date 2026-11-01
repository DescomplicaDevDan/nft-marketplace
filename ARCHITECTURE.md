# Arquitetura

## Estrutura

- `src/features`: telas e regras por domínio (catálogo, autenticação, comércio, pagamento, perfil e demonstração).
- `src/mocks`: handlers REST, fixtures persistidas no navegador, falhas controladas e transporte Socket.IO simulado.
- `src/components`: componentes compartilhados e controles visuais locais derivados de shadcn/ui.
- `tests/e2e`: fluxos Playwright contra a aplicação e os handlers MSW.

## Fluxo de dados

As rotas e os parâmetros de busca são geridos pelo TanStack Router. Componentes chamam hooks de domínio; TanStack Query mantém cache, estados de consulta e mutations; Axios é o cliente HTTP. Em desenvolvimento e na demonstração, MSW intercepta REST e WebSocket antes das chamadas chegarem à rede. Assim, componentes não contêm fixtures nem substituem operações de domínio por atualizações diretas na tela.

Handlers de mock persistem o estado em `localStorage`, com chaves separadas para autenticação, perfil, favoritos, carteiras, carrinhos, inventário e pedidos. `/demo` configura cenários reproduzíveis e o reset limpa somente o armazenamento da simulação. Usuários autenticados são isolados por ID; o carrinho visitante tem um identificador próprio e é unido ao carrinho da conta de forma idempotente no login.

## Contratos REST

O cliente usa `/api/auth/*`, `/api/nfts`, `/api/favorites`, `/api/cart`, `/api/cart/quote`, `/api/orders`, `/api/profile` e `/api/wallets`. Tipos de entrada/saída estão junto às features e handlers MSW. Erros HTTP distinguem validação, sessão expirada, ausência, conflito de disponibilidade e indisponibilidade transitória. Valores ETH viajam como strings decimais e os cálculos convertem para inteiros em wei. Pedidos usam `Idempotency-Key`; o mesmo payload recupera a tentativa existente, e uma chave com conteúdo diferente conflita.

## Sessão e cache

O token de demonstração expira em 30 minutos. Rotas privadas solicitam login e retomam a rota pretendida. Chaves de cache privadas incluem o ID do usuário; logout, expiração ou troca de conta limpam consultas e listeners associados à sessão. A sessão é revalidada periodicamente, no foco da janela e antes de operações privadas. Falhas de rede não encerram a sessão.

Rascunhos de checkout ficam em `sessionStorage`, separados por usuário e aba. Senhas não são persistidas. Reentrada recupera os campos, mas exige reconexão da carteira e nova cotação. Uma tentativa de pedido pendente pode ser consultada/repetida com a mesma chave e conteúdo.

## Carrinho, cotação e pedido

Uma linha é identificada por NFT + edição. Estoque, preço, reserva, cupom, subtotal e cotação são verificados no handler, não inferidos pelo total da UI. A cotação tem versão e validade. Pedido confirma apenas depois que o mock revalida cotação, conexão e dados do colecionador. A reserva é liberada se houver recusa; confirmação remove só as unidades compradas. O recibo armazena snapshot do pedido e não muda quando o catálogo muda.

## Atualização em tempo real

O cliente `socket.io-client` se conecta ao endpoint local fictício `https://kurio.local`. MSW intercepta WebSocket com extensão compatível com Engine.IO v4 e quadros de evento Socket.IO; não há servidor Socket.IO implantado. Cada evento inclui ID, recurso e versão. O cliente descarta duplicatas, versões antigas e eventos de outra conta; em reconexão invalida as consultas REST ativas. Pedidos sem conexão em tempo real são reconciliados pela API. A simulação controla alterações por endpoints `/api/demo/*` documentados no README.

## Interface, acessibilidade e limites

CSS local reproduz as referências Figma em desktop e mobile; os pontos adaptativos principais são 390, 768 e 1440 px. Skeletons preservam espaço e usam shimmer respeitando `prefers-reduced-motion`. Diálogos nativos, campos rotulados, mensagens de estado e foco visível dão suporte a teclado e leitores de tela.

As carteiras, login social, rede e pagamento são simulações locais; nenhuma transação ou conexão real com blockchain ocorre. Os preços e imagens são fixtures. Criadores/Aprenda, links sociais e link de explorer não possuem integração externa.

## Verificação e itens de entrega

`npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:e2e` e `npm run test:visual` são os comandos de verificação. Playwright usa Chromium (Edge no Windows), dados MSW isolados por contexto e reset antes dos testes. O projeto mobile ativa toque e viewport 390 × 844; a regressão visual cobre início, detalhe, carrinho e pagamento em 390, 768 e 1440 px. As 12 baselines versionadas representam o estado atual da implementação, não uma comparação automatizada com o arquivo Figma. Devem ser atualizadas apenas após revisão de uma mudança intencional. Capturas usam fontes locais, animações desativadas e máscara no aviso transitório do carrinho.

A cobertura inclui compra confirmada/recusada, cliques repetidos, timeout e idempotência, recuperação de pedido pendente após interrupção e refresh, eventos antigos/duplicados, cotação obsoleta, estoque esgotado, recusa de carteira, expiração durante checkout, isolamento entre contas e recibos, snapshot imutável, rollback de favoritos, perfil/avatar/senha/carteiras, cupom inválido/expirado, histórico/refresh, skeletons, falha HTTP com recuperação e foco de diálogo por teclado. A compra mobile parte do card do catálogo. Os relatórios HTML e traces são gerados em `playwright-report` e `test-results`; a última evidência de entrega é copiada para `reports/playwright`.

Correções verificadas: diálogos fechados não interceptam a tela mobile; aviso de carrinho não bloqueia o botão de finalizar; HTTP 401 em criação recusada libera nova confirmação após login, enquanto timeout preserva chave; coleções em destaque não excedem a viewport desktop.

Lighthouse atualizado: três medições por página/perfil, com build de demonstração e navegador headless, relatórios HTML/JSON e metadados em `reports/lighthouse`. Medianas: início mobile 70, detalhe mobile 74, início desktop 97, detalhe desktop 98. Acessibilidade 100 no mobile e 97 no desktop; boas práticas 100 e SEO 92. A meta de performance mobile ≥90 NÃO foi atingida. LCP mobile de 4309/4137 ms e TBT de 593/490 ms indicam atraso de conteúdo e bloqueio de thread principal; inicialização do runtime MSW/Socket.IO e aplicação React contribuem para o custo de JavaScript. A imagem principal compartilhada é pré-carregada e tem prioridade alta; isso não eliminou o gargalo. As medições anteriores 88/89 foram substituídas por esta auditoria. Os valores variam com as condições de execução; esta entrega publica os resultados medidos, sem reduzir funcionalidades ou desativar mocks para melhorar a nota.

As 12 referências visuais registram a implementação; não certificam igualdade pixel a pixel com Figma. A inspeção humana, leitores de tela e combinações adicionais de zoom/dispositivos complementam a automação. O lint mantém avisos de Fast Refresh sobre organização de exports, sem erros de build.
O deploy público e sua validação de acesso direto/refresh ainda dependem da publicação, adiada pelo usuário. Configurar `VITE_ENABLE_MOCKS=true` no build publicado e fallback SPA para index.html. A URL pública deve ser adicionada ao README após a publicação.
