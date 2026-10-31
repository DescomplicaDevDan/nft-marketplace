# NFT Marketplace

Frontend de um marketplace de NFTs desenvolvido para um desafio técnico. O objetivo é implementar descoberta de NFTs, compra simulada e área do colecionador com React e TypeScript.

> Em desenvolvimento: as telas desktop estão montadas; os fluxos usam a API simulada e recebem eventos Socket.IO. Cenários adicionais, revisão mobile, testes completos e publicação ainda estão pendentes.

## Links

- [Repositório no GitHub](https://github.com/DescomplicaDevDan/nft-marketplace)
- [Layout do desafio no Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1)
- Aplicação publicada: ainda não disponível.

## Stack

- React, TypeScript e Vite
- TanStack Router e TanStack Query
- Axios e Socket.IO Client
- Tailwind CSS v4 e shadcn/ui
- MSW para simular a API
- Playwright instalado; configuração e testes pendentes

## Requisitos

Node.js e npm instalados.

## Executar localmente

```bash
git clone https://github.com/DescomplicaDevDan/nft-marketplace.git
cd nft-marketplace
npm ci
npm run dev
```

O servidor mostra o endereço local ao iniciar. Em desenvolvimento, o MSW é iniciado automaticamente. Catálogo e autenticação passam pelo Axios e pelos handlers do MSW; busca e paginação são guardadas na URL.

Para ativar mocks num build de demonstração:

```bash
VITE_ENABLE_MOCKS=true npm run build
npm run preview
```

No PowerShell, configure a variável antes do build:

```powershell
$env:VITE_ENABLE_MOCKS="true"
npm run build
npm run preview
```

## Contas de demonstração

| E-mail | Senha |
| --- | --- |
| `colecionador@kurio.demo` | `Kurio123!` |
| `sato@kurio.demo` | `Sato123!` |

O cadastro também cria uma conta simulada. Sessão, cadastro e login usam `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` e `POST /api/auth/logout`. O token fica no `localStorage` para restaurar a sessão após atualizar a página. O estado demonstrativo guarda o hash SHA-256 da senha, não a senha em texto puro. Esta simulação é local e não serve como autenticação de produção. Login Google/Facebook e recuperação de senha não estão conectados.

Favoritos, checkout, pedidos, perfil e carteiras pedem login. Se a pessoa tentar abrir uma dessas rotas sem sessão, o modal de login aparece e, após autenticar, ela continua na rota solicitada.

### Expiração e retorno ao fluxo

A sessão simulada dura 30 minutos. O MSW verifica sua validade em todas as operações privadas; o cliente valida a sessão antes das navegações, a cada 30 segundos e ao recuperar o foco da janela. Uma resposta `401` da sessão atual remove o token, cancela consultas privadas, limpa seus caches e solicita novo login nas áreas protegidas. Erros de rede não são tratados como logout. Uma resposta atrasada de um token antigo não encerra uma sessão nova. Login, logout e troca de conta em outra aba sincronizam o estado pela mudança do token no navegador.

A rota e seus parâmetros permanecem no endereço durante a expiração. No pagamento, os campos, a carteira selecionada, o endereço alternativo e as observações são mantidos em `sessionStorage`, separados por usuário e por aba. Ao entrar novamente na mesma conta, o formulário é restaurado e uma nova conexão de carteira é exigida. Outra conta recebe apenas seu próprio rascunho. Sair voluntariamente apaga o rascunho daquela conta na aba; uma solicitação de pedido pendente continua recuperável pela chave de idempotência. Senhas não fazem parte do rascunho. O armazenamento da aba precisa estar disponível para essa recuperação.

Para reproduzir a expiração sem aguardar 30 minutos, estando conectado, execute no console do navegador:

```javascript
await fetch('/api/auth/expire', {
  method: 'POST',
  headers: { Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` },
})
```

Depois navegue para uma área privada, tente conectar a carteira no pagamento ou aguarde a validação periódica. O login será solicitado. Ao entrar na mesma conta, a rota e o rascunho serão recuperados. A cotação será consultada novamente; não há envio automático de compra após autenticar. Sessões emitidas pela versão antiga, sem data de expiração, exigem um novo login após esta atualização. A checagem funcional completa será feita na revisão final.

## Comandos

### Favoritos por usuário

Favoritos usam `GET /api/favorites`, `PUT /api/favorites/:id` e `DELETE /api/favorites/:id` via Axios e MSW. Os handlers verificam a sessão e persistem uma coleção separada por conta. A lista retorna os NFTs completos, inclusive os que estão além da primeira página do catálogo. Visitantes precisam entrar antes de favoritar.

O TanStack Query usa a chave `['favorites', userId]`. A interface atualiza imediatamente; se a requisição falhar, restaura o estado anterior e informa o erro. Alterações não são repetidas automaticamente e cliques concorrentes ficam bloqueados até a reconciliação com a API. O logout limpa o cache privado. Favoritos antigos do armazenamento compartilhado não são importados para uma conta.

Para conferir: entre como colecionador, favorite um NFT no detalhe e atualize a página. Depois saia, entre como Sato e abra `/favorites`: o favorito da outra conta não deve aparecer. A verificação desta etapa cobriu persistência e isolamento no navegador; a suíte E2E versionada ainda está pendente.

### Perfil, avatar e senha

A tela `/profile` usa `GET /api/profile` e `PUT /api/profile` pelo Axios. O MSW identifica a conta pela sessão; o cache usa `['profile', userId]`. Os dados antigos da chave compartilhada `kurio-profile` não são importados. Novas contas começam com usuário/e-mail cadastrados e os demais campos vazios.

O botão Salvar envia os dados e, se preenchida, a alteração de senha em uma operação: a API valida tudo antes de persistir. Usuário/e-mail duplicados retornam conflito; senha atual incorreta é recusada. Avatar aceita PNG, JPEG ou WebP de até 2 MB; Alterar/Remover só são persistidos após Salvar. A API guarda o hash da nova senha e atualiza as credenciais de login quando o e-mail muda. Nenhuma senha é salva em texto puro. Falhas preservam os campos para correção e o formulário bloqueia envios enquanto salva.

Verificação desta etapa no navegador: recusa de senha atual incorreta, gravação do perfil, restauração após atualizar a página e login com a nova senha. A sessão de teste usa armazenamento isolado e não altera as contas do navegador de uso manual.

### Carteiras por usuário

A tela `/wallets` usa `GET /api/wallets`, `PUT /api/wallets` e `DELETE /api/wallets/:slot` (`primary` ou `secondary`). O MSW identifica a conta pela sessão e separa seus registros; o cache usa `['wallets', userId]`. O armazenamento compartilhado antigo não é importado.

É possível criar, editar e remover as carteiras principal e secundária. “Igual à carteira principal” exige uma principal salva e reutiliza seus dados; remover a principal desativa essa opção. Campos obrigatórios incluem indicação e ENS. A API verifica e-mail, rede, tipo e formato do endereço: Ethereum/Polygon com `0x` e 40 caracteres hexadecimais; Solana com 32 a 44 caracteres Base58. A validação é de formato, sem consulta à blockchain. Falhas preservam o formulário; mudanças só aparecem como salvas após a resposta da API. As carteiras salvas podem ser selecionadas no pagamento.

ENS e indicação também são obrigatórios no formulário de pagamento. Os testes completos dos fluxos serão realizados na revisão final solicitada; esta etapa passou pela compilação TypeScript/Vite.

### Carrinho de visitante e conta

O carrinho usa `GET /api/cart`, `PUT /api/cart/items/:id` (adicionar ou definir quantidade), `DELETE /api/cart/items/:id` e `POST /api/cart/merge`. O visitante recebe um identificador local enviado no cabeçalho `X-Guest-Cart`; contas usam a sessão. O MSW separa seus carrinhos e persiste as alterações. O cache usa `['cart', owner]`.

Ao carregar o carrinho autenticado, a API une os itens do visitante aos da conta, soma quantidades e ajusta ao estoque com aviso. A gravação e o esvaziamento do carrinho visitante ocorrem juntos, permitindo repetir a operação sem duplicar itens. A leitura autenticada repete essa operação idempotente para recuperar falhas de rede. Logout não transforma os itens privados em itens de visitante.

A quantidade selecionada no detalhe é enviada ao carrinho. A API recusa quantidades inválidas ou acima do estoque. Alterações aguardam confirmação, bloqueiam cliques concorrentes e mostram falhas; a lista retorna todos os itens, sem o limite da primeira página do catálogo. O carrinho compartilhado antigo não é importado. O checkout lê itens e totais da API; pedidos confirmados removem apenas as quantidades compradas, preservando os itens restantes. Compilação verificada; testes completos seguem para a revisão final.

### Cotação e cupons

`POST /api/cart/quote` cria uma cotação com ID, versão do carrinho, itens, subtotais por item, desconto, taxa e total em strings decimais de ETH. Os cálculos usam inteiros em wei (18 casas), sem ponto flutuante. O desconto percentual é arredondado para baixo ao wei. A taxa simulada é `0.016 ETH`. Uma cotação válida com os mesmos dados é reutilizada por até dois minutos. O cache usa `['quote', owner, cartVersion]` e revalida a cada minuto enquanto a aplicação está aberta.

`PUT /api/cart/coupon` aplica um código; `DELETE /api/cart/coupon` remove. O cupom pertence ao carrinho e persiste após atualizar a página. Na união de carrinhos, o cupom da conta tem prioridade; se não houver, usa o do visitante. Alterar itens ou cupom gera uma nova versão e recalcula os totais. Carrinho e pagamento usam a mesma resposta da API; avançar fica bloqueado enquanto calcula ou se a cotação falhar.

| Código de demonstração | Resultado |
| --- | --- |
| `KURIO10` | Desconto de 10% sobre o subtotal, sem desconto na taxa |
| `EXPIRADO` | Erro de cupom expirado (`422`, `coupon_expired`) |
| Qualquer outro | Erro de cupom inválido (`422`, `coupon_invalid`) |

Exemplo: subtotal `1.19`, desconto `0.119`, taxa `0.016`, total `1.087 ETH`. Aplicações recusadas preservam o cupom e os totais anteriores. Estoque insuficiente bloqueia a cotação com `409`. A API de pedidos revalida a cotação antes de aceitar a compra. Se mudar ou expirar, retorna os valores atualizados e exige uma nova confirmação. Build verificado; testes completos ficam para a revisão final.

### Conexão de carteira no pagamento

Em `/checkout`, “Carteira salva” permite escolher principal/secundária ou preencher manualmente. A seleção preenche os dados cadastrados e sincroniza o tipo com as opções de pagamento. A opção “Usar outra carteira?” usa o endereço alternativo informado. Os dados editados permanecem no formulário durante falhas de conexão.

`GET /api/wallet-connection` recupera a conexão da sessão, `POST /api/wallet-connection` valida e conecta, e `DELETE /api/wallet-connection` desconecta. O MSW valida formato de endereço, rede e provedor. Para uma carteira salva, confere também se os dados continuam iguais aos cadastrados. A conexão é simulada, sem extensões ou chamadas à blockchain. A API persiste a conexão por sessão; um novo login precisa conectar novamente. O cache usa `['walletConnection', userId]` e é limpo no logout.

Para reproduzir a recusa, selecione “Resposta da carteira (demonstração) → Recusar conexão” e clique em Conectar carteira. A API retorna `403 / wallet_rejected`, encerra a conexão anterior da sessão e preserva carrinho, cupom e formulário. Para continuar, escolha Autorizar conexão e conecte. Desconectar bloqueia a confirmação; alterar endereço, rede ou provedor também exige uma conexão correspondente aos novos dados. Falhas de consulta permitem tentar novamente. A API de pedidos verifica novamente a conexão selecionada antes de criar a compra.

Compilação e lint passaram nesta etapa; a revisão funcional completa permanece para o final. O build passou a emitir um aviso de tamanho do bundle, que será tratado na etapa de desempenho.

### Pedidos, recuperação e recibos

| Recurso | Operação |
| --- | --- |
| `POST /api/orders` | Revalida cotação/conexão/dados e cria pedido pendente com cabeçalho `Idempotency-Key` |
| `GET /api/orders` | Lista somente pedidos da conta autenticada |
| `GET /api/orders/:id` | Recupera estado e recibo do pedido da conta |
| `GET /api/orders/by-key/:key` | Recupera a mesma solicitação após timeout ou atualização da página |

Mesma chave e mesmo payload retornam o mesmo pedido; payload diferente retorna `409 / idempotency_conflict`. Uma compra pendente impede outra criação simultânea pela mesma conta. O cliente guarda a chave e o payload da tentativa por usuário, bloqueia cliques concorrentes e não repete a criação automaticamente. O painel de recuperação permite verificar ou reenviar exatamente a mesma solicitação. Tentativas antigas do armazenamento compartilhado `kurio-commerce` não são importadas.

O MSW reserva estoque ao aceitar um pedido pendente. Após aproximadamente 2,5 segundos, confirma ou recusa conforme o cenário selecionado. Estado do pedido, reserva e remoção das quantidades compradas são persistidos em uma única gravação do banco simulado. Consultas REST recuperam a transição caso a página tenha sido fechada antes do temporizador. Um estado terminal não volta para pendente. Na recusa, libera a reserva e mantém o carrinho. O catálogo e os detalhes consultam o estoque resultante das reservas e compras.

O recibo guarda um snapshot de nomes, imagens, quantidades, preços, desconto, taxa, total e carteira; alterações posteriores no catálogo não recalculam pedidos existentes. A interface só exibe confirmação após receber `confirmed` da API. O explorador em `/explorer/:orderId` é local e identificado como simulado; a referência não aponta para uma transação real no Etherscan. Essa adaptação evita apresentar um pagamento fictício como transação real.

Em “Resultado do pagamento (demonstração)”, escolha:

- **Confirmar pagamento:** pendente → confirmado; remove apenas quantidades compradas.
- **Recusar pagamento:** pendente → recusado; preserva carrinho e valores anteriores.
- **Demorar resposta e recuperar pedido:** o MSW demora 10 segundos para responder à criação, ultrapassando o timeout de 8 segundos do Axios. A chave é preservada e o resultado é consultado pela mesma solicitação.

Pedidos recebem atualizações por Socket.IO. Quando a conexão em tempo real cai, os pendentes são consultados a cada dois segundos; ao reconectar, a API é consultada para recuperar o estado atual. Build/lint verificados; os testes completos e cenários de rede serão executados na revisão final solicitada.

### Atualizações em tempo real

O cliente `socket.io-client` se conecta ao endereço demonstrativo `https://kurio.local`, interceptado pelo MSW. Nenhum servidor externo é necessário. O cliente é importado depois de `worker.start()`, para utilizar o WebSocket interceptado. A extensão local `SocketIoExtension` usa a API de extensões do MSW 3 para negociar Engine.IO v4 e transportar eventos Socket.IO reais. O pacote `@mswjs/socket.io-binding@0.2.0` exige MSW 2 e não foi instalado. A extensão local atende ao escopo de eventos de texto no namespace padrão; namespaces adicionais, ACKs e dados binários não estão implementados. Referências: [WebSocket do MSW](https://mswjs.io/api/ws), [binding oficial](https://github.com/mswjs/socket.io-binding).

