# Kurio — NFT Marketplace

Marketplace de NFTs em React e TypeScript, com descoberta, compra e conta do colecionador. Autenticação, carteiras, pagamentos, REST e eventos são simulados no navegador com MSW. **Não exige MetaMask instalada, saldo, backend privado ou transação real.**

- [Repositório](https://github.com/DescomplicaDevDan/nft-marketplace)
- [Figma do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1)
- **URL pública: pendente de publicação. O deploy é obrigatório na entrega.**
- [Arquitetura, decisões e limitações](ARCHITECTURE.md)

## 1. Instalação e execução

Requisitos do Vite instalado: Node.js `^20.19.0` ou `>=22.12.0`, npm e navegador moderno. O ambiente usado nos relatórios está registrado em `reports/lighthouse/summary.json`.

```bash
git clone https://github.com/DescomplicaDevDan/nft-marketplace.git
cd nft-marketplace
npm ci
npm run dev
```

Abra a URL exibida pelo Vite. Use essa mesma origem e porta nos passos abaixo; `localhost` e `127.0.0.1` têm armazenamentos separados. Os mocks são ativados automaticamente em desenvolvimento.

### Build de demonstração

Copie `.env.example` para `.env.local` e mantenha:

```dotenv
VITE_ENABLE_MOCKS=true
```

Depois execute:

```bash
npm run build
npm run preview
```

Alternativa no PowerShell, sem criar arquivo:

```powershell
$env:VITE_ENABLE_MOCKS="true"
npm run build
npm run preview
```

No build publicado, configure a mesma variável no provedor e gere o build novamente. A aplicação de demonstração depende dos mocks; apenas iniciar `preview` não altera uma configuração já compilada. O MSW usa Service Worker: execute por HTTP em localhost ou HTTPS na publicação, não abrindo `dist/index.html` diretamente.

## 2. Contas e navegação

| Conta | E-mail | Senha inicial |
| --- | --- | --- |
| Colecionador | `colecionador@kurio.demo` | `Kurio123!` |
| Sato | `sato@kurio.demo` | `Sato123!` |

Também é possível criar uma conta em **Entrar → Criar conta**. Use nome de usuário e e-mail ainda não cadastrados, senha de pelo menos oito caracteres e confirmação igual. As senhas da tabela voltam ao valor inicial após reset.

| Rota | Uso |
| --- | --- |
| `/` | Início, catálogo, busca e filtros |
| `/nft/nft-001` | Exemplo de detalhe do Emerald Ape |
| `/cart` | Carrinho, quantidades e cupom |
| `/checkout` | Pagamento e conexão simulada |
| `/profile` | Dados do perfil, avatar e senha |
| `/wallets` | Carteiras principal e secundária |
| `/favorites` | Favoritos da conta |
| `/orders` | Pedidos da conta |
| `/orders/:orderId` | Estado e recibo de um pedido |
| `/explorer/:orderId` | Referência da transação simulada |
| `/demo` | Configuração de falhas e reset |

Checkout, perfil, carteiras, favoritos e pedidos exigem login. A rota solicitada é retomada após autenticação. No mobile, o acesso ao perfil fica na navegação inferior; as rotas também podem ser abertas diretamente.

## 3. Carteiras: cadastrar e usar

**As contas começam sem carteiras cadastradas. Salvar uma carteira e conectá-la no pagamento são ações diferentes.** Os endereços abaixo são fictícios para a demonstração; nenhum saldo é consultado.

### Cadastrar a principal

1. Entre como colecionador e abra `/wallets` ou **Meu perfil → Carteiras**.
2. Preencha o formulário **Carteira principal** conforme a tabela.
3. Clique em **Salvar carteira** e aguarde **Carteiras atualizadas**.
4. Atualize a página para conferir a persistência.

| Campo | Exemplo válido |
| --- | --- |
| Nome de exibição | `Colecionador Demo` |
| Apelido da carteira | `Principal` |
| Rede | `Ethereum` |
| Nome do perfil | `colecionador` |
| Endereço da carteira | `0x1111111111111111111111111111111111111111` |
| ENS ou carteira secundária | Deixe vazio; é opcional |
| Tipo de carteira | `MetaMask` |
| Código de indicação | `KURIO` |
| E-mail | `colecionador@kurio.demo` |
| Nome ENS | `colecionador` |

**Código de indicação e Nome ENS são obrigatórios nesta implementação.** No campo ENS, use somente o nome, sem `.eth`; o sufixo é selecionado separadamente no checkout. O código de indicação precisa ser preenchido, mas não aplica desconto: cupons são informados no carrinho.

### Cadastrar a secundária ou reutilizar a principal

- Em **Carteira secundária**, clique em **Adicionar**, preencha e salve. Exemplo: apelido `Reserva`, endereço `0x2222222222222222222222222222222222222222`, rede `Polygon` e tipo `Coinbase Wallet`; os demais campos seguem o exemplo anterior.
- Ou marque **Igual à carteira principal**, depois de salvar a principal. O checkout poderá reutilizá-la.
- Para editar, altere os campos do formulário correspondente e salve novamente.
- Os botões **Remover carteira principal/secundária** removem o cadastro. Remover a principal desmarca sua reutilização.

### Regras de endereço

| Rede | Formato aceito |
| --- | --- |
| Ethereum / Polygon | `0x` seguido de exatamente 40 caracteres hexadecimais |
| Solana | 32 a 44 caracteres Base58, sem `0`, `O`, `I` e `l` |

Na simulação, rede, endereço e provedor são validados por formato. A taxa demonstrativa é exibida em ETH inclusive nas demais redes; não representa taxas reais de Polygon/Solana. ENS e indicação não são consultados em serviços externos.

### Conectar no pagamento

1. Coloque um NFT no carrinho e abra **Conectar e finalizar**.
2. No desktop, escolha **Carteira salva → Principal/ Secundária**. No mobile, toque no cartão da carteira.
3. Confira os dados do colecionador. No mobile, use **Editar dados do colecionador** se precisar preencher ou corrigir campos.
4. Selecione o provedor em **Carteira e rede**: WalletConnect, MetaMask ou Coinbase Wallet.
5. Clique em **Conectar carteira**. Não será aberta nenhuma extensão.
6. Aguarde a confirmação da conexão e confira o total antes de **Confirmar compra**.

Alterar endereço, rede ou provedor exige conectar novamente. **Trocar carteira**, no mobile, abre o gerenciamento de carteiras; depois retorne ao checkout. **Desconectar**, disponível também no mobile após a conexão, encerra a conexão simulada da sessão e bloqueia Confirmar compra até conectar novamente. Logout/novo login exigem nova conexão. O preenchimento manual também é permitido no desktop, com os mesmos campos obrigatórios e regras.

## 4. Catálogo, detalhe e favoritos

- Use a busca por NFT, coleção ou artista. No desktop, abra o ícone de busca; no mobile, use **Explorar coleções**.
- Combine coleção, rede e faixa de preço. O botão **Aplicar** confirma o preço; mudar filtros reinicia a paginação.
- Ordene por recentes, popularidade, menor ou maior preço. No mobile, opções adicionais ficam no botão de filtros.
- Busca, filtros, ordenação e página ficam na URL, preservados em refresh e histórico.
- As contagens representam NFTs distintos do catálogo completo, antes dos filtros. Uma categoria com zero ou uma combinação sem correspondências pode mostrar resultado vazio.
- No detalhe, selecione edição e quantidade. Cada edição possui preço e estoque próprios. Edições esgotadas ficam indisponíveis.
- O coração adiciona/remove favoritos; exige login e persiste por conta. A estrela `4.8 (19)` é avaliação demonstrativa, não o botão de favorito.
- A galeria usa os assets locais disponíveis; miniaturas podem repetir a mesma arte quando não existem imagens alternativas.

## 5. Carrinho e compra completa

1. Abra `/nft/nft-001`, selecione uma edição disponível e use **COMPRAR** (desktop) ou **Comprar NFT** (mobile).
2. Abra `/cart`; confira edição, quantidade, valores e estoque. Use `+`, `−` e a lixeira para ajustar itens.
3. Opcionalmente aplique um cupom da tabela abaixo.
4. Clique em **Conectar e finalizar**, entre na conta e utilize uma carteira cadastrada conforme a seção anterior.
5. Confira os campos obrigatórios e o total calculado pela API. Clique em **Confirmar compra**.
6. O pedido passa por processamento. Só o estado `confirmed` mostra o recibo confirmado.
7. Consulte `/orders` ou atualize a página do pedido para recuperar o estado.

| Cupom | Resultado |
| --- | --- |
| `KURIO10` | Desconto de 10% |
| `EXPIRADO` | Erro de cupom expirado |
| Qualquer código não cadastrado | Erro de cupom inválido |

Use **Remover cupom** para recalcular sem desconto. O carrinho do visitante é unido ao da conta ao autenticar. Cada linha é identificada por NFT + edição. Após confirmação são removidas apenas as quantidades compradas; em recusa os itens são preservados. Estoque consumido por pedidos afeta as próximas compras; use reset para voltar ao catálogo inicial.

Valores ETH trafegam como strings e são calculados em inteiros wei (`BigInt`), preservando até 18 casas decimais. A cotação valida preços, estoque, cupom e taxa; dura até dois minutos e é reconsultada periodicamente. A taxa-base demonstrativa é `0.016 ETH`. O recibo armazena os valores do pedido e não muda quando o catálogo é alterado depois.

### Botão bloqueado ou total “— ETH”

O checkout permanece bloqueado sem cotação válida, durante atualização ou com erro de estoque/conexão. Leia a mensagem acima do resumo e use **Recalcular total**. Se houver estoque insuficiente, reduza a quantidade ou remova o item. Se um cenário de falha estiver ativo, volte a `/demo` e selecione funcionamento normal. Não basta preencher o endereço: no checkout é necessário conectar a carteira e completar os dados obrigatórios.

## 6. Perfil e sessão

Em `/profile`, edite nome, usuário, e-mail, ENS e apelido; clique em **Salvar**. Avatar aceita PNG/JPEG/WebP de até 2 MB e pode ser alterado/removido. Para trocar senha, informe a atual, uma nova de pelo menos oito caracteres e confirmação igual. E-mail/usuário de outra conta geram conflito.

A sessão dura 30 minutos e é recuperada após refresh. Operações privadas revalidam a sessão; expiração solicita login e permite retomar o fluxo. Erro de rede não equivale a logout. Tokens e dados demonstrativos ficam no armazenamento do navegador; senhas são persistidas como hash SHA-256, não em texto puro. Isso é uma simulação local, não um serviço de autenticação de produção. As contas isolam perfil, carteiras, favoritos e pedidos; logout cancela consultas privadas e encerra subscriptions da sessão anterior.

## 7. Falhas reproduzíveis e reset

Abra `/demo` na mesma origem da aplicação. Escolha cenário, caminho da API, método, seed, atraso, probabilidade e se deve executar apenas uma vez; clique em **Aplicar cenário**. A configuração altera falhas da rede simulada, sem apagar os dados existentes.

| Cenário | Como exercitar |
| --- | --- |
| Catálogo vazio | Alvo `/api/nfts`, GET; abra o catálogo |
| Latência variável | `/api/nfts`, GET; observe skeletons |
| Respostas fora de ordem | `/api/nfts`, GET; faça buscas rápidas sucessivas |
| Falha de rede / erro 503 | Alvo do recurso desejado; observe erro e recuperação |
| Validação 400 | `/api/profile`, PUT; tente salvar |
| Conflito 409 | `/api/auth/signup`, POST; tente cadastrar |
| Sessão expirada | `/api/`, ALL; faça uma operação autenticada |
| Timeout de requisição | Aguarda 10 s e falha antes de executar a operação; Axios expira em 8 s |

Para erro persistente, desmarque **Executar apenas uma vez**, pois algumas consultas repetem automaticamente. Use probabilidade `1`, seed `42` e atraso `1500` para um exemplo reproduzível. Reaplicar reinicia o contador; consultas automáticas também contam. Endpoints `/api/demo/*` e login/logout continuam acessíveis para recuperação.

**Restaurar dados iniciais** apaga somente os dados da simulação nesta origem: contas criadas, alterações de senha, sessões, carteiras, favoritos, carrinhos, pedidos, inventário, tentativas e rascunhos. Restaura 36 NFTs e as duas contas iniciais. Recarregue outras abas após reset. Não é executado automaticamente ao iniciar.

### Pagamento recusado, timeout e conexão recusada

No desktop, no checkout:

- **Resposta da carteira → Recusar conexão**: clique em conectar; a compra fica bloqueada. Troque para autorizar e tente novamente.
- **Resultado do pagamento → Recusar pagamento**: confirme; o pedido termina recusado e preserva os itens.
- **Resultado do pagamento → Demorar resposta e recuperar pedido**: o servidor cria o pedido antes do timeout. O cliente consulta a tentativa pela mesma chave. Se aparecer a área de recuperação, use **Verificar pedido** ou **Reenviar a mesma solicitação**.

O timeout do pagamento é diferente do timeout genérico de `/demo`: o primeiro permite simular perda de resposta depois da criação. Reenvios usam `Idempotency-Key`; mesma chave/payload recupera o mesmo pedido, conteúdo diferente gera `409`. Não reinicie o cenário nem crie outra tentativa para recuperar o pedido existente.

Os seletores auxiliares de cenário ficam ocultos no layout mobile para preservar a composição. Para configurar essas falhas, use a largura desktop; os testes mobile usam os mesmos handlers.

### Preço, estoque e eventos Socket.IO

Execute os exemplos no console do navegador, na aplicação já aberta. São controles do ambiente de demonstração; não alteram o código-fonte.

```js
var demoHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('kurio-session-token') ?? ''}`,
  'X-Guest-Cart': localStorage.getItem('kurio-guest-cart-id') ?? '',
}

