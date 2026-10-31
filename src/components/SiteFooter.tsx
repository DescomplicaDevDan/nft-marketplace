import './SiteFooter.css'
import { useState } from 'react'
import kurioWordmark from '@/assets/img/Logo.svg'
import { footerGroups, footerHighlights, socialLinks } from '@/mocks/data/homeContent'

export default function SiteFooter() {
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)

  return (
    <section className="site-footer flex flex-col gap-3">
      <footer className="bg-[#241612] font-mono text-[#f5f1eb]">
        <section aria-label="Benefícios e novidades" className="site-footer-benefits grid grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-10">
          {footerHighlights.map((item) => (
            <article key={item.title} className="border-[#9b6031] lg:border-r lg:px-4 first:lg:pl-0">
              <span className="mb-3 grid size-16 place-items-center rounded-full bg-[#d28a4c] text-lg font-bold text-[#140d0a]">{item.icon}</span>
              <h2 className="mb-2 text-sm font-bold">{item.title}</h2>
              <p className="max-w-[220px] text-xs leading-5 text-[#b8aa9b]">{item.description}</p>
            </article>
          ))}
          <form className="lg:pl-4" onSubmit={(event) => { event.preventDefault(); setNewsletterSubmitted(true) }}>
            <label htmlFor="detail-newsletter-email" className="mb-3 block text-sm font-bold leading-tight">Antecipe-se ao próximo lançamento</label>
            <div className="flex">
              <input id="detail-newsletter-email" type="email" required placeholder="digite seu e-mail..." className="min-w-0 flex-1 rounded-l border border-[#49372b] bg-[#140d0a] px-3 py-2 text-xs outline-none placeholder:text-[#b8aa9b] focus-visible:ring-2 focus-visible:ring-[#e89b55]" />
              <button type="submit" className="rounded-r bg-[#d28a4c] px-3 text-xs font-bold text-[#140d0a]">Enviar</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#b8aa9b]">Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
            {newsletterSubmitted && <p role="status" className="mt-2 text-xs text-[#e89b55]">Inscrição de demonstração confirmada.</p>}
          </form>
        </section>

        <div className="site-footer-contact grid grid-cols-1 gap-4 bg-[#3b2412] px-6 py-5 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:px-10">
          <a href="#topo" aria-label="Kurio — início" className="inline-flex"><img src={kurioWordmark} alt="KURIO" className="h-7 w-[120px] object-contain object-left" /></a>
          <p>Feito para colecionadores,<br />criadores e cultura</p>
          <a href="mailto:contato@email.com" className="hover:text-[#e89b55]">contato@email.com</a>
          <a href="tel:+551140028922" className="hover:text-[#e89b55]">+55 11 4002 8922</a>
        </div>

        <section aria-label="Links do rodapé" className="site-footer-links grid grid-cols-1 gap-8 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-3 text-sm font-bold">{group.title}</h2>
              <ul className="list-none space-y-2 p-0 text-xs text-[#d2c4b7]">
                {group.links.map((label) => <li key={label}><a href={label === 'Meu perfil' ? '/profile' : '/#catalogo'} className="hover:text-[#e89b55]">{label}</a></li>)}
              </ul>
            </nav>
          ))}
          <div>
            <h2 className="mb-3 text-sm font-bold">Redes sociais</h2>
            <div id="redes-sociais" className="mb-5 flex gap-2">
              {socialLinks.map((social) => <a key={social.name} href="#redes-sociais" aria-label={social.name} className="grid size-7 place-items-center rounded border border-[#9b6031] hover:bg-[#3b2412]"><img src={social.icon} alt="" className="size-4" /></a>)}
              <a href="#redes-sociais" aria-label="YouTube" className="grid size-7 place-items-center rounded border border-[#9b6031] text-xs text-[#d28a4c]">▶</a>
            </div>
            <h3 className="mb-2 text-sm font-bold">Carteiras compatíveis</h3>
            <p className="inline-block rounded bg-[#4a2c15] px-2 py-1 text-[8px] uppercase tracking-wide text-[#e69a55]">MetaMask · WalletConnect · Coinbase</p>
          </div>
        </section>
      </footer>
      <p className="py-2 text-center text-xs text-[#b8aa9b]">© 2026 Kurio. Propriedade digital para todos.</p>
    </section>
  )
}