| Evento | Efeito |
| --- | --- |
| `nft.updated` | Atualiza preço/estoque, invalida catálogo e favoritos; se estiver no carrinho, avisa e recalcula a cotação |
| `order.updated` | Atualiza o pedido da conta, preservando estados terminais e reconciliando carrinho/recibo |
| `ready` | Reconcilia catálogo, carrinho, cotação e pedidos pela API após conectar/reconectar |
| `session.expired` | Revalida a sessão por REST e inicia o fluxo de novo login |

Eventos incluem ID estável, ID do recurso e versão. O cliente descarta duplicados e versões antigas; pedidos confirmados/recusados não voltam a pendente. O backend publica eventos após persistir o estado usado pelos handlers REST. Mudanças de estoque incluem reservas de pedidos pendentes. Logout/troca de conta remove os listeners e desconecta o socket anterior; eventos privados só são enviados e aceitos para a conta autenticada. Atualizações entre abas também são propagadas pelo transporte simulado. O token na URL é restrito ao ambiente fictício interceptado; não representa uma estratégia de autenticação para produção.

Para reproduzir os cenários no console, estando conectado:

```javascript
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}`,
  'X-Guest-Cart': localStorage.getItem('kurio-guest-cart-id'),
}

// Mantenha este NFT no carrinho: muda o preço e envia depois um evento antigo.
await fetch('/api/demo/nfts/nft-001', {
  method: 'POST', headers,
  body: JSON.stringify({ priceEth: '1.25', available: 2, delivery: 'out-of-order' }),
})

