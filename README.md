# NFT Marketplace

Frontend de um marketplace de NFTs desenvolvido para um desafio técnico. O objetivo é implementar descoberta de NFTs, compra simulada e área do colecionador com React e TypeScript.

> Fluxos desktop/mobile conectados à API simulada, testes E2E, regressão visual e auditoria Lighthouse disponíveis. Publicação pública pendente. Consulte ARCHITECTURE.md para evidências e limitações, incluindo as metas de performance mobile ainda não atingidas.

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
- Playwright para testes E2E

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

Depois navegue para uma área privada, tente conectar a carteira no pagamento ou aguarde a validação periódica. O login será solicitado. Ao entrar na mesma conta, a rota e o rascunho serão recuperados. A cotação será consultada novamente; não há envio automático de compra após autenticar. Sessões emitidas pela versão antiga, sem data de expiração, exigem um novo login após esta atualização.

## Comandos

### Favoritos por usuário

Favoritos usam `GET /api/favorites`, `PUT /api/favorites/:id` e `DELETE /api/favorites/:id` via Axios e MSW. Os handlers verificam a sessão e persistem uma coleção separada por conta. A lista retorna os NFTs completos, inclusive os que estão além da primeira página do catálogo. Visitantes precisam entrar antes de favoritar.

O TanStack Query usa a chave `['favorites', userId]`. A interface atualiza imediatamente; se a requisição falhar, restaura o estado anterior e informa o erro. Alterações não são repetidas automaticamente e cliques concorrentes ficam bloqueados até a reconciliação com a API. O logout limpa o cache privado. Favoritos antigos do armazenamento compartilhado não são importados para uma conta.

Para conferir: entre como colecionador, favorite um NFT no detalhe e atualize a página. Depois saia, entre como Sato e abra `/favorites`: o favorito da outra conta não deve aparecer. A suíte Playwright cobre os principais fluxos automatizados; veja `ARCHITECTURE.md` para os itens de cobertura ainda pendentes.

### Perfil, avatar e senha

A tela `/profile` usa `GET /api/profile` e `PUT /api/profile` pelo Axios. O MSW identifica a conta pela sessão; o cache usa `['profile', userId]`. Os dados antigos da chave compartilhada `kurio-profile` não são importados. Novas contas começam com usuário/e-mail cadastrados e os demais campos vazios.

O botão Salvar envia os dados e, se preenchida, a alteração de senha em uma operação: a API valida tudo antes de persistir. Usuário/e-mail duplicados retornam conflito; senha atual incorreta é recusada. Avatar aceita PNG, JPEG ou WebP de até 2 MB; Alterar/Remover só são persistidos após Salvar. A API guarda o hash da nova senha e atualiza as credenciais de login quando o e-mail muda. Nenhuma senha é salva em texto puro. Falhas preservam os campos para correção e o formulário bloqueia envios enquanto salva.

Verificação desta etapa no navegador: recusa de senha atual incorreta, gravação do perfil, restauração após atualizar a página e login com a nova senha. A sessão de teste usa armazenamento isolado e não altera as contas do navegador de uso manual.

### Carteiras por usuário

A tela `/wallets` usa `GET /api/wallets`, `PUT /api/wallets` e `DELETE /api/wallets/:slot` (`primary` ou `secondary`). O MSW identifica a conta pela sessão e separa seus registros; o cache usa `['wallets', userId]`. O armazenamento compartilhado antigo não é importado.

É possível criar, editar e remover as carteiras principal e secundária. “Igual à carteira principal” exige uma principal salva e reutiliza seus dados; remover a principal desativa essa opção. Campos obrigatórios incluem indicação e ENS. A API verifica e-mail, rede, tipo e formato do endereço: Ethereum/Polygon com `0x` e 40 caracteres hexadecimais; Solana com 32 a 44 caracteres Base58. A validação é de formato, sem consulta à blockchain. Falhas preservam o formulário; mudanças só aparecem como salvas após a resposta da API. As carteiras salvas podem ser selecionadas no pagamento.

ENS e indicação também são obrigatórios no formulário de pagamento.

### Carrinho de visitante e conta

