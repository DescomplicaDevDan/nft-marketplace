import './SiteFooter.css'
import { useState } from 'react'
import youtubeIcon from '@/assets/icons/Frame 112.svg'
import kurioWordmark from '@/assets/img/Logo.svg'
import { footerGroups, footerHighlights, socialLinks } from '@/mocks/data/homeContent'

export default function SiteFooter() {
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)

  return (
    <section className="site-footer flex flex-col gap-3">
      <footer className="bg-[#241612] font-mono text-[#f5f1eb]">
        <section aria-label="Benefícios e novidades" className="site-footer-benefits">
          {footerHighlights.map((item) => (
            <article key={item.title}>
              <div className="site-footer-benefit-content">
              <span className="site-footer-benefit-marker"><span className="site-footer-benefit-letter text-lg font-bold text-[#140d0a]">{item.icon}</span></span>
              <h2 className="text-sm font-bold">{item.title}</h2>
              <p className="text-xs leading-5 text-[#b8aa9b]">{item.description}</p>
              </div>
            </article>
          ))}
          <form className="site-footer-newsletter" onSubmit={(event) => { event.preventDefault(); setNewsletterSubmitted(true) }}>
            <label htmlFor="detail-newsletter-email" className="block text-sm font-bold leading-tight">Antecipe-se ao próximo lançamento</label>
            <div className="site-footer-newsletter-fields">
              <input id="detail-newsletter-email" type="email" required placeholder="digite seu e-mail..." className="min-w-0 flex-1 rounded-l border border-[#49372b] bg-[#140d0a] px-3 py-2 text-xs outline-none placeholder:text-[#b8aa9b] focus-visible:ring-2 focus-visible:ring-[#e89b55]" />
              <button type="submit" className="rounded-r bg-[#d28a4c] px-3 text-xs font-bold text-[#140d0a]"><span>Enviar</span></button>
            </div>
            <p className="site-footer-newsletter-description text-xs leading-5 text-[#b8aa9b]">Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
            {newsletterSubmitted && <p role="status" className="mt-2 text-xs text-[#e89b55]">Inscrição de demonstração confirmada.</p>}
          </form>
        </section>

        <div className="site-footer-contact grid grid-cols-1 gap-4 bg-[#3b2412] px-6 py-5 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:px-10">
          <a href="#topo" aria-label="Kurio — início" className="inline-flex"><img src={kurioWordmark} alt="KURIO" className="h-7 w-[120px] object-contain object-left" /></a>
          <p className="site-footer-contact-message">Feito para colecionadores,<br />criadores e cultura</p>
          <a href="mailto:contato@email.com" className="site-footer-contact-email hover:text-[#e89b55]">contato@email.com</a>
          <a href="tel:+551140028922" className="site-footer-contact-phone hover:text-[#e89b55]">+55 11 4002 8922</a>
        </div>

        <section aria-label="Links do rodapé" className="site-footer-links grid grid-cols-1 gap-8 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-bold">{group.title}</h2>
              <ul className="list-none p-0 text-xs text-[#d2c4b7]">
                {group.links.map((label) => <li key={label}><a href={label === 'Meu perfil' ? '/profile' : '/#catalogo'} className="hover:text-[#e89b55]">{label}</a></li>)}
              </ul>
            </nav>
          ))}
          <div className="site-footer-socials">
            <h2 className="text-sm font-bold">Redes sociais</h2>
            <div id="redes-sociais">
              {socialLinks.map((social) => <a key={social.name} href="#redes-sociais" aria-label={social.name} className="grid place-items-center rounded-[5px] hover:bg-[#3b2412]"><img src={social.icon} alt="" className="block h-full w-full" /></a>)}
              <a href="#redes-sociais" aria-label="YouTube" className="grid place-items-center rounded-[5px] hover:bg-[#3b2412]"><img src={youtubeIcon} alt="" className="block h-full w-full" /></a>
            </div>
            <h3 className="text-sm font-bold">Carteiras compatíveis</h3>
            <p className="site-footer-wallet-brands text-[8px] uppercase tracking-wide text-[#e69a55]"><span>METAMASK · WALLETCONNECT · COINBASE</span></p>
          </div>
        </section>
      </footer>
      <p className="site-footer-copyright text-xs text-[#b8aa9b]">© 2026 Kurio. Propriedade digital para todos.</p>
    </section>
  )
}