// Use delivery: 'duplicate' para repetir o mesmo evento, ou available: 0 para esgotar.
// Simula cinco segundos de desconexão; a reconexão confere os dados pela API.
await fetch('/api/demo/realtime/disconnect', {
  method: 'POST', headers, body: JSON.stringify({ durationMs: 5000 }),
})

// Substitua ID_DO_PEDIDO por um pedido da conta: repete o estado atual e envia
// um evento pendente antigo, que não deve desfazer uma confirmação/recusa.
await fetch('/api/demo/orders/ID_DO_PEDIDO/events', { method: 'POST', headers })
```

As alterações de preço/estoque persistem no banco demonstrativo e podem ser restauradas pelo painel `/demo`. Nesta etapa foram feitas checagens isoladas no navegador de atualização de preço, recuperação de pedido após refresh, eventos antigos e reconexão com estoque esgotado. Elas não substituem a futura suíte Playwright versionada nem a revisão completa solicitada para o final.

### Painel de cenários e reset

Acesse `/demo` no mesmo endereço da aplicação, por exemplo `http://localhost:5177/demo` (use a porta mostrada pelo Vite). O painel está habilitado em desenvolvimento e no build com `VITE_ENABLE_MOCKS=true`. Usa Axios/TanStack Query e o botão shadcn/ui já configurado. As falhas são implementadas pelos handlers MSW, sem respostas falsas em componentes, hooks ou interceptadores Axios.

