# NFT Marketplace

Frontend de um marketplace de NFTs desenvolvido para um desafio técnico. O objetivo é implementar descoberta de NFTs, compra simulada e área do colecionador com React e TypeScript.

> Em desenvolvimento: as telas desktop estão montadas; catálogo, autenticação, favoritos, perfil, carteiras, carrinho, cotação e cupons já usam a API simulada. Pedidos ainda precisam ser integrados antes da revisão funcional e mobile.

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

É possível criar, editar e remover as carteiras principal e secundária. “Igual à carteira principal” exige uma principal salva e reutiliza seus dados; remover a principal desativa essa opção. Campos obrigatórios incluem indicação e ENS. A API verifica e-mail, rede, tipo e formato do endereço: Ethereum/Polygon com `0x` e 40 caracteres hexadecimais; Solana com 32 a 44 caracteres Base58. A validação é de formato, sem consulta à blockchain. Falhas preservam o formulário; mudanças só aparecem como salvas após a resposta da API. A seleção dessas carteiras no checkout será integrada na etapa de compra.

ENS e indicação também são obrigatórios no formulário de pagamento. Os testes completos dos fluxos serão realizados na revisão final solicitada; esta etapa passou pela compilação TypeScript/Vite.

### Carrinho de visitante e conta

O carrinho usa `GET /api/cart`, `PUT /api/cart/items/:id` (adicionar ou definir quantidade), `DELETE /api/cart/items/:id` e `POST /api/cart/merge`. O visitante recebe um identificador local enviado no cabeçalho `X-Guest-Cart`; contas usam a sessão. O MSW separa seus carrinhos e persiste as alterações. O cache usa `['cart', owner]`.

Ao carregar o carrinho autenticado, a API une os itens do visitante aos da conta, soma quantidades e ajusta ao estoque com aviso. A gravação e o esvaziamento do carrinho visitante ocorrem juntos, permitindo repetir a operação sem duplicar itens. A leitura autenticada repete essa operação idempotente para recuperar falhas de rede. Logout não transforma os itens privados em itens de visitante.

A quantidade selecionada no detalhe é enviada ao carrinho. A API recusa quantidades inválidas ou acima do estoque. Alterações aguardam confirmação, bloqueiam cliques concorrentes e mostram falhas; a lista retorna todos os itens, sem o limite da primeira página do catálogo. O carrinho compartilhado antigo não é importado. O checkout lê itens e totais da API; a criação/confirmação de pedidos ainda é demonstrativa. Nesta etapa, a confirmação antiga não esvazia o carrinho da API; a remoção das quantidades compradas será responsabilidade da futura API de pedidos. Compilação verificada; testes completos seguem para a revisão final.

### Cotação e cupons

`POST /api/cart/quote` cria uma cotação com ID, versão do carrinho, itens, subtotais por item, desconto, taxa e total em strings decimais de ETH. Os cálculos usam inteiros em wei (18 casas), sem ponto flutuante. O desconto percentual é arredondado para baixo ao wei. A taxa simulada é `0.016 ETH`. Uma cotação válida com os mesmos dados é reutilizada por até dois minutos. O cache usa `['quote', owner, cartVersion]` e revalida a cada minuto enquanto a aplicação está aberta.

`PUT /api/cart/coupon` aplica um código; `DELETE /api/cart/coupon` remove. O cupom pertence ao carrinho e persiste após atualizar a página. Na união de carrinhos, o cupom da conta tem prioridade; se não houver, usa o do visitante. Alterar itens ou cupom gera uma nova versão e recalcula os totais. Carrinho e pagamento usam a mesma resposta da API; avançar fica bloqueado enquanto calcula ou se a cotação falhar.

| Código de demonstração | Resultado |
| --- | --- |
| `KURIO10` | Desconto de 10% sobre o subtotal, sem desconto na taxa |
| `EXPIRADO` | Erro de cupom expirado (`422`, `coupon_expired`) |
| Qualquer outro | Erro de cupom inválido (`422`, `coupon_invalid`) |

Exemplo: subtotal `1.19`, desconto `0.119`, taxa `0.016`, total `1.087 ETH`. Aplicações recusadas preservam o cupom e os totais anteriores. Estoque insuficiente bloqueia a cotação com `409`. A revalidação final com reconfirmação de mudanças e o processamento idempotente serão implementados junto à API de pedidos. Build verificado; testes completos ficam para a revisão final.

### Comandos de execução

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Verifica tipos e gera o build de produção |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | Executa o Oxlint |

## Estado e próximos passos

Catálogo, detalhe, favoritos, perfil, carteiras e carrinho usam handlers REST do MSW. Busca, ordenação, filtros e paginação usam a URL. Pedidos ainda usam armazenamento local e não estão isolados por conta. O checkout ainda não depende de uma confirmação de pedido do servidor simulado. Socket.IO está instalado, mas não integrado. Playwright, auditoria Lighthouse, documentação de arquitetura e deploy ainda faltam. A responsividade e a fidelidade visual serão revisadas após as funcionalidades obrigatórias.

1. Integrar carteiras salvas ao pagamento e simular conexão, recusa e desconexão.
2. Implementar revalidação da cotação, pedidos idempotentes e estados de pagamento simulados.
3. Integrar eventos Socket.IO simulados e cenários de reconciliação/falha.
4. Revisar mobile e acessibilidade; adicionar testes Playwright, documentação de arquitetura e auditorias Lighthouse.
5. Publicar a aplicação e registrar a URL.

## Escopo da simulação

Autenticação, carteiras e pagamentos são simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento não fazem parte do desafio.
