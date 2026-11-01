# Verificação funcional e visual

Última execução conjunta: 33 testes passaram, sem falhas (Chromium/Edge, Windows, dois workers).

- Relatório: abra `index.html` nesta pasta.
- Reprodução: `npm ci`, `npx playwright install chromium` se necessário, `npm run test:e2e`.
- Windows usa o Edge instalado; outros sistemas usam Chromium.
- Projetos: desktop e mobile com toque. Baselines visuais em 390, 768 e 1440 px estão em `tests/e2e/visual.spec.ts-snapshots`.
- API e eventos passam por MSW e pelo cliente Socket.IO. Cada teste reinicia o estado simulado.
- A suíte inclui compra, recusa, timeout, expiração, recuperação, idempotência, isolamento de contas/recibos, estoque, cotação, carteira, perfil/avatar/senha, cadastro, favoritos com rollback, cupons, histórico, skeletons, recuperação de erro e foco de diálogo.

As referências visuais registram a implementação aprovada nesta execução; não são imagens exportadas do Figma. A análise automática não substitui revisão humana de fidelidade visual e tecnologias assistivas. Traces de falhas futuras são gerados em `test-results`; o relatório HTML atualizado fica em `playwright-report` após executar a suíte.
