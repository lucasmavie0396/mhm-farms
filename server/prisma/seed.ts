import { PrismaClient, Role, AnimalCategory, ExperienceType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const UF = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`

const IMG = {
  zebra: UF('photo-1546182990-dffeafbe841d'),
  macaco: UF('photo-1540573135459-566ecc4a778f'),
  antilope: UF('photo-1523905330026-b8bd1f5f320e'),
  cabra: UF('photo-1536508133858-4a2cd96e0ca6'),
  coelho: UF('photo-1585110396000-c9ffd4e4b308'),
  leao: UF('photo-1546182990-dffeafbe841d'),
  elefante: UF('photo-1557050543-4d5f4e07ef46'),
  girafa: UF('photo-1547721064-da6cfb341d50'),
  pavao: UF('photo-1558366132-e29e5fa576af'),
  papagaio: UF('photo-1552728089-57bdde30beb3'),
  galinha: UF('photo-1566492031773-4f4e44671857'),
  pato: UF('photo-1528800730835-fa1f3db17878'),
  tartaruga: UF('photo-1437622368342-7a3d73a34c8f'),
  lagarto: UF('photo-1569017388734-197b095f4ab7'),
  hero: UF('photo-1546182990-dffeafbe841d'),
  natura: UF('photo-1441974231531-c6227db76b6e'),
  famille: UF('photo-1519340333755-56e9c1d04579'),
  escola: UF('photo-1580582932707-520aed937b7b'),
  ocagao: UF('photo-1464822759023-fed622ff2c3b'),
  sertanejo: UF('photo-1501854140801-50d01698950b'),
  quinta: UF('photo-1500382017468-9049fed747ef'),
  cerca: UF('photo-1444858291040-58f756a3bdd6'),
  lago: UF('photo-1439066615861-d1af74d74000'),
  primavera: UF('photo-1502082553048-f009c37129b9'),
  famempedra: UF('photo-1476231682828-37e571bc172f'),
}

async function main() {
  console.log('🌱 A preparar a base de dados MHM Farms...')

  // ---------- Utilizadores ----------
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mhmfarms.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!adminExists) {
    const hash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: {
        name: 'Administrador MHM Farms',
        email: adminEmail,
        phone: '+258 84 000 0000',
        passwordHash: hash,
        role: Role.ADMIN,
      },
    })
    console.log(`👤 Administrador criado: ${adminEmail} / ${adminPassword}`)
  } else {
    console.log('👤 Administrador já existe, a manter.')
  }

  const managerEmail = 'gestor@mhmfarms.com'
  if (!(await prisma.user.findUnique({ where: { email: managerEmail } }))) {
    await prisma.user.create({
      data: {
        name: 'Gestor MHM Farms',
        email: managerEmail,
        phone: '+258 84 100 0000',
        passwordHash: await bcrypt.hash('Gestor123!', 12),
        role: Role.MANAGER,
      },
    })
  }

  // ---------- Animais ----------
  const animals = [
    {
      slug: 'zebra-das-planicies',
      name: 'Zeke',
      species: 'Zebra-das-Planícies',
      family: 'Equídeos',
      category: AnimalCategory.MAMIFERO,
      habitat: 'Savanas africanas, pradarias abertas',
      diet: 'Herbívoro — gramíneas e folhas',
      lifeExpectancy: '25–30 anos',
      description:
        'A zebra é um dos animais mais icónicos de África. As suas riscas únicas funcionam como uma impressão digital: nenhuma zebra é igual a outra. Vivem em manadas e estão quase sempre alerta a possíveis predadores.',
      curiosity:
        'As riscas das zebras servem, entre outras funções, para confundir insetos e regular a temperatura corporal.',
      funFact:
        'Cada zebra tem um padrão de riscas único, tal como as nossas impressões digitais!',
      behavior:
        'Vive em grupos familiares e é muito sociável. Comunica através de sons, expressões faciais e postura corporal.',
      featured: true,
      mainImage: IMG.zebra,
      images: [IMG.zebra, IMG.natura, IMG.sertanejo],
    },
    {
      slug: 'macaco-eritrocebus',
      name: 'Caco',
      species: 'Macaco (Eritrocebus patas / vermelho)',
      family: 'Cercopitecídeos',
      category: AnimalCategory.MAMIFERO,
      habitat: 'Florestas e zonas arborizadas',
      diet: 'Omnívoro — frutas, folhas e pequenos insetos',
      lifeExpectancy: '20–27 anos',
      description:
        'Macacos curiosos e brincalhões que adoram explorar. No MHM Farms vivem num espaço amplo, com estruturas para trepar e muito para descobrir.',
      curiosity:
        'Os macacos comunicam entre si com dezenas de vocalizações e gestos diferentes.',
      funFact: 'Sabia que os macacos usam ferramentas improvisadas para abrir alimentos?',
      behavior: 'Muito social e inteligente. Vive em grupos hierárquicos.',
      featured: true,
      mainImage: IMG.macaco,
      images: [IMG.macaco, IMG.natura],
    },
    {
      slug: 'antilope',
      name: 'Bambi',
      species: 'Antílope',
      family: 'Bovídeos',
      category: AnimalCategory.MAMIFERO,
      habitat: 'Savanas e zonas de vegetação densa',
      diet: 'Herbívoro — rebentos e folhas',
      lifeExpectancy: '12–15 anos',
      description:
        'Os antílopes são ágeis e elegantes, movimentando-se com enorme velocidade em caso de perigo. No nosso parque podem ser observados de perto num ambiente seguro.',
      curiosity:
        'Alguns antílopes conseguem saltar mais de 3 metros de altura para escapar.',
      funFact: 'O antílope é um dos mamíferos mais rápidos em baixas distâncias.',
      behavior: 'Territorial e vigilante, vive geralmente em pequenos grupos.',
      featured: true,
      mainImage: IMG.antilope,
      images: [IMG.antilope, IMG.sertanejo],
    },
    {
      slug: 'cabras',
      name: 'Mel',
      species: 'Cabra doméstica',
      family: 'Bovídeos',
      category: AnimalCategory.DOMESTICO,
      habitat: 'Quinta, montanha e zonas rurais',
      diet: 'Herbívoro — capim, folhas e pequenos arbustos',
      lifeExpectancy: '12–18 anos',
      description:
        'As nossas cabras são as estrelas mais conversadoras! São curiosas, carinhosas e adoram atenção dos visitantes — principalmente quando há algo para comer.',
      curiosity:
        'As cabras têm pupilas retangulares, o que lhes dá um campo de visão de quase 320 graus.',
      funFact: 'As cabras conseguem subir a árvores e até a penhascos quase verticais!',
      behavior: 'Curiosa, brincalhona e muito exploradora.',
      featured: false,
      mainImage: IMG.cabra,
      images: [IMG.cabra, IMG.quinta],
    },
    {
      slug: 'coelhos',
      name: 'Saltitão',
      species: 'Coelho europeu',
      family: 'Leporídeos',
      category: AnimalCategory.DOMESTICO,
      habitat: 'Zonas verdes, campos e bosques',
      diet: 'Herbívoro — feno, verduras e cenouras',
      lifeExpectancy: '8–12 anos',
      description:
        'Os coelhos são os favoritos dos mais pequenos. Podem ser vistos saltitando no seu recinto e, em atividades supervisionadas, podem até ser alimentados.',
      curiosity:
        'Os dentes dos coelhos nunca param de crescer! Por isso estão sempre a roer algo.',
      funFact: 'Um coelho feliz "dentre" (range levemente os dentes) como um gato a ressonar.',
      behavior: 'Calmo e curioso. Gosta de hábitos e rotinas.',
      featured: false,
      mainImage: IMG.coelho,
      images: [IMG.coelho, IMG.primavera],
    },
    {
      slug: 'pavao',
      name: 'Arco-Íris',
      species: 'Pavão-indiano',
      family: 'Fasianídeos',
      category: AnimalCategory.AVE,
      habitat: 'Florestas e jardins tropicais',
      diet: 'Omnívoro — sementes, insetos e frutas',
      lifeExpectancy: '20–25 anos',
      description:
        'Com a sua cauda repleta de cores, o pavão é uma verdadeira obra de arte viva. Durante a época de acasalamento abre a cauda num espetáculo inesquecível.',
      curiosity:
        'A cauda do pavão é formada por plumas que mudam de cor consoante a luz.',
      funFact: 'Os pavões podem voar! Apesar do tamanho, sobem a árvores para dormir.',
      behavior: 'Elegante e territorial durante a época de reprodução.',
      featured: true,
      mainImage: IMG.pavao,
      images: [IMG.pavao, IMG.natura],
    },
    {
      slug: 'papagaio',
      name: 'Loro',
      species: 'Papagaio-cinzento africano',
      family: 'Psitacídeos',
      category: AnimalCategory.AVE,
      habitat: 'Florestas tropicais africanas',
      diet: 'Herbívoro — frutas, sementes e nozes',
      lifeExpectancy: '40–60 anos',
      description:
        'Famoso pela sua inteligência, o papagaio-cinzento pode imitar sons e palavras com precisão impressionante. Um dos animais mais inteligentes do planeta.',
      curiosity:
        'O papagaio-cinzento tem a inteligência equivalente à de uma criança de 4 a 6 anos.',
      funFact: 'Consegue memorizar mais de 100 palavras e associá-las a objetos.',
      behavior: 'Social, vocal e extremamente observador.',
      featured: true,
      mainImage: IMG.papagaio,
      images: [IMG.papagaio, IMG.natura],
    },
    {
      slug: 'galinhas',
      name: 'Amarelinha',
      species: 'Galinha decorativa',
      family: 'Fasianídeos',
      category: AnimalCategory.AVE,
      habitat: 'Quinta e zonas rurais',
      diet: 'Omnívoro — grãos, insetos e verdes',
      lifeExpectancy: '5–10 anos',
      description:
        'As galinhas do MHM Farms andam livres pelos espaços verdes. As crianças adoram procurar os ovos frescos da manhã.',
      curiosity: 'Existem mais de 500 raças de galinhas com aspetos muito diferentes.',
      funFact: 'As galinhas reconhecem até 100 faces diferentes de outras galinhas!',
      behavior: 'Sociável e atenta ao que a rodeia.',
      featured: false,
      mainImage: IMG.galinha,
      images: [IMG.galinha, IMG.quinta],
    },
    {
      slug: 'patos',
      name: 'Fofinho',
      species: 'Pato-doméstico',
      family: 'Anatídeos',
      category: AnimalCategory.AVE,
      habitat: 'Lagoas, rios e zonas húmidas',
      diet: 'Omnívoro — plantas aquáticas e pequenos insetos',
      lifeExpectancy: '8–12 anos',
      description:
        'Os patos vivem junto ao nosso lago, onde deslizam sobre a água numa coreografia tranquila. Uma delícia para toda a família observar.',
      curiosity: 'Os patos impermeabilizam as penas com uma gordura especial que produzem.',
      funFact: 'O quack do pato tem eco, ao contrário do que muitos acreditam!',
      behavior: 'Pacífico e gregário.',
      featured: false,
      mainImage: IMG.pato,
      images: [IMG.pato, IMG.lago],
    },
    {
      slug: 'tartaruga-gigante',
      name: 'Velhinha',
      species: 'Tartaruga-gigante',
      family: 'Testudinídeos',
      category: AnimalCategory.REPTIL,
      habitat: 'Ilhas e zonas de vegetação rasteira',
      diet: 'Herbívoro — ervas, frutas e suculentas',
      lifeExpectancy: '100–150 anos',
      description:
        'As tartarugas-gigantes são dos animais mais antigos do planeta. A nossa "Velhinha" testemunhou décadas de história e continua calma e elegante.',
      curiosity:
        'Algumas tartarugas-gigantes nasceram quando Portugal ainda era um império!',
      funFact: 'Podem passar meses sem comer nem beber graças às suas reservas.',
      behavior: 'Lenta, tranquila e muito resistente.',
      featured: true,
      mainImage: IMG.tartaruga,
      images: [IMG.tartaruga, IMG.lago],
    },
    {
      slug: 'lagarto-monitor',
      name: 'Rex',
      species: 'Lagarto-monitor',
      family: 'Varanídeos',
      category: AnimalCategory.REPTIL,
      habitat: 'Rios e florestas tropicais',
      diet: 'Carnívoro — pequenos animais e ovos',
      lifeExpectancy: '15–20 anos',
      description:
        'O lagarto-monitor é um réptil ágil e fascinante, com uma língua bifurcada que usa para "cheirar" o ambiente. Observação exclusiva com guia.',
      curiosity:
        'A língua bifurcada dos lagartos-monitores capta partículas de cheiro do ar.',
      funFact: 'Consegue correr em duas patas quando precisa de velocidade!',
      behavior: 'Solitário e extremamente alerta.',
      featured: false,
      mainImage: IMG.lagarto,
      images: [IMG.lagarto, IMG.natura],
    },
  ]

  for (const a of animals) {
    const exists = await prisma.animal.findUnique({ where: { slug: a.slug } })
    if (exists) continue
    const { images, ...data } = a
    await prisma.animal.create({
      data: {
        ...data,
        images: { create: images.map((url, i) => ({ url, alt: data.name, sortOrder: i })) },
      },
    })
  }
  console.log(`🦓 ${animals.length} animais criados.`)

  // ---------- Experiências ----------
  const experiences = [
    {
      slug: 'visita-guiada-completa',
      title: 'Visita Guiada Completa',
      shortDesc: 'Uma viagem por todo o parque com guia especializado que conta a história de cada animal.',
      description:
        'Acompanhe os nossos guias numa caminhada de descoberta. Aprenda sobre a origem, hábitos e curiosidades de cada espécie num passeio pensado para toda a família.',
      type: ExperienceType.VISITA,
      duration: '2 horas',
      minAge: 'Todas as idades',
      price: 250,
      featured: true,
      image: IMG.sertanejo,
    },
    {
      slug: 'alimentacao-supervisionada',
      title: 'Alimentação Supervisionada',
      shortDesc: 'Alimente cabras, coelhos e outros animais de quinta sob supervisão dos tratadores.',
      description:
        'Momento único para as crianças: preparar e dar comida aos animais de quinta, aprendendo sobre alimentação saudável e bem-estar animal.',
      type: ExperienceType.ALIMENTACAO,
      duration: '45 minutos',
      minAge: '+3 anos',
      price: 150,
      featured: true,
      image: IMG.cabra,
    },
    {
      slug: 'passeio-nascolinas',
      title: 'Passeio pelas Colinas',
      shortDesc: 'Caminhada panorâmica pelos trilhos da propriedade com paragens de observação.',
      description:
        'Calce os sapatos confortáveis e venha explorar os trilhos do MHM Farms. Vistas deslumbrantes, fotografias incríveis e contacto próximo com a natureza.',
      type: ExperienceType.PASSEIO,
      duration: '1 hora 30 min',
      minAge: '+6 anos',
      price: 100,
      image: IMG.natura,
    },
    {
      slug: 'observacao-de-pavao',
      title: 'Observação do Pavão',
      shortDesc: 'Descubra quando o pavão abre a sua cauda num espetáculo de cores.',
      description:
        'Uma experiência educativa centrada no pavão do parque. Histórias, mitos e ciência sobre este animal fascinante.',
      type: ExperienceType.EDUCACAO,
      duration: '30 minutos',
      minAge: '+5 anos',
      price: 80,
      featured: true,
      image: IMG.pavao,
    },
    {
      slug: 'dia-em-familia',
      title: 'Dia em Família',
      shortDesc: 'Pacote completo para famílias: visita, alimentação, piquenique e brincadeiras.',
      description:
        'Tudo incluído para um dia perfeito em família. Aproveite descontos especiais e atividades pensadas para os mais pequenos.',
      type: ExperienceType.FAMILIA,
      duration: 'Dia inteiro',
      minAge: 'Todas as idades',
      price: 850,
      image: IMG.famille,
    },
    {
      slug: 'expedicao-fotografica',
      title: 'Expedição Fotográfica',
      shortDesc: 'Passeio com guia pelos melhores pontos para fotografar os animais.',
      description:
        'Traga a sua câmara e capture momentos únicos. O guia leva-o aos melhores pontos de observação e partilha truques de fotografia de animais.',
      type: ExperienceType.AVENTURA,
      duration: '1 hora 30 min',
      minAge: '+10 anos',
      price: 300,
      image: IMG.zebra,
    },
    {
      slug: 'visita-escolar-educativa',
      title: 'Visita Escolar Educativa',
      shortDesc: 'Programa formativo para escolas com atividades práticas e fichas pedagógicas.',
      description:
        'Projetos desenhados por educadores ambientais para cada nível de ensino. Observação, atividades práticas e muito conhecimento.',
      type: ExperienceType.EDUCACAO,
      duration: '3 horas',
      minAge: 'Escolas',
      price: 120,
      featured: true,
      image: IMG.escola,
    },
    {
      slug: 'aniversario-no-parque',
      title: 'Festa de Aniversário no Parque',
      shortDesc: 'Celebre o aniversário com os amigos no meio dos animais!',
      description:
        'Festa privada com bolo, atividades supervisionadas, visita especial e muita diversão num ambiente seguro e inesquecível.',
      type: ExperienceType.EVENTO,
      duration: '3 horas',
      minAge: '+1 ano (comemorativa)',
      price: 4000,
      image: IMG.famempedra,
    },
  ]

  for (const e of experiences) {
    const exists = await prisma.experience.findUnique({ where: { slug: e.slug } })
    if (exists) continue
    await prisma.experience.create({ data: e })
  }
  console.log(`🎟️ ${experiences.length} experiências criadas.`)

  // ---------- Eventos ----------
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const events = [
    {
      slug: 'dia-mundial-dos-animais',
      title: 'Dia Mundial dos Animais',
      date: new Date(year, month, 10, 10, 0),
      time: '10:00 – 16:00',
      location: 'Praça Central do Parque',
      description:
        'Um dia dedicado à conservação animal com atividades para crianças, palestras, alimentação especial e muita diversão.',
      price: 250,
      maxParticipants: 300,
      featured: true,
      image: IMG.sertanejo,
    },
    {
      slug: 'workshop-natureza-criancas',
      title: 'Workshop de Natureza para Crianças',
      date: new Date(year, month, 18, 9, 0),
      time: '09:00 – 12:00',
      location: 'Sala Educativa',
      description:
        'As crianças aprendem sobre a flora e fauna locais com atividades manuais, jogos educativos e plantação de árvores.',
      price: 120,
      maxParticipants: 40,
      image: IMG.escola,
    },
    {
      slug: 'piquenique-family',
      title: 'Piquenique Noturno em Família',
      date: new Date(year, month, 25, 17, 0),
      time: '17:00 – 21:00',
      location: 'Espaço Verde do Lago',
      description:
        'Mantas, cestas de piquenique e o pôr do sol sobre o lago. Uma noite memorável para toda a família.',
      price: 500,
      maxParticipants: 150,
      image: IMG.lago,
    },
    {
      slug: 'fotografia-no-parque',
      title: 'Maratona de Fotografia',
      date: new Date(year, month + 1, 5, 8, 0),
      time: '08:00 – 12:00',
      location: 'Todo o parque',
      description:
        'Concursos de fotografia, dicas de profissionais e exposição das melhores imagens. Leve a sua câmara!',
      price: 300,
      maxParticipants: 60,
      image: IMG.zebra,
    },
    {
      slug: 'conferencia-conservacao',
      title: 'Conferência Sobre Conservação',
      date: new Date(year, month + 1, 12, 9, 0),
      time: '09:00 – 13:00',
      location: 'Auditório da MHM Farms',
      description:
        'Especialistas partilham projetos de conservação animal e ambiental na região. Rede, aprendizagem e ação.',
      price: 150,
      maxParticipants: 200,
      image: IMG.natura,
    },
    {
      slug: 'festa-criancas-parque',
      title: 'Festa das Crianças',
      date: new Date(year, month + 1, 20, 9, 0),
      time: '09:00 – 15:00',
      location: 'Zona Infantil e Praça Central',
      description:
        'Jogos, insufláveis, pinturas faciais, distribuição de lanches e muita alegria para festejar os mais pequenos.',
      price: 150,
      maxParticipants: 500,
      image: IMG.famempedra,
    },
  ]

  for (const ev of events) {
    const exists = await prisma.event.findUnique({ where: { slug: ev.slug } })
    if (exists) continue
    await prisma.event.create({ data: ev })
  }
  console.log(`📅 ${events.length} eventos criados.`)

  // ---------- Galeria ----------
  const gallery = [
    { title: 'Zebra na savana', category: 'animais', url: IMG.zebra },
    { title: 'Pavão em exposição', category: 'animais', url: IMG.pavao },
    { title: 'Papagaio curioso', category: 'animais', url: IMG.papagaio },
    { title: 'Natureza exuberante', category: 'natureza', url: IMG.natura },
    { title: 'Amanhecer no parque', category: 'natureza', url: IMG.ocagao },
    { title: 'Famílias em visita', category: 'visitantes', url: IMG.famille },
    { title: 'Crianças a alimentar cabras', category: 'criancas', url: IMG.cabra },
    { title: 'Atividade escolar', category: 'criancas', url: IMG.escola },
    { title: 'Festa das crianças', category: 'eventos', url: IMG.famempedra },
    { title: 'Instalações neutras', category: 'instalacoes', url: IMG.quinta },
    { title: 'Recintos verdes', category: 'instalacoes', url: IMG.cerca },
    { title: 'Lago central', category: 'natureza', url: IMG.lago },
    { title: 'Expedição fotográfica', category: 'atividades', url: IMG.zebra },
    { title: 'Passeio pelas colinas', category: 'atividades', url: IMG.sertanejo },
  ]
  for (const g of gallery) {
    if (await prisma.galleryItem.findFirst({ where: { url: g.url, title: g.title } })) continue
    await prisma.galleryItem.create({ data: g })
  }
  console.log(`🖼️ ${gallery.length} itens de galeria criados.`)

  // ---------- Notícias ----------
  const news = [
    {
      slug: 'nova-zebra-bem-vinda',
      title: 'Nova Zebra Chega ao MHM Farms',
      content:
        'Temos o prazer de anunciar a chegada de uma nova zebra ao parque. Proveniente de uma reserva de conservação parceira, a nova residente já se juntou à manada e está a adaptar-se muito bem.\n\nDurante as próximas semanas, os guias vão partilhar o processo de integração com os visitantes, incluindo os cuidados de adaptação a um novo território.\n\nEsta é mais uma prova do nosso compromisso com a conservação e o bem-estar animal.',
      image: IMG.zebra,
      date: new Date(year, month, 3),
      author: 'Equipa MHM Farms',
      category: 'Novos animais',
      featured: true,
    },
    {
      slug: 'nascimento-do-macaco',
      title: 'Nasceu um Novo Macaco!',
      content:
        'A família de macacos cresceu! Um novo membro nasceu esta semana e já está a dar os primeiros percursos dentro do recinto.\n\nA mãe e o filhote estão saudáveis e sob a vigilância atenta da nossa equipa de tratadores. Em breve, os visitantes poderão ver o pequeno a explorar o mundo.',
      image: IMG.macaco,
      date: new Date(year, month - 1, 28),
      author: 'Equipa MHM Farms',
      category: 'Nascimentos',
    },
    {
      slug: 'programa-educativo-amplia',
      title: 'Programa Educativo Ampliado para 2026',
      content:
        'A partir deste ano, o Programa Educativo da MHM Farms cresceu! Novas atividades práticas, fichas pedagógicas atualizadas e percursos dedicados a cada ciclo de ensino.\n\nAs escolas podem agora marcar visitas com até 6 meses de antecedência e escolher entre diferentes módulos: espécies, ecossistemas, conservação e sustentabilidade.',
      image: IMG.escola,
      date: new Date(year, month - 2, 15),
      author: 'Gabinete Educativo',
      category: 'Educação',
      featured: true,
    },
    {
      slug: 'parceria-conservacao',
      title: 'Nova Parceria de Conservação Animada',
      content:
        'Assinámos uma parceria com uma organização local de conservação para ações conjuntas de reflorestação e monitorização de espécies.\n\nOs visitantes poderão acompanhar o impacto destas ações através de um novo painel no centro do parque.',
      image: IMG.natura,
      date: new Date(year, month - 3, 2),
      author: 'Direção MHM Farms',
      category: 'Conservação',
    },
  ]

  for (const n of news) {
    const exists = await prisma.news.findUnique({ where: { slug: n.slug } })
    if (exists) continue
    await prisma.news.create({ data: n })
  }
  console.log(`📰 ${news.length} notícias criadas.`)

  // ---------- FAQ ----------
  const faqs = [
    {
      question: 'Qual é o horário de funcionamento?',
      answer: 'Estamos abertos de terça a domingo, das 08:00 às 17:00. As segundas-feiras estão reservadas à manutenção. Em dias especiais e feriados os horários podem variar.',
      category: 'geral',
      order: 1,
    },
    {
      question: 'Quanto custa a entrada?',
      answer: 'Adultos custam 200 MT, crianças (3–12 anos) 100 MT, estudantes 120 MT, grupos escolares 80 MT por aluno e famílias têm pacotes especiais a partir de 500 MT.',
      category: 'precos',
      order: 2,
    },
    {
      question: 'É necessário fazer reserva?',
      answer: 'Recomendamos fortemente a reserva, sobretudo aos fins de semana e feriados, para garantir a sua vaga e planeamento da experiência.',
      category: 'geral',
      order: 3,
    },
    {
      question: 'Crianças podem visitar?',
      answer: 'Sim! A MHM Farms é um espaço pensado para famílias. As crianças têm zonas dedicadas e atividades supervisionadas.',
      category: 'geral',
      order: 4,
    },
    {
      question: 'É permitido fotografar?',
      answer: 'Sim, a fotografia é livre para uso pessoal. Para filmagens profissionais ou sessões comerciais contacte a administração.',
      category: 'geral',
      order: 5,
    },
    {
      question: 'Posso levar comida?',
      answer: 'Sim, existem áreas de piquenique com mesas e sombras. Também pode comprar lanches no nosso quiosque.',
      category: 'geral',
      order: 6,
    },
    {
      question: 'Existe estacionamento?',
      answer: 'Sim, temos estacionamento gratuito dentro da propriedade com capacidade para carros e pequenos autocarros.',
      category: 'geral',
      order: 7,
    },
    {
      question: 'Existem visitas escolares?',
      answer: 'Sim, temos um Programa Educativo completo para escolas, com visitas guiadas e atividades adaptadas a cada nível de ensino.',
      category: 'educacao',
      order: 8,
    },
    {
      question: 'É possível organizar eventos?',
      answer: 'Sim, organizamos festas de aniversário, eventos corporativos e celebrações privadas. Contacte-nos para um orçamento personalizado.',
      category: 'eventos',
      order: 9,
    },
    {
      question: 'Posso alimentar os animais?',
      answer: 'Somente nas atividades supervisionadas de alimentação e com a comida fornecida pelo parque, para garantir a saúde de todos os animais.',
      category: 'geral',
      order: 10,
    },
    {
      question: 'Existe acessibilidade para pessoas com mobilidade reduzida?',
      answer: 'Sim, os percursos principais são acessíveis a cadeiras de rodas e temos apoio da equipa para pessoas com mobilidade reduzida.',
      category: 'geral',
      order: 11,
    },
  ]
  for (const f of faqs) {
    if (await prisma.faq.findFirst({ where: { question: f.question } })) continue
    await prisma.faq.create({ data: f })
  }
  console.log(`❓ ${faqs.length} perguntas frequentes criadas.`)

  // ---------- Settings (preços, horários, contactos, redes sociais) ----------
  const settings: Record<string, unknown> = {
    prices: [
      { category: 'Adulto', price: 200 },
      { category: 'Criança (3–12 anos)', price: 100 },
      { category: 'Estudante', price: 120 },
      { category: 'Grupo Escolar (por aluno)', price: 80 },
      { category: 'Família (2 adultos + 2 crianças)', price: 500 },
    ],
    hours: [
      { day: 'Segunda-feira', open: 'Fechado', note: 'Manutenção' },
      { day: 'Terça-feira', open: '08:00 – 17:00', note: '' },
      { day: 'Quarta-feira', open: '08:00 – 17:00', note: '' },
      { day: 'Quinta-feira', open: '08:00 – 17:00', note: '' },
      { day: 'Sexta-feira', open: '08:00 – 17:00', note: '' },
      { day: 'Sábado', open: '08:00 – 18:00', note: 'Fins de semana e feriados' },
      { day: 'Domingo', open: '08:00 – 18:00', note: 'Fins de semana e feriados' },
    ],
    hoursNotice: 'Os horários podem variar em dias especiais e feriados.',
    contacts: {
      address: 'Estrada Nacional 1, KM 24',
      city: 'Boane',
      province: 'Maputo',
      country: 'Moçambique',
      phone: '+258 84 000 0000',
      whatsapp: '+258 84 000 0000',
      email: 'info@mhmfarms.com',
    },
    social: {
      facebook: 'https://facebook.com/mhmfarms',
      instagram: 'https://instagram.com/mhmfarms',
      tiktok: 'https://tiktok.com/@mhmfarms',
      youtube: 'https://youtube.com/@mhmfarms',
    },
    maps: {
      embedUrl:
        'https://www.google.com/maps?q=-26.0167,32.2833&z=13&output=embed',
      gmapsUrl: 'https://www.google.com/maps/search/?api=1&query=MHM+Farms+Boane+Mozambique',
      latitude: '-26.0167',
      longitude: '32.2833',
    },
    home: {
      heroTitle: 'MHM Farms',
      heroSubtitle: 'Onde a Natureza Ganha Vida',
      heroText: 'Descubra uma experiência única de contacto com animais, natureza e aventura.',
    },
    about: {
      intro:
        'A MHM Farms nasceu do sonho de criar um espaço onde a natureza, os animais e as pessoas se encontram. O que começou como uma pequena quinta familiar transformou-se num destino de turismo, educação e conservação.',
      mission:
        'Proporcionar experiências memoráveis de contacto com a natureza, promovendo a educação ambiental e a conservação das espécies.',
      vision:
        'Ser referência nacional em turismo de natureza, bem-estar animal e educação ambiental.',
      values:
        'Conservação · Respeito pelos animais · Educação · Família · Sustentabilidade · Comunidade',
    },
    seo: {
      title: 'MHM Farms — Quinta e Experiência Animal',
      description:
        'Visite a MHM Farms: uma quinta e espaço de conservação animal em Moçambique. Animais, natureza, atividades em família e programas educativos.',
    },
  }

  for (const [key, value] of Object.entries(settings)) {
    const exists = await prisma.setting.findUnique({ where: { key } })
    const json = JSON.stringify(value)
if (exists) await prisma.setting.update({ where: { key }, data: { value: json } })
  else await prisma.setting.create({ data: { key, value: json } })
  }
  console.log('⚙️ Configurações (preços, horários, contactos) gravadas.')

  // ---------- Avaliações ----------
  const feedbacks = [
    { name: 'Maria Fernandes', rating: 5, comment: 'As crianças não quiseram ir embora! Experiência inesquecível para toda a família.' },
    { name: 'João Sitoe', rating: 5, comment: 'Parque muito bem organizado, animais bem cuidados e guias fantásticos.' },
    { name: 'Escola Primária de Boane', rating: 5, comment: 'O programa educativo é excelente; os alunos aprenderam muito e divertiram-se.' },
    { name: 'Ana Muchanga', rating: 4, comment: 'A atividade de alimentação supervisionada foi o ponto alto do dia! Recomendo.' },
  ]
  for (const f of feedbacks) {
    if (await prisma.feedback.findFirst({ where: { name: f.name } })) continue
    await prisma.feedback.create({ data: f })
  }
  console.log('⭐ Avaliações de visitantes criadas.')

  console.log('✅ Base de dados MHM Farms pronta!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })