import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const reportsDir = path.join(root, 'reports', 'lighthouse')
const baseURL = 'http://127.0.0.1:4174'
const npmCli = process.env.npm_execpath
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const chromePath = process.env.CHROME_PATH || (existsSync(edgePath) ? edgePath : undefined)

if (!chromePath) throw new Error('Defina CHROME_PATH com o caminho do Chrome ou Edge Chromium.')

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} terminou com código ${code}`)))
  })
}

async function waitForServer(server) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('O servidor de preview encerrou antes de iniciar.')
    try { if ((await fetch(baseURL)).ok) return } catch { /* Vite preview is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Tempo esgotado aguardando o preview.')
}

const env = { ...process.env, VITE_ENABLE_MOCKS: 'true' }
await mkdir(reportsDir, { recursive: true })
await run(process.execPath, [npmCli, 'run', 'build'], { env })
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const server = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { cwd: root, stdio: 'inherit', env })

try {
  await waitForServer(server)
  const cli = path.join(root, 'node_modules', 'lighthouse', 'cli', 'index.js')
  const pages = [
    { name: 'inicio', route: '/?search=&page=1' },
    { name: 'detalhe', route: '/nft/nft-001?search=&page=1' },
  ]
  const profiles = ['mobile', 'desktop']
  const runs = []

  for (const page of pages) for (const profile of profiles) for (let iteration = 1; iteration <= 3; iteration++) {
    const name = `${page.name}-${profile}-${iteration}`
    const outputPath = path.join(reportsDir, name)
    const flags = [cli, `${baseURL}${page.route}`, `--chrome-path=${chromePath}`, '--output=html', '--output=json', `--output-path=${outputPath}`, '--disable-storage-reset', '--max-wait-for-load=30000', '--quiet']
    if (profile === 'desktop') flags.push('--preset=desktop')
    console.log(`Lighthouse ${name}`)
    let lastError
    for (let attempt = 1; attempt <= 2; attempt++) {
      try { await run(process.execPath, flags); lastError = undefined; break }
      catch (error) { lastError = error; console.warn(`${name}: repetindo auditoria (${attempt}/2).`) }
    }
    if (lastError) throw lastError
    const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8'))
    runs.push({ name, page: page.name, profile, scores: Object.fromEntries(Object.entries(report.categories).map(([key, category]) => [key, Math.round(category.score * 100)])), metrics: { lcpMs: report.audits['largest-contentful-paint']?.numericValue, cls: report.audits['cumulative-layout-shift']?.numericValue, tbtMs: report.audits['total-blocking-time']?.numericValue } })
  }

  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const summaries = {}
  for (const page of pages) for (const profile of profiles) {
    const group = runs.filter((run) => run.page === page.name && run.profile === profile)
    summaries[`${page.name}-${profile}`] = {
      categories: Object.fromEntries(Object.keys(group[0].scores).map((category) => [category, median(group.map((run) => run.scores[category]))])),
      metrics: Object.fromEntries(Object.keys(group[0].metrics).map((metric) => [metric, median(group.map((run) => run.metrics[metric]))])),
    }
  }
  const lighthouseVersion = JSON.parse(await readFile(path.join(root, 'node_modules', 'lighthouse', 'package.json'), 'utf8')).version
  const os = await import('node:os')
  const metadata = { generatedAt: new Date().toISOString(), tool: `Lighthouse ${lighthouseVersion}`, browser: chromePath, environment: { platform: `${os.platform()} ${os.release()}`, architecture: os.arch(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryBytes: os.totalmem() }, baseURL, conditions: 'Build otimizado com mocks padrão, armazenamento isolado entre execuções e perfis Lighthouse padrão mobile/desktop.', runs, medians: summaries }
  await writeFile(path.join(reportsDir, 'summary.json'), `${JSON.stringify(metadata, null, 2)}\n`)
  await writeFile(path.join(reportsDir, 'README.md'), `# Lighthouse\n\nAuditoria executada em ${metadata.generatedAt}, com Lighthouse ${lighthouseVersion} e navegador Chromium em \`${chromePath}\`. Cenário MSW padrão, build otimizado, URLs locais \`${baseURL}\`; três medições por tela e perfil. Os HTML/JSON individuais acompanham este resumo.\n\n| Tela / perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${Object.entries(summaries).map(([key, value]) => `| ${key} | ${value.categories.performance} | ${value.categories.accessibility} | ${value.categories['best-practices']} | ${value.categories.seo} | ${Math.round(value.metrics.lcpMs)} | ${value.metrics.cls.toFixed(3)} | ${Math.round(value.metrics.tbtMs)} |`).join('\n')}\n`)
  console.log(`Resumo salvo em ${path.join(reportsDir, 'README.md')}`)
} finally {
  server.kill()
}
