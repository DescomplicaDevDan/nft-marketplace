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

`npm run build`, `npm run lint` e `npm run test:e2e` verificam compilação, regras estáticas e fluxos automatizados. Os nove testes atuais cobrem busca, filtros/ordenação, acesso direto e NFT inexistente, edições no carrinho, cupom após refresh, login/rota protegida, conflito de cadastro, autenticação mobile e atualização de preços por Socket.IO. A cobertura Playwright exigida ainda precisa incluir compra completa/falhas, cenários de Socket.IO, perfil/carteiras, acessibilidade e skeletons.

Lighthouse foi executado com três medições por página e perfil; relatórios HTML/JSON e medianas estão em `reports/lighthouse`. Performance mobile ficou em 88 (início) e 89 (detalhe), abaixo da meta de 90; o carregamento do runtime de mocks e a descoberta da imagem após a consulta ainda afetam o LCP. Desktop atingiu 99, acessibilidade 96/97, boas práticas 100 e SEO 92. As rotas carregam seus componentes sob demanda e a arte Emerald Ape usa WebP de 31 KB, mantendo o PNG original no repositório. Regressão visual versionada, revisão integral dos viewports e publicação permanecem pendentes.
