# NFT Marketplace

Frontend de um marketplace de NFTs desenvolvido para um desafio técnico. O objetivo é implementar descoberta de NFTs, compra simulada e área do colecionador, com React e TypeScript.

> Em desenvolvimento: a infraestrutura inicial está configurada, mas a tela atual ainda é o template do Vite. Os fluxos de catálogo, conta, carrinho e compra ainda não foram implementados.

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

O servidor mostra o endereço local ao iniciar. Em desenvolvimento, o MSW é iniciado automaticamente. A página inicial consome `GET /api/nfts` por Axios e TanStack Query; busca e paginação são guardadas na URL.

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

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Verifica tipos e gera o build de produção |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | Executa o Oxlint |

## Estado atual

Já estão configurados o roteamento em `/`, os provedores do TanStack Query, o cliente Axios, o MSW com dados de exemplo, o Tailwind CSS e o shadcn/ui. A página inicial exibe o catálogo simulado com busca, paginação, estados de carregamento, erro e resultado vazio. Não há filtros combinados, detalhe do NFT, autenticação, compra, Socket.IO em uso, testes E2E, auditoria Lighthouse nem deploy.

A compilação (`npm run build`) passou após a configuração atual. O lint executa, com um aviso no componente de botão gerado pelo shadcn/ui.

## Próximas etapas

1. Adicionar filtros combinados, ordenação e detalhe do NFT com estado na URL.
2. Implementar sessão, favoritos e carrinho.
3. Implementar checkout e pedidos simulados.
4. Integrar eventos Socket.IO simulados e cenários de falha.
5. Adicionar testes Playwright, documentação de arquitetura e auditorias.
6. Publicar a aplicação e registrar a URL.

## Escopo da simulação

Autenticação, carteiras e pagamentos serão simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento não fazem parte do desafio.