O carrinho usa `GET /api/cart`, `PUT /api/cart/items/:id` (adicionar ou definir quantidade), `DELETE /api/cart/items/:id` e `POST /api/cart/merge`. O visitante recebe um identificador local enviado no cabeçalho `X-Guest-Cart`; contas usam a sessão. O MSW separa seus carrinhos e persiste as alterações. O cache usa `['cart', owner]`.

Ao carregar o carrinho autenticado, a API une os itens do visitante aos da conta, soma quantidades e ajusta ao estoque com aviso. A gravação e o esvaziamento do carrinho visitante ocorrem juntos, permitindo repetir a operação sem duplicar itens. A leitura autenticada repete essa operação idempotente para recuperar falhas de rede. Logout não transforma os itens privados em itens de visitante.

A quantidade selecionada no detalhe é enviada ao carrinho. A API recusa quantidades inválidas ou acima do estoque. Alterações aguardam confirmação, bloqueiam cliques concorrentes e mostram falhas; a lista retorna todos os itens, sem o limite da primeira página do catálogo. O carrinho compartilhado antigo não é importado. O checkout lê itens e totais da API; pedidos confirmados removem apenas as quantidades compradas, preservando os itens restantes.

### Cotação e cupons

`POST /api/cart/quote` cria uma cotação com ID, versão do carrinho, itens, subtotais por item, desconto, taxa e total em strings decimais de ETH. Os cálculos usam inteiros em wei (18 casas), sem ponto flutuante. O desconto percentual é arredondado para baixo ao wei. A taxa simulada é `0.016 ETH`. Uma cotação válida com os mesmos dados é reutilizada por até dois minutos. O cache usa `['quote', owner, cartVersion]` e revalida a cada minuto enquanto a aplicação está aberta.

`PUT /api/cart/coupon` aplica um código; `DELETE /api/cart/coupon` remove. O cupom pertence ao carrinho e persiste após atualizar a página. Na união de carrinhos, o cupom da conta tem prioridade; se não houver, usa o do visitante. Alterar itens ou cupom gera uma nova versão e recalcula os totais. Carrinho e pagamento usam a mesma resposta da API; avançar fica bloqueado enquanto calcula ou se a cotação falhar.

| Código de demonstração | Resultado |
| --- | --- |
| `KURIO10` | Desconto de 10% sobre o subtotal, sem desconto na taxa |
| `EXPIRADO` | Erro de cupom expirado (`422`, `coupon_expired`) |
| Qualquer outro | Erro de cupom inválido (`422`, `coupon_invalid`) |

Exemplo: subtotal `1.19`, desconto `0.119`, taxa `0.016`, total `1.087 ETH`. Aplicações recusadas preservam o cupom e os totais anteriores. Estoque insuficiente bloqueia a cotação com `409`. A API de pedidos revalida a cotação antes de aceitar a compra. Se mudar ou expirar, retorna os valores atualizados e exige uma nova confirmação.

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

Pedidos recebem atualizações por Socket.IO. Quando a conexão em tempo real cai, os pendentes são consultados a cada dois segundos; ao reconectar, a API é consultada para recuperar o estado atual.

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

Checagens da demonstração também são cobertas pela suíte Playwright; falhas de rede, atraso e 503 podem ser reproduzidos no painel `/demo`.

### Componentes shadcn/ui nos fluxos principais

Os componentes locais em `src/components/ui` são usados nos formulários de login/cadastro, perfil, carteiras, cupom do carrinho e pagamento:

- `Button`: ações de entrar/criar conta, salvar perfil/carteira, aplicar cupom e confirmar compra. A variante `kurio` usa as cores do layout; o tamanho `design` deixa as dimensões sob o CSS de cada tela.
- `Input`: campos de texto, e-mail e senha; encaminha propriedades nativas, referências, rótulos, validação e estados de erro/desabilitado.
- `Textarea`: observações do pagamento, incluindo limite de caracteres, persistência do rascunho e estados de foco.

O diálogo de autenticação usa o elemento nativo `dialog`, com foco modal e fechamento por Escape. Seletores, rádio, checkbox e envio de avatar mantêm seus controles nativos. Os estilos das telas continuam definindo medidas, tipografia e cores dos componentes para acompanhar o Figma.

