# NFT Marketplace

Frontend de um marketplace de NFTs desenvolvido para um desafio técnico. O objetivo é implementar descoberta de NFTs, compra simulada e área do colecionador, com React e TypeScript.

> Em desenvolvimento: a página inicial desktop e os fluxos simulados de catálogo, detalhe, favoritos, carrinho e checkout estão implementados. A correspondência visual com o Figma e a responsividade ainda estão em refinamento.

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

Já estão configurados o roteamento, os provedores do TanStack Query, o cliente Axios, o MSW com dados de exemplo, o Tailwind CSS e o shadcn/ui. A página inicial tem cabeçalho, hero, catálogo com filtros, banners de coleções, seção editorial e rodapé com newsletter e links. Busca, ordenação, filtros e paginação usam a URL e o MSW. Os cards abrem uma página de detalhe; favoritos e carrinho persistem localmente. O checkout gera pedidos simulados, sem realizar pagamentos. A fidelidade visual desktop e a responsividade ainda estão em refinamento. Não há autenticação, Socket.IO em uso, testes E2E, auditoria Lighthouse nem deploy.

A compilação (`npm run build`) passou após a configuração atual. O lint executa, com um aviso no componente de botão gerado pelo shadcn/ui.

## Próximas etapas

1. Refinar a correspondência visual da página inicial desktop com o Figma e validar responsividade.
2. Implementar sessão simulada.
3. Integrar eventos Socket.IO simulados e cenários de falha.
4. Adicionar testes Playwright, documentação de arquitetura e auditorias.
5. Publicar a aplicação e registrar a URL.

## Escopo da simulação

Autenticação, carteiras e pagamentos serão simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento não fazem parte do desafio.
