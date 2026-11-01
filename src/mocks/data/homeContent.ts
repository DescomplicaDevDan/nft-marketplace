import artwork05 from '@/assets/img/NFT Artwork 05.png'
import artwork09 from '@/assets/img/NFT Artwork 09.png'
import artwork18 from '@/assets/img/NFT Artwork 18.png'
import frame136 from '@/assets/img/Frame 136.webp'
import facebookIcon from '@/assets/icons/facebook.svg'
import instagramIcon from '@/assets/icons/instagram.svg'
import linkedinIcon from '@/assets/icons/linkedin.svg'
import twitterIcon from '@/assets/icons/twitter.svg'

export const featuredCollections = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: frame136,
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem o futuro.',
    image: artwork05,
  },
]

export const journalArticles = [
  {
    date: '12 de setembro',
    readingTime: '6 min',
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: artwork05,
  },
  {
    date: '13 de setembro',
    readingTime: '2 min',
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    image: frame136,
  },
  {
    date: '15 de setembro',
    readingTime: '3 min',
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: artwork18,
  },
  {
    date: '15 de setembro',
    readingTime: '2 min',
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: artwork09,
  },
]

export const footerHighlights = [
  { icon: 'W', title: 'Segurança da carteira', description: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { icon: 'C', title: 'Criadores em destaque', description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { icon: 'D', title: 'Alertas de lançamento', description: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

export const footerGroups = [
  { title: 'Meu perfil', links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'] },
  { title: 'Central de ajuda', links: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'] },
  { title: 'Coleções', links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

export const socialLinks = [
  { name: 'Facebook', icon: facebookIcon },
  { name: 'Instagram', icon: instagramIcon },
  { name: 'Twitter', icon: twitterIcon },
  { name: 'LinkedIn', icon: linkedinIcon },
]