Checagem isolada desta etapa: login funcional com os novos componentes, presença dos controles no perfil e preservação do seletor de avatar oculto. No login desktop, o campo continuou com 340 × 40 px e o botão com 340 × 46 px, mantendo cores, fonte e padding medidos antes da migração. A comparação visual completa das demais telas permanece para a revisão final. Build/lint passaram; permanecem avisos de Fast Refresh nos provedores e de tamanho do bundle.

### Início mobile

A primeira tela mobile foi adaptada ao print de referência enviado, usando 390 px como largura-base. Em larguras abaixo de 768 px, a página inicial apresenta busca no topo, botão de filtros, hero compacto com os dois artworks locais, abas do catálogo, duas colunas de cards alternadas e navegação fixa inferior. O botão central leva ao catálogo; os demais acessam início, favoritos, carrinho e perfil. As áreas privadas mantêm a autenticação existente.

Busca, categorias, rede, faixa de preço, ordenação e paginação continuam usando os parâmetros da URL e a API do MSW. O botão de filtros abre um diálogo nativo com foco modal, fechamento por Escape e restauração da rolagem. Favoritos usam a API por usuário. A abertura sem filtros/sort destaca Golden Beat na quarta posição, conforme a composição do print; buscas e ordenações explícitas mantêm a ordem retornada pela API.

Os ícones e imagens são os assets locais fornecidos. O selo RARO identifica Neon Vessel no recorte visual. A navegação respeita a área segura inferior; o conteúdo tem espaço final para continuar acessível abaixo da barra fixa. A moldura preta do aparelho no print não faz parte da página. O layout desktop usa a composição anterior; as outras telas mobile ainda serão ajustadas conforme suas próprias referências.

Checagens isoladas: renderização em 390 px, busca pela URL, abertura/fechamento dos filtros, restauração de rolagem, ausência de overflow horizontal em 320/390 px, exibição da composição desktop em 1440 px e solicitação de login pelo atalho de perfil. A validação visual final com todos os frames do Figma permanece pendente.

### Detalhe do NFT mobile

A tela `/nft/:id` abaixo de 768 px segue o segundo print mobile: voltar/favoritar no topo, artwork grande, painel sobreposto com nome/avaliação/resumo/edição/metadados e área inferior de compra. O layout-base é 390 × 844 px, com rolagem quando necessária e respeito à área segura inferior. O detalhe desktop conserva a composição anterior; o mobile não mostra rodapé nem a navegação inferior da home nesse recorte.

Resumo, avaliação, quantidade de avaliações, coleção de exibição e atributos do Emerald Ape estão na fixture tipada do MSW. Os botões `1/1`, `1/10`, `1/50` e `ABERTA` selecionam uma edição; preço, estoque e limite de quantidade mudam conforme a seleção. As opções sem estoque ficam desabilitadas. As fixtures distribuem o estoque base entre as edições e usam preços demonstrativos por faixa; esses valores não representam preços de blockchain.

O seletor de quantidade considera o estoque atual e o que já está no carrinho. O botão Comprar NFT aguarda a resposta de adição pela API e então abre o carrinho para revisão. O ícone ao lado adiciona a quantidade sem navegar. Falhas mantêm a tela e exibem a mensagem da API; cliques concorrentes ficam bloqueados. Favoritar usa a sessão e a coleção privada já implementadas. Os ícones reutilizam os assets locais fornecidos.

Checagens: quantidade e edição persistem no carrinho; Playwright verifica acesso direto, NFT inexistente, alteração de edição/preço e linhas independentes. O quadro em 390 px foi conferido com a referência; o refinamento visual ainda está pendente.

### Carrinho mobile

A rota `/cart` abaixo de 768 px usa o layout mobile da referência: cabeçalho com voltar, itens compactos com imagem, edição, quantidade e subtotal da linha; o resumo com cupom, subtotal, desconto, taxa de rede e total fica fixo na parte inferior, junto do botão para continuar ao pagamento. Em telas estreitas, a lista rola por trás do resumo e mantém espaço para que todos os itens possam ser alcançados. A composição desktop continua separada.

Quantidade, remoção, cupom, cotação e navegação ao pagamento usam as mesmas operações REST e os mesmos estados do carrinho desktop. Cada linha do carrinho é identificada pelo NFT e pela edição; preço, disponibilidade, subtotal e reserva do pedido são validados separadamente por edição. O checkout e o recibo preservam o rótulo selecionado.

Checagens isoladas: quatro itens renderizados na largura-base de 344 px, sem overflow horizontal em 320 px, cabeçalho mobile oculto no desktop de 1440 px. A suíte E2E ainda precisa cobrir a compra completa e os cenários de falha do carrinho.

### Pagamento mobile

A rota `/checkout` abaixo de 768 px segue a referência mobile enviada para pagamento com carteira: cabeçalho “Pagamento com carteira”, seleção de carteiras salvas e rede/provedor, total e botão de confirmação fixo na base. As carteiras exibem apelido, ENS/endereço abreviado e rede; “Trocar carteira” abre o gerenciamento de carteiras. A tela usa a conexão e a cotação reais da API simulada, e só habilita a confirmação depois de uma conexão válida.

Os dados obrigatórios do colecionador continuam no checkout e podem ser abertos por “Editar dados do colecionador”. Se faltarem dados ao confirmar, o formulário é aberto e a conclusão é bloqueada até o preenchimento. A etapa mantém a idempotência, recuperação de pedidos e rascunho por usuário. O layout desktop permanece preservado; o rodapé não aparece nesta tela mobile.

Checagens isoladas: duas carteiras salvas renderizadas na ordem da referência, carteira conectada reconhecida, troca de provedor seguida de nova conexão permitida, sem overflow horizontal em 344 px e CTA habilitada somente com cotação/conexão válidas. A suíte E2E ainda precisa cobrir compra integral, falha e recuperação.

### Login mobile

O diálogo de autenticação abaixo de 768 px ocupa a tela toda e centraliza verticalmente o conteúdo de login e cadastro conforme as referências mobile. O cadastro traz marca Kurio, título “Criar perfil de colecionador”, campos de usuário, e-mail, senha e confirmação com controles de visibilidade, botão “Criar perfil”, opções sociais e atalho para entrar. Login, cadastro, sessão e validação continuam usando a API simulada existente; Google/Facebook e recuperação de senha continuam informativos, sem integração. No desktop, a composição anterior com abas permanece.

Checagens: a suíte Playwright confirma login, retomada de rota privada, conflito de cadastro e modal ocupando 390 × 844 px nos modos entrar/criar conta. A revisão visual final segue pendente.

### Executar e compilar

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Verifica tipos e gera o build de produção |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | Executa o Oxlint |
| `npm run test:e2e` | Executa os testes E2E Playwright com reset de mocks por cenário |
| `npm run audit:lighthouse` | Gera build com mocks, executa 12 medições e grava relatórios/medianas em `reports/lighthouse` |
| `npx playwright show-report` | Abre o relatório HTML da última execução |

No Windows, a suíte usa o Microsoft Edge instalado. Em outros sistemas, instale o Chromium com `npx playwright install chromium`.

Os testes iniciais cobriam busca, filtros/ordenação, rota direta, NFT inexistente, seleção de edições/preços, cupom após refresh, login com retomada de rota privada, conflito de cadastro, autenticação mobile e atualização de preços por Socket.IO. O relatório e os traces de falha são gerados localmente e ignorados pelo Git. A cobertura foi ampliada; consulte ARCHITECTURE.md e os arquivos em tests/e2e para os cenários atuais.

## Estado e próximos passos

Resultado final desta rodada: **33 testes Playwright passaram juntos**, incluindo regressão visual e projetos desktop/mobile. Build e typecheck passaram; lint concluiu com avisos de Fast Refresh. Relatório HTML em `reports/playwright/index.html`. Auditoria atualizada: performance mobile 70/74 (meta 90 não atingida), desktop 97/98; acessibilidade 100 mobile/97 desktop, boas práticas 100 e SEO 92. As 12 medições e a justificativa estão em `reports/lighthouse` e `ARCHITECTURE.md`. Deploy público permanece pendente. Os registros abaixo descrevem a evolução anterior; este resultado e os relatórios são a referência atual.

