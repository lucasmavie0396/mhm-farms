import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📤 A exportar conteúdo da base de dados para content.json...')

  const animals = await prisma.animal.findMany({
    orderBy: { name: 'asc' },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })

  const experiences = await prisma.experience.findMany({
    orderBy: { createdAt: 'asc' },
    include: { animal: { select: { slug: true } } },
  })

  const events = await prisma.event.findMany({ orderBy: { date: 'asc' } })
  const news = await prisma.news.findMany({ orderBy: { createdAt: 'asc' } })
  const gallery = await prisma.galleryItem.findMany({ orderBy: { createdAt: 'asc' } })
  const faqs = await prisma.faq.findMany({ orderBy: { order: 'asc' } })
  const settingsRows = await prisma.setting.findMany()

  const settings: Record<string, unknown> = {}
  for (const s of settingsRows) {
    try {
      settings[s.key] = JSON.parse(s.value)
    } catch {
      settings[s.key] = null
    }
  }

  const content = {
    $comment:
      'Fonte de verdade do conteúdo do site. Edite este ficheiro e o watcher (npm run json:watch) sincroniza com o MySQL em tempo real.',
    animals: animals.map(({ id: _id, createdAt: _ca, updatedAt: _ua, images, ...a }) => ({
      ...a,
      images: images.map(({ url, alt, sortOrder }) => ({ url, alt, sortOrder })),
    })),
    experiences: experiences.map(({ id: _id, createdAt: _ca, updatedAt: _ua, animal, ...e }) => ({
      ...e,
      animalSlug: animal?.slug ?? null,
    })),
    events: events.map(({ id: _id, createdAt: _ca, updatedAt: _ua, ...ev }) => ({
      ...ev,
      date: ev.date.toISOString(),
    })),
    news: news.map(({ id: _id, createdAt: _ca, updatedAt: _ua, ...n }) => ({
      ...n,
      date: n.date.toISOString(),
    })),
    gallery: gallery.map(({ id: _id, createdAt: _ca, ...g }) => g),
    faqs: faqs.map(({ id: _id, ...f }) => f),
    settings,
  }

  const out = resolve(process.cwd(), 'data/content.json')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(content, null, 2), 'utf8')
  console.log(`✅ content.json gerado em ${out}`)
  console.log(
    `   ${content.animals.length} animais · ${content.experiences.length} experiências · ${content.events.length} eventos · ${content.news.length} notícias · ${content.gallery.length} galeria · ${content.faqs.length} faqs`
  )
}

main()
  .catch((e) => {
    console.error('❌ Erro a exportar conteúdo:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())