| Cenário | Comportamento |
| --- | --- |
| Normal | Executa os handlers habituais sem falhas adicionais |
| Catálogo vazio | Retorna lista vazia, total zero e contagens zeradas |
| Latência variável | Varia o atraso de forma reproduzível pela seed e pela ordem das requisições |
| Respostas fora de ordem | Alterna respostas lentas e rápidas; faça duas buscas seguidas no catálogo |
| Falha de rede | Retorna erro de rede antes de executar a operação |
| Timeout | Aguarda 10 segundos e falha, ultrapassando os 8 segundos do Axios, sem executar a operação |
| Erro temporário | Retorna `503 / transient_error` |
| Validação | Retorna `400 / validation_error`, com mensagem e erros de formulário |
| Sessão expirada | Revoga a sessão enviada e retorna `401`; por padrão é aplicado uma única vez |
| Conflito de cadastro | Retorna `409 / signup_conflict` no cadastro |

Defina o prefixo do caminho (por exemplo `/api/favorites`), método, atraso, probabilidade de aplicação de 0 a 1, seed e execução única. Reaplicar a configuração zera o contador e reproduz a mesma sequência para a mesma ordem de requisições. A probabilidade padrão é 1 e a seed padrão é 42. Consultas automáticas também contam quando correspondem ao caminho/método; restrinja o alvo para isolar uma operação. Para observar um erro persistente apesar de tentativas automáticas do TanStack Query, deixe execução única desmarcada.