Validação ampliada: cenários de conta/compra/sessão, cotação obsoleta, estoque esgotado, recusa de carteira, reconexão de pedido pendente, eventos antigos/duplicados, cupom inválido/expirado, recibo imutável, rollback, foco de diálogo, skeletons e recuperação de erro estão na suíte. `npm run test:visual` compara 12 baselines versionadas em 390/768/1440 px; são referências da implementação, não prova de igualdade pixel a pixel com Figma. `npm run typecheck` verifica tipos separadamente. `.env.example` documenta a configuração do build de demonstração. Consulte a seção final de ARCHITECTURE.md para limites e evidências atuais.

Verificação conjunta após as correções: 18 testes Playwright passaram (2 workers). Build aprovado; lint concluído com avisos de Fast Refresh. A suíte inclui casos em viewport mobile, mas isso ainda não equivale à matriz completa desktop/mobile exigida. Regressão visual versionada, reconexão com pedido pendente, reconfirmação de cotação e revisão de acessibilidade ainda precisam de cobertura específica.

Conta e carteiras: teste E2E desktop validou alteração de nome/avatar/senha, recusa de senha atual incorreta, login com nova senha e cadastro das carteiras principal/secundária. Endereço inválido é recusado e dados confirmados permanecem após refresh. Build passou; lint executado com avisos de organização de exports para Fast Refresh.

Rollback de favoritos validado por E2E: MSW devolve HTTP 503 uma vez, com atraso determinístico; a interface seleciona otimisticamente, informa a falha e restaura o estado anterior. Refresh confirma que o favorito não foi gravado. Nova tentativa tem sucesso e persiste após refresh. Teste passou em desktop.

Expiração durante checkout validada: o endpoint de expiração invalida a sessão antes do envio, o login é solicitado e dados/itens são preservados. Após autenticar, reconectar e confirmar, existe apenas um pedido. Uma resposta HTTP 401 na criação agora remove a tentativa rejeitada, evitando bloquear a nova confirmação; tentativas de resultado incerto por timeout mantêm a chave de recuperação. Os testes de expiração e timeout passaram após a correção; build também passou.

Isolamento de pedidos validado por E2E: após compra confirmada do colecionador, Sato acessa a URL direta e recebe Pedido não encontrado, sem itens do recibo; REST retorna 404 e a lista de pedidos fica vazia. O bloqueio permanece após refresh. Ao autenticar novamente como dono, o mesmo recibo e total permanecem disponíveis. Esse cenário passou em desktop.

Dois testes E2E desktop percorrem adição de NFT como visitante, autenticação no checkout, preenchimento, conexão simulada e envio do pagamento. Confirmado: recibo persiste após refresh e carrinho esvazia. Recusado: estado persiste após refresh e item permanece no carrinho. Ambos passaram. O cenário de timeout também passou: a resposta excede os 8 segundos do Axios e o cliente recupera o pedido pela mesma chave. Os três cenários reenviam a requisição original aos handlers MSW e verificam o mesmo ID e apenas um pedido na conta. Os cenários também acionam Confirmar compra três vezes e verificam apenas um pedido. O checkout e recibo passaram em viewport 390 × 844 px (adição inicial realizada no desktop). Foi corrigido um bloqueio mobile: o CSS mantinha o diálogo fechado de autenticação visível e interceptando cliques; agora diálogos sem open permanecem ocultos. A compra integral desde o catálogo mobile passou em 390 × 844 px: card → detalhe → carrinho → checkout → login → conexão → recibo → refresh. A mensagem de carrinho passou a ignorar eventos de ponteiro, pois sobrepunha e bloqueava o botão de finalizar no mobile.

Teste E2E de sessão confirma persistência após refresh e bloqueio do perfil após logout. O teste de troca de usuário verifica perfil e favoritos com colecionador → Sato → colecionador, incluindo refresh e preservação dos favoritos originais. Ambos passaram em desktop. Isso não substitui a validação de isolamento de pedidos, carteiras e eventos em trânsito, ainda pendente.

Os ícones sociais preservam uma única moldura: Facebook, Instagram, Twitter e LinkedIn exibem o SVG completo em 30 × 30 px, pois o asset já inclui a borda. A borda adicional do link foi removida. YouTube usa o asset local Frame 112.svg, que também já contém sua moldura, sem borda adicional no link.

O copyright compartilhado ocupa toda a largura do rodapé (1200 px no frame-base), com caixa mínima de 30 px de altura, fonte 14 px/400, linha 30 px, tracking zero, cor #F5F1EB e alinhamento central. Pode crescer em telas estreitas para preservar o texto.