// Com o NFT no carrinho/checkout, altere o preço e entregue evento duplicado.
await fetch('/api/demo/nfts/nft-001', {
  method: 'POST', headers: demoHeaders,
  body: JSON.stringify({ priceEth: '1.25', delivery: 'duplicate' }),
})

// Esgote o estoque; a compra deve ser bloqueada.
await fetch('/api/demo/nfts/nft-001', {
  method: 'POST', headers: demoHeaders,
  body: JSON.stringify({ available: 0, delivery: 'out-of-order' }),
})

// Durante um pedido pendente, interrompa o socket por cinco segundos.
await fetch('/api/demo/realtime/disconnect', {
  method: 'POST', headers: demoHeaders,
  body: JSON.stringify({ durationMs: 5000 }),
})

// Expire a sessão antes de uma operação privada.
await fetch('/api/auth/expire', { method: 'POST', headers: demoHeaders })
```

Após novo login, recrie `demoHeaders` com o token atual. Para testar só uma alteração, comece pelo reset e faça um exemplo por vez. Preço-base recalcula os preços das edições; contagens refletem o catálogo. A reconciliação REST recupera recursos ativos após reconexão. Eventos antigos/duplicados são descartados por identidade e versão, e eventos de pedidos são isolados por conta.

Para repetir eventos de um pedido e emitir uma versão antiga depois da atual, envie `POST /api/demo/orders/ID_DO_PEDIDO/events` com os mesmos headers, autenticado como dono. Pedido confirmado/recusado é terminal.

## 8. Stack e contratos

React + TypeScript; TanStack Router nas rotas/parâmetros/proteção; TanStack Query nas consultas/mutations/cache; Axios no REST; `socket.io-client` no tempo real; Tailwind CSS e controles shadcn/ui adaptados; MSW na rede; Playwright em testes e screenshots; Lighthouse nas auditorias. Vite gera o build.

| Recurso | Contratos |
| --- | --- |
| Sessão | `POST /api/auth/signup`, `/login`, `/logout`, `/expire`; `GET /api/auth/me` |
| NFTs | `GET /api/nfts`, `GET /api/nfts/:id` |
| Favoritos | `GET /api/favorites`; `PUT` e `DELETE /api/favorites/:id` |
| Carrinho | `GET /api/cart`; `POST /api/cart/merge`; `PUT` e `DELETE /api/cart/items/:id` |
| Cupom/cotação | `PUT` e `DELETE /api/cart/coupon`; `POST /api/cart/quote` |
| Pedidos | `POST /api/orders`; `GET /api/orders`, `/api/orders/:id`, `/api/orders/by-key/:key` |
| Perfil | `GET` e `PUT /api/profile` (inclui avatar/senha) |
| Carteiras | `GET` e `PUT /api/wallets`; `DELETE /api/wallets/:slot` |
| Conexão | `GET`, `POST` e `DELETE /api/wallet-connection` |
| Demonstração | `GET`/`PUT /api/demo/scenario`; `POST /api/demo/reset`; controles de eventos acima |

A listagem aceita `search`, `category`, `network`, `minPrice`, `maxPrice`, `sort`, `page` e `pageSize`. Ordenação: `recent`, `popular`, `price-low`, `price-high`. Retorna itens, total, página, contagens de coleção/rede e faixa de preço.

`CartQuote` contém `id`, `cartVersion`, `expiresAt`, `items`, `subtotalEth`, `discountEth`, `networkFeeEth`, `totalEth` e `coupon`. Pedido recebe `quoteId`, `connectionId`, `wallet`, `collector` e `scenario`, com header `Idempotency-Key`. Retorna `id`, `status` (`pending`, `confirmed`, `rejected`), versão, itens/snapshot e valores; confirmação inclui referência simulada. Tipos completos: `src/features/catalog/types.ts`, `src/features/commerce/quoteTypes.ts`, `orderTypes.ts` e `src/features/profile/walletApi.ts`.

Erros usam mensagem e, nos contratos aplicáveis, `code`, erros de formulário ou cotação atualizada. São representados 400/422 (validação/cupom), 401 (sessão), 403 (recusa), 404 (recurso ausente), 409 (conflito), 503 (falha transitória) e falhas de rede/timeout.

Eventos `nft.updated` e `order.updated` usam `{ id, resourceId, version, payload }`; pedidos incluem `userId`. MSW intercepta WebSocket com extensão própria compatível com os frames utilizados de Engine.IO v4/Socket.IO, exercitando o cliente real. Não existe servidor Socket.IO remoto. O suporte é limitado ao protocolo usado nesta demonstração; não é uma implementação geral do servidor Socket.IO.

### Cache, retries e persistência

Chaves incluem parâmetros do catálogo, ID do NFT e dono dos dados privados. Axios recebe o `AbortSignal` das consultas; mutations e eventos invalidam recursos relacionados. Favoritos são otimistas com rollback. Mutations de negócio não recebem retry automático; pedidos incertos recuperam pela chave, evitando duplicação. Sessão tem `staleTime` de 30 s e revalidação periódica; carrinho/carteiras/favoritos usam retries específicos dos hooks, e catálogo segue o padrão do TanStack Query. Cotação depende da versão do carrinho e é revalidada a cada minuto. Logout cancela/limpa cache privado. Mocks persistem no localStorage; rascunhos do checkout ficam no sessionStorage por usuário/aba.

## 9. Comandos e evidências

| Comando | Função |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks automáticos |
| `npm run build` | Tipos e build de produção |
| `npm run preview` | Servir o build; mocks dependem da variável no momento do build |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | Oxlint |
| `npm run test:e2e` | Suíte completa Playwright |
| `npm run test:visual` | Regressão visual |
| `npx playwright show-report` | Último relatório gerado localmente |
| `npm run audit:lighthouse` | Build com mocks e 12 medições Lighthouse |

No Windows os testes usam Edge instalado. Em outro ambiente, execute `npx playwright install chromium`. Baselines versionadas foram produzidas no Windows/Edge; outra plataforma pode precisar de baselines próprias. Atualize com `npx playwright test visual.spec.ts --update-snapshots` somente após revisar uma mudança visual intencional.

- [Relatório HTML funcional](reports/playwright/index.html): última execução integral arquivada, 33 testes aprovados. Após essa execução, a exposição do botão Desconectar no mobile foi validada por teste adicional de compra com desconexão/reconexão, também aprovado; build passou.
- [Resumo de cobertura](reports/playwright/README.md) e testes em `tests/e2e`.
- 12 baselines de início/detalhe/carrinho/pagamento em 390, 768 e 1440 px, em `tests/e2e/visual.spec.ts-snapshots`.
- Execuções futuras geram `playwright-report` e `test-results`, ignorados pelo Git. Traces são retidos quando há falha.
- [Lighthouse: relatório e condições](reports/lighthouse/README.md), HTML/JSON individuais e `summary.json`.

### Lighthouse: medianas registradas

Três medições por tela/perfil, com build otimizado, mocks ativos e navegador headless. A auditoria não é reexecutada após cada refinamento de CSS; consulte o timestamp e ambiente do relatório.

| Tela/perfil | Performance | Acessibilidade | Boas práticas | SEO |
| --- | ---: | ---: | ---: | ---: |
| Início mobile | 70 | 100 | 100 | 92 |
| Detalhe mobile | 74 | 100 | 100 | 92 |
| Início desktop | 97 | 97 | 100 | 92 |
| Detalhe desktop | 98 | 97 | 100 | 92 |

**A meta de performance mobile ≥90 não foi atingida.** LCP 4309/4137 ms e TBT 593/490 ms mostram atraso de conteúdo e custo de JavaScript; inicialização dos mocks/aplicação contribui para o gargalo. CLS e demais métricas estão nos relatórios. As outras categorias atingiram suas metas. A justificativa não equivale a atingir a pontuação esperada.

## 10. Conferência das obrigatoriedades e limites

| Grupo | Evidência / estado |
| --- | --- |
| Uso efetivo da stack | Identificado no código, nos fluxos e nos comandos |
| Compra e conta funcionais | Testes de compra desktop/mobile, perfil, avatar, senha, carteiras e cadastro |
| Confirmação pela simulação | Pedido confirmado depende da API; recusa preserva itens |
| Isolamento por usuário | Testes de perfil/favoritos e bloqueio de recibo de outra conta |
| Tempo real | Cliente Socket.IO + handlers MSW; preço/estoque, versões e recuperação de pedido testados |
| Falhas e recuperação | Timeout/idempotência, expiração, cotação antiga, estoque, recusa de carteira, cupons e rollback testados |
| Testes executáveis e visuais | Suíte Playwright, relatório HTML e baselines versionadas |
| Responsividade/acessibilidade | Overflow, foco e desconexão/reconexão mobile testados; revisão humana integral não certificada |
| Lighthouse | Auditoria entregue; performance mobile abaixo da meta, com justificativa |
| Publicação e refresh público | **Pendente: deploy e URL pública obrigatórios** |

Não é correto declarar 100% de aderência ao desafio enquanto falta o deploy, a meta mobile não foi atingida e a inspeção manual integral não foi concluída. Testes e auditorias reduzem risco; não garantem aprovação pelo avaliador.

Assets e Roboto Mono são locais. Onde o Figma informou apenas o token `font/family`, a família foi inferida das referências disponíveis. Há adaptações de foco, feedback e componentes; detalhes em `ARCHITECTURE.md`. Login social, recuperação de senha e áreas auxiliares fora do escopo não executam integrações reais e exibem comportamento informativo. Não há publicação editorial, suporte, ofertas ou downloads reais. O explorador e a referência de transação são simulados.

## 11. Publicar na Vercel

O arquivo `vercel.json` já define Vite, instalação por `npm ci`, saída `dist`, build com `VITE_ENABLE_MOCKS=true` e fallback de rotas para `index.html`. O worker do MSW usa cache revalidável. Não é necessário contratar backend ou serviço Socket.IO. [Referência oficial de Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite).

1. Envie os commits ao GitHub com `git push origin master`.
2. Na Vercel, abra **Add New → Project** e importe `DescomplicaDevDan/nft-marketplace`.
3. Selecione a raiz do repositório como **Root Directory** e o preset **Vite**. Use uma versão Node compatível (por exemplo, 22.x a partir de 22.12).
4. Mantenha a configuração versionada: instalação `npm ci`, build `VITE_ENABLE_MOCKS=true npm run build` e saída `dist`. O build command já ativa os mocks; se substituir esse comando no painel, configure `VITE_ENABLE_MOCKS=true` nas variáveis de Production/Preview e reconstrua.
5. Clique em **Deploy** e aguarde a URL HTTPS.
6. Na URL pública, abra `/demo`, depois `/nft/nft-001` diretamente e atualize. Faça login, cadastre uma carteira e conclua uma compra. Verifique um evento de preço pelo roteiro da seção 7.
7. Confirme que `https://SUA_URL/mockServiceWorker.js` retorna JavaScript; a página do marketplace não deve aparecer nesse endereço. Mantenha a aplicação pública durante a avaliação e registre a URL na seção inicial deste README.

Pré-validação local do build publicado (não substitui teste na URL pública):

```powershell
$env:VITE_ENABLE_MOCKS="true"
npm run build
# Terminal 1: mantenha o preview aberto
npm run preview -- --host 127.0.0.1 --port 4175 --strictPort
# Terminal 2: execute os testes
npx playwright test --config=playwright.preview.config.ts --workers=2
```

A pré-validação passou em três testes; o HTML está em `reports/production-smoke/index.html`. Essa configuração executa compras desktop/mobile e atualização de preço via Socket.IO contra `vite preview`, sem servidor de desenvolvimento. Os relatórios gerados são marcados em `.gitattributes` para não dominar as estatísticas de linguagens do GitHub; permanecem disponíveis no repositório. `.vercel/` é ignorado para evitar versionar configurações locais da ferramenta.