Os endpoints de controle `/api/demo/*` e login/logout continuam disponíveis durante os cenários de falha. “Restaurar dados iniciais” volta ao cenário normal, seed 42, catálogo de 36 NFTs e duas contas de demonstração; remove apenas as chaves do armazenamento pertencentes à simulação, inclusive novos cadastros, sessões, carteiras, favoritos, carrinhos, pedidos, estoque/preços alterados, tentativas e rascunhos. O painel recarrega a página para eliminar caches e versões de eventos anteriores. Recarregue outras abas após um reset. Nenhum arquivo do projeto é alterado por esse botão. A operação não é executada automaticamente ao iniciar a aplicação.

Endpoints de automação:

```javascript
// Configurar um erro ao favoritar, para observar rollback (use DELETE para remoção).
await fetch('/api/demo/scenario', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scenario: 'server-error', pathPrefix: '/api/favorites', method: 'PUT',
    seed: 42, delayMs: 600, failureRate: 1, once: false,
  }),
})

// Consultar configuração, contador e se a execução única já foi consumida.
await fetch('/api/demo/scenario').then((response) => response.json())

// Restaurar fixtures; depois recarregue a página.
await fetch('/api/demo/reset', { method: 'POST' })
location.reload()
```

`POST /api/demo/reset` também aceita uma configuração parcial no corpo JSON para iniciar as fixtures já no cenário desejado. Para preço/estoque, eventos duplicados/antigos e desconexão, use os endpoints da seção de tempo real. Cupons inválidos/expirados e pagamento confirmado/recusado/timeout têm seus próprios controles, descritos acima. O timeout genérico interrompe antes da operação; o cenário de timeout do pagamento registra a compra e atrasa a resposta para exercitar a recuperação idempotente.