O selo de carteiras do rodapé ajusta a largura ao texto, evitando espaço vazio após COINBASE. Mantém altura de 26 px, raio 6 px, fundo #38220F, contorno interno de 1 px #55321F e padding de 7 px vertical / 10,5 px horizontal. Texto de 9 px/700, linha 100%, tracking de 0,1 px e #E89B55.

Na área inferior do rodapé, todos os títulos usam 18 px/700, linha de 16 px e #F5F1EB. Os links das três listas usam 14 px/400, linha de 30 px, #F5F1EB e tracking zero. As listas não somam gap entre linhas: cinco links ocupam 150 px, mantendo 8 px entre título e lista.

Links do rodapé compartilhado: padding 32 px no desktop, gap de 124 px entre colunas e 8 px entre título e lista. Redes sociais usam 20 px entre título e ícones, botões de 30 × 30 px com gap de 10 px, 32 px até Carteiras compatíveis e 12 px até o selo. A grade reduz para duas/uma coluna em telas menores, com gaps adaptados para preservar o conteúdo.

Faixa de contato e links usam a mesma grade no desktop, com padding horizontal de 32 px e gap de 124 px entre trilhas. KURIO/Meu perfil, frase/Central de ajuda, e-mail/Coleções e telefone/Redes sociais compartilham o mesmo início de coluna. Essa regra substitui o gap isolado de 92 px para priorizar o alinhamento vertical entre seções. Em tablet/mobile, ambas as grades se adaptam juntas, com gap de 24 px.

A faixa de contato do rodapé usa #F5F1EB: KURIO em texto de 14 px/700, linha 100%, tracking 10% e caixa 48 × 18 px; frase, e-mail e telefone em 14 px/400, linha 22 px e tracking zero. A frase tem largura-base 219 px e duas linhas; e-mail e telefone têm caixas-base de 143 × 22 px e 135 × 22 px.

Newsletter compartilhada: texto do campo 14 px/400, linha 16 px, tracking zero e #B39463; Enviar 18 px/700, linha 16 px e #140D0A numa caixa de texto 65 × 16 px; descrição 13 px/400, linha 22 px, largura máxima 325 px, altura mínima 89 px e #CFB28C. Os estilos se aplicam a todas as instâncias de `SiteFooter`.

Newsletter do rodapé compartilhado: recuo esquerdo de 17 px após a divisória, 16 px entre título e campo, 12 px entre campo e descrição e 53 px de respiro inferior. Campo e botão permanecem juntos em uma linha, com descrição abaixo e altura do grupo acompanhando o conteúdo.

Os três benefícios do rodapé compartilham tipografia: letras W/C/D de 24 px/700, linha 100% e #140D0A, centralizadas numa caixa de 15 × 32 px; títulos de 17 px/700, linha 16 px e #F5F1EB; descrições de 14 px/400, linha 22 px, largura 204 px e #CFB28C. Todos têm tracking zero e mantêm gap de 12 px no bloco de conteúdo.

O topo do `SiteFooter` usa padding de 32 px no topo/esquerda, 14 px à direita e 16 px na base no desktop. Os três benefícios têm gap de 12 px entre marcador, título e descrição, divisórias verticais de 1 × 202 px em #D28A4C e marcadores circulares de 74 × 74 px, raio 37 px e fundo #D28A4C. A newsletter ocupa a quarta coluna, proporcionalmente mais larga. Essas medidas são compartilhadas por home, detalhe, carrinho e pagamento.

Home, detalhe do NFT, carrinho e pagamento reutilizam `src/components/SiteFooter.tsx` e `SiteFooter.css` para benefícios/newsletter, faixa de contato, links, redes sociais, carteiras e copyright. A versão duplicada da home foi removida; ajustes no componente passam a valer nas quatro telas. A newsletter continua sendo uma confirmação demonstrativa local. A visibilidade do rodapé nos layouts mobile segue as regras de cada tela.

