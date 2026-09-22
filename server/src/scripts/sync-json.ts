import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import type { AnimalCategory, ExperienceType } from '@prisma/client'

const prisma = new PrismaClient()

interface ContentFile {
  animals: Array<{
    slug: string
    name: string
    species: string
    family: string | null
    category: string
    habitat: string | null
    diet: string | null
    lifeExpectancy: string | null
    description: string
    curiosity: string | null
    funFact: string | null
    behavior: string | null
    featured: boolean
    active: boolean
    mainImage: string
    images: Array<{ url: string; alt: string | null; sortOrder: number }>
  }>
  experiences: Array<{
    slug: string
    title: string
    shortDesc: string
    description: string | null
    image: string
    type: string
    duration: string
    minAge: string
    price: number
    availability: boolean
    featured: boolean
    active: boolean
    animalSlug: string | null
  }>
  events: Array<{
    slug: string
    title: string
    date: string
    time: string
    location: string
    description: string
    image: string
    price: number
    maxParticipants: number | null
    active: boolean
    featured: boolean
  }>
  news: Array<{
    slug: string
    title: string
    content: string
    image: string | null
    date: string
    author: string
    category: string
    active: boolean
    featured: boolean
  }>
  gallery: Array<{
    title: string | null
    category: string
    type: string
    url: string
    videoUrl: string | null
    active: boolean
  }>
  faqs: Array<{
    question: string
    answer: string
    category: string
    order: number
    active: boolean
  }>
  settings: Record<string, unknown>
}

export async function syncContent(content: ContentFile) {
  const animalIds = new Map<string, string>()

  // ---- Settings ----
  for (const [key, value] of Object.entries(content.settings || {})) {
    const json = JSON.stringify(value ?? {})
    const existing = await prisma.setting.findUnique({ where: { key } })
    if (existing) await prisma.setting.update({ where: { key }, data: { value: json } })
    else await prisma.setting.create({ data: { key, value: json } })
  }

  // ---- Animais (com imagens) ----
  for (const a of content.animals) {
    const found = await prisma.animal.findUnique({ where: { slug: a.slug } })
    const data = {
      slug: a.slug,
      name: a.name,
      species: a.species,
      family: a.family,
      category: a.category as AnimalCategory,
      habitat: a.habitat,
      diet: a.diet,
      lifeExpectancy: a.lifeExpectancy,
      description: a.description,
      curiosity: a.curiosity,
      funFact: a.funFact,
      behavior: a.behavior,
      featured: a.featured ?? false,
      active: a.active ?? true,
      mainImage: a.mainImage ?? '',
    }
    let animal
    if (found) {
      animal = await prisma.animal.update({
        where: { id: found.id },
        data: {
          ...data,
          images: {
            deleteMany: {},
            create: (a.images || []).map((img, i) => ({
              url: img.url,
              alt: img.alt ?? a.name,
              sortOrder: i,
            })),
          },
        },
      })
    } else {
      animal = await prisma.animal.create({
        data: {
          ...data,
          images: {
            create: (a.images || []).map((img, i) => ({
              url: img.url,
              alt: img.alt ?? a.name,
              sortOrder: i,
            })),
          },
        },
      })
    }
    animalIds.set(a.slug, animal.id)
  }

  // ---- Experiências (relacionadas com animais por slug) ----
  for (const e of content.experiences) {
    const animalId = e.animalSlug ? animalIds.get(e.animalSlug) ?? null : null
    const data = {
      slug: e.slug,
      title: e.title,
      shortDesc: e.shortDesc,
      description: e.description,
      image: e.image ?? '',
      type: e.type as ExperienceType,
      duration: e.duration,
      minAge: e.minAge,
      price: e.price ?? 0,
      availability: e.availability ?? true,
      featured: e.featured ?? false,
      active: e.active ?? true,
      animalId,
    }
    const found = await prisma.experience.findUnique({ where: { slug: e.slug } })
    if (found) await prisma.experience.update({ where: { id: found.id }, data })
    else await prisma.experience.create({ data })
  }

  // ---- Eventos ----
  for (const ev of content.events) {
    const data = {
      slug: ev.slug,
      title: ev.title,
      date: new Date(ev.date),
      time: ev.time,
      location: ev.location,
      description: ev.description,
      image: ev.image ?? '',
      price: ev.price ?? 0,
      maxParticipants: ev.maxParticipants ?? null,
      active: ev.active ?? true,
      featured: ev.featured ?? false,
    }
    const found = await prisma.event.findUnique({ where: { slug: ev.slug } })
    if (found) await prisma.event.update({ where: { id: found.id }, data })
    else await prisma.event.create({ data })
  }

  // ---- Notícias ----
  for (const n of content.news) {
    const data = {
      slug: n.slug,
      title: n.title,
      content: n.content,
      image: n.image ?? null,
      date: new Date(n.date),
      author: n.author,
      category: n.category,
      active: n.active ?? true,
      featured: n.featured ?? false,
    }
    const found = await prisma.news.findUnique({ where: { slug: n.slug } })
    if (found) await prisma.news.update({ where: { id: found.id }, data })
    else await prisma.news.create({ data })
  }

  // ---- Galeria e FAQ: espelho total ----
  await prisma.galleryItem.deleteMany()
  for (const g of content.gallery) {
    await prisma.galleryItem.create({
      data: {
        title: g.title ?? null,
        category: g.category ?? 'animais',
        type: g.type ?? 'IMAGE',
        url: g.url,
        videoUrl: g.videoUrl ?? null,
        active: g.active ?? true,
      },
    })
  }

  await prisma.faq.deleteMany()
  for (const f of content.faqs) {
    await prisma.faq.create({
      data: {
        question: f.question,
        answer: f.answer,
        category: f.category ?? 'geral',
        order: f.order ?? 0,
        active: f.active ?? true,
      },
    })
  }

  // ---- Remoção de conteúdo que deixou de existir no JSON ----
  const animalSlugs = content.animals.map((a) => a.slug)
  await prisma.animal.deleteMany({ where: { slug: { notIn: animalSlugs } } })

  const expSlugs = content.experiences.map((e) => e.slug)
  await prisma.experience.deleteMany({ where: { slug: { notIn: expSlugs } } })

  const eventSlugs = content.events.map((e) => e.slug)
  await prisma.event.deleteMany({ where: { slug: { notIn: eventSlugs } } })

  const newsSlugs = content.news.map((n) => n.slug)
  await prisma.news.deleteMany({ where: { slug: { notIn: newsSlugs } } })
}

export function loadContent(path?: string): ContentFile {
  const file = resolve(process.cwd(), path || 'data/content.json')
  const raw = readFileSync(file, 'utf8')
  const parsed = JSON.parse(raw) as ContentFile
  return parsed
}

export type { ContentFile }

async function main() {
  const content = loadContent()
  await syncContent(content)
  const counts = {
    animais: content.animals.length,
    experiencias: content.experiences.length,
    eventos: content.events.length,
    noticias: content.news.length,
    galeria: content.gallery.length,
    faqs: content.faqs.length,
    settings: Object.keys(content.settings).length,
  }
  console.log('✅ MySQL sincronizado com content.json')
  console.table(counts)
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Erro a sincronizar:', e)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}