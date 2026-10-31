# NFT Marketplace

Frontend de um marketplace de NFTs desenvolvido para um desafio técnico. O objetivo é implementar descoberta de NFTs, compra simulada e área do colecionador com React e TypeScript.

> Em desenvolvimento: as telas desktop estão montadas; catálogo, autenticação e favoritos já usam a API simulada. Carrinho, perfil, carteiras e pedidos ainda serão migrados para a API simulada antes da revisão funcional e mobile.

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

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Verifica tipos e gera o build de produção |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | Executa o Oxlint |

## Estado e próximos passos

Catálogo, detalhe e favoritos usam handlers REST do MSW. Busca, ordenação, filtros e paginação usam a URL. Carrinho, perfil, carteiras e pedidos ainda usam armazenamento local ou estado de demonstração e não estão isolados por conta. O checkout ainda não depende de uma confirmação de pedido do servidor simulado. Socket.IO está instalado, mas não integrado. Playwright, auditoria Lighthouse, documentação de arquitetura e deploy ainda faltam. A responsividade e a fidelidade visual serão revisadas após as funcionalidades obrigatórias.

1. Migrar perfil, carteiras e carrinho para handlers REST com dados separados por usuário.
2. Implementar cotação, cupons, pedidos idempotentes e estados de pagamento simulados.
3. Integrar eventos Socket.IO simulados e cenários de reconciliação/falha.
4. Revisar mobile e acessibilidade; adicionar testes Playwright, documentação de arquitetura e auditorias Lighthouse.
5. Publicar a aplicação e registrar a URL.

## Escopo da simulação

Autenticação, carteiras e pagamentos são simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento não fazem parte do desafio.