Cards do Diário da Cunhagem: largura-base 268 px, altura conforme o conteúdo, raio 8 px, fundo #241612 e distância de 24 px entre cards. O corpo usa padding superior 12 px e lateral/inferior 16 px; data/leitura, título, resumo e link são distribuídos por flex com gap de 8 px. Data/leitura e resumo usam 12 px/500, linha de 16 px e #CFB28C; título 16 px/700, linha 100% e #F5F1EB; Ler mais 12 px/700, linha 14 px e #E89B55, com seta separada 12 px/400. As caixas mínimas de texto são de 32, 42 e 32 px, respectivamente. O cabeçalho usa Roboto Mono, título 28 px/700 e subtítulo 14 px/400, centralizados e sem tracking. A grade centraliza uma, duas ou quatro colunas conforme a largura disponível.

Os cards de coleções em destaque agrupam imagem e texto, medem 586 × 250 px na largura-base desktop e usam fundo marrom #241612. Título, descrição e botão alinham-se à direita da área de texto; o botão mantém seu estilo anterior e fica 8 px abaixo da descrição. A descrição repete o hero (14 px/400, linha 24 px, tracking zero, #CFB28C). A seção usa 120 px laterais a partir das bordas da página desktop, compensando o padding do container principal para não duplicá-lo. O grupo tem gap de 28 px; em telas menores os cards reduzem a largura, podem crescer em altura para não cortar textos e passam a uma coluna abaixo de 1024 px. Cada imagem recorta um círculo decorativo de 256 × 256 px, top 134 px, left -199 px e borda de 1 px #D28A4C. O branco #FBFBFB do painel de propriedades foi substituído pelo marrom da referência visual por decisão do usuário.

Alterações do preço-base pelo endpoint `/api/demo/nfts/:id` recalculam proporcionalmente os preços das edições, com inteiros em wei e truncamento somente na última casa (1 wei). Overrides explícitos de uma edição no inventário mantêm prioridade. Catálogo mostra o preço da edição padrão; detalhe, carrinho e cotação usam o preço da edição selecionada. O evento Socket.IO publica o mesmo inventário servido por REST e invalida carrinho/cotação; uma cotação anterior deixa de ser válida se seus valores mudarem. O recibo mantém o snapshot original. O teste de regressão cobre atualização sem refresh, edições, nova cotação, evento antigo e precisão de 18 casas; compra com reconfirmação e recibo ainda requer teste integral.

Os nomes de todos os cards do catálogo desktop usam 16 px/400, linha de 16 px, tracking zero e #F5F1EB; preços atuais usam 18 px/700, linha de 16 px, tracking zero e #E89B55. Os textos de ordenação usam 15 px/400, linha de 100%, caixa de 20 px, tracking zero e #F5F1EB. O seletor reserva largura adicional para a seta para evitar sobreposição e truncamento.

As três abas do catálogo desktop usam fonte 15 px/500, linha de 16 px e tracking zero. Abas inativas usam #F7F3EC; a selecionada usa #E89B55 e sublinhado da mesma cor. O estado selecionado acompanha os parâmetros de ordenação da URL.

No destaque lateral, o título usa caixa 270 × 32 px, fonte 24 px/700, linha de 32 px e #E89B55. Oferta limitada usa caixa 270 × 16 px, fonte 22 px/700, linha de 16 px, alinhamento central e #F5F1EB. Ambos têm tracking zero. A arte mantém 310 × 368 px e raio de 22 px.

Faixa de preço e Rede usam títulos 18 px/700, linha de 16 px e #F5F1EB. O preço usa 15 px/400, linha de 100% numa caixa de 20 px; Aplicar usa 16 px/700, linha de 20 px e #140D0A. Redes usam nomes 15 px/400 e contagens 15 px/700 à direita, linha de 40 px; #CFB28C sem seleção e #E89B55 selecionadas. A trilha de preço tem 4 px em #D28A4C, com marcadores circulares e borda escura; os limites continuam derivados da API.

Coleções no filtro desktop: título 18 px/700, linha 16 px e cor #F5F1EB; nomes 15 px/400 e contagens 15 px/700, ambos com linha de 40 px e tracking zero. Contagens têm largura mínima de 37 px e alinhamento à direita. Nome e número usam #CFB28C sem seleção e #E89B55 quando selecionados, mantendo os valores reais da API.