Checagens isoladas desta etapa: aplicação de `503`, acesso ao controle durante a falha, reset pelo painel e restauração do catálogo de 36 itens. Foram executadas em contexto de navegador isolado, preservando os dados de uso manual. A suíte E2E versionada e a revisão completa continuam pendentes.

### Componentes shadcn/ui nos fluxos principais

Os componentes locais em `src/components/ui` são usados nos formulários de login/cadastro, perfil, carteiras, cupom do carrinho e pagamento:

- `Button`: ações de entrar/criar conta, salvar perfil/carteira, aplicar cupom e confirmar compra. A variante `kurio` usa as cores do layout; o tamanho `design` deixa as dimensões sob o CSS de cada tela.
- `Input`: campos de texto, e-mail e senha; encaminha propriedades nativas, referências, rótulos, validação e estados de erro/desabilitado.
- `Textarea`: observações do pagamento, incluindo limite de caracteres, persistência do rascunho e estados de foco.

O diálogo de autenticação usa o elemento nativo `dialog`, com foco modal e fechamento por Escape. Seletores, rádio, checkbox e envio de avatar mantêm seus controles nativos. Os estilos das telas continuam definindo medidas, tipografia e cores dos componentes para acompanhar o Figma.

Checagem isolada desta etapa: login funcional com os novos componentes, presença dos controles no perfil e preservação do seletor de avatar oculto. No login desktop, o campo continuou com 340 × 40 px e o botão com 340 × 46 px, mantendo cores, fonte e padding medidos antes da migração. A comparação visual completa das demais telas permanece para a revisão final. Build/lint passaram; permanecem avisos de Fast Refresh nos provedores e de tamanho do bundle.

### Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Verifica tipos e gera o build de produção |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | Executa o Oxlint |

## Estado e próximos passos

Catálogo, detalhe, favoritos, perfil, carteiras, carrinho, cotação e pedidos usam handlers REST do MSW. Busca, ordenação, filtros e paginação usam a URL. Pedidos e recibos são separados por conta e a confirmação depende da resposta do servidor simulado. Socket.IO atualiza catálogo/carrinho e pedidos, com reconciliação por REST. A suíte Playwright versionada, auditoria Lighthouse, documentação de arquitetura e deploy ainda faltam. A responsividade e a fidelidade visual serão revisadas após as funcionalidades obrigatórias.

1. Revisar mobile e fidelidade visual nos tamanhos 390, 768 e 1440 px.
2. Completar shimmer de carregamento e acessibilidade.
3. Versionar testes Playwright E2E/visuais, cobrindo isolamento, falhas e Socket.IO.
4. Auditar Lighthouse, otimizar desempenho e documentar a arquitetura.
5. Publicar a aplicação e registrar a URL.

## Escopo da simulação

Autenticação, carteiras e pagamentos são simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento não fazem parte do desafio.