Tipografia do hero desktop: boas-vindas 14 px/500, linha 16 px e tracking 10%; título 43 px/700, linha 70 px e tracking zero; descrição com largura máxima de 557 px, 14 px/400, linha 24 px, tracking zero e cor #CFB28C. Boas-vindas e título usam #F5F1EB. A família permanece Roboto Mono enquanto o token `font/family` do Figma não revelar seu nome real.

O contador dos ícones de carrinho soma as quantidades de todas as linhas/edições confirmadas pela API. Aparece a partir de uma unidade e fica oculto quando vazio; acompanha inclusão, alteração de quantidade, remoção e conclusão da compra pelo estado do TanStack Query.

A navegação principal da home desktop segue o grupo de 401 × 45 px da referência: fonte monoespaçada de 16 px, line-height de 100%, caixas de texto de 21 px de altura, espaçamento entre letras zero, peso 700 em Início e 400 nos demais itens, distribuídos horizontalmente e indicador ativo de Início com 58 px de largura na base do grupo.

As contagens de coleções e redes são calculadas em cada `GET /api/nfts` sobre todo o catálogo, antes dos filtros e da paginação. Contam NFTs distintos, não unidades de edição ou estoque. Categorias sem itens mostram zero. Ao adicionar NFTs às fixtures, as próximas consultas já recalculam os números; Axios transporta a resposta e TanStack Query atualiza a interface ao refazer a consulta, recuperar foco ou receber invalidação por Socket.IO. Não existe endpoint de criação de NFT nesta simulação. Um teste E2E compara todas as contagens com o catálogo completo e com os totais de cada filtro.

Os filtros desktop usam grupos com gap de 40 px (Coleções, Faixa de preço e Rede), 12 px entre título e opções, opções de 40 px de altura e recuo de 12 px. Coleções tem recuo dos dois lados (246 px úteis na lateral-base); Rede tem apenas recuo esquerdo (258 px úteis). O formulário de preço usa gap de 12 px entre seus controles e cresce com o conteúdo.

No catálogo desktop, o padrão medido do Figma é lateral → produtos 48 px, abas → cards 32 px, abas entre si 20 px, colunas 34 px, linhas 72 px, arte → nome 12 px e nome → preço 12 px. O frame-base dos cards é 258 × 300 px; todas as imagens são quadradas de 250 × 250 px, centralizadas, com 4 px nas laterais e 25 px acima/abaixo na largura-base. As proporções são preservadas ao redimensionar. A lateral usa padding de 20 px nos quatro lados e mantém 24 px antes do destaque. O destaque tem 24 px de padding superior e preserva 94 px abaixo da imagem, sem fundo marrom nesse espaço; o fundo decorativo termina junto à imagem.

O bloco inicial desktop usa os gaps fornecidos do Figma: cabeçalho → hero 32 px; texto → imagem 110 px na largura-base de 1440 px; boas-vindas → título 8 px; título → descrição 4 px; descrição → botão 32 px; bloco inicial → catálogo 96 px. O texto tem deslocamento superior de 43 px e recuo esquerdo de 40 px no desktop. A regressão visual das quatro telas principais foi adicionada em três larguras; ela registra a implementação e não substitui comparação humana com Figma.

Os fluxos usam MSW na rede, Axios, TanStack Router/Query e Socket.IO Client. A suíte cobre compra/conta e falhas, com baselines das telas principais em 390/768/1440 px. Build, verificação de tipos e lint estão disponíveis. O lint mantém avisos de organização de exports para Fast Refresh. A publicação pública foi adiada pelo usuário; ainda é obrigatória para a entrega.

As medianas Lighthouse mobile atuais de 70/74 continuam abaixo da meta de 90 e estão justificadas em ARCHITECTURE.md. Não foram consideradas aprovadas. A automação de regressão detecta alterações futuras, mas não certifica igualdade absoluta com Figma nem toda combinação possível de leitor de tela e zoom.

Comandos adicionais: `npm run typecheck`, `npm run test:visual` e `npx playwright test --update-snapshots` (somente para atualização intencional das baselines). Elas foram geradas no Windows/Chromium Edge; outro ambiente pode exigir referências próprias. O último relatório HTML de entrega fica em `reports/playwright/index.html`.
## Escopo da simulação

Autenticação, carteiras e pagamentos são simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento não fazem parte do desafio.
