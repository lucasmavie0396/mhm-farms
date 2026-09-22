import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, slugify, paramId } from '../lib/utils'
import { animalSchema } from '../lib/schemas'

const router = Router()

// ---------- Público ----------
router.get('/', async (req, res) => {
  const { category, featured } = req.query
  const where: Record<string, unknown> = { active: true }
  if (category && category !== 'todos') where.category = category
  if (featured === 'true') where.featured = true
  const animals = await prisma.animal.findMany({
    where,
    include: { images: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { name: 'asc' },
  })
  res.json(animals)
})

router.get('/categories', async (_req, res) => {
  res.json([
    { key: 'MAMIFERO', label: 'Mamíferos' },
    { key: 'AVE', label: 'Aves' },
    { key: 'REPTIL', label: 'Répteis' },
    { key: 'DOMESTICO', label: 'Animais Domésticos' },
    { key: 'OUTRO', label: 'Outros' },
  ])
})

// ---------- Administração ----------
router.use(protect, allowRoles('ADMIN', 'MANAGER'))

router.get('/admin/all', async (_req, res) => {
  const animals = await prisma.animal.findMany({
    include: { images: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(animals)
})

router.post('/', validate(animalSchema), async (req, res) => {
  const { mainImage, images, ...data } = req.body as typeof req.body & {
    images?: { url: string; alt?: string }[]
  }
  const slug = (req.body.slug as string | undefined)?.length
    ? (req.body.slug as string)
    : `${slugify(data.name)}-${Date.now().toString(36)}`
  const animal = await prisma.animal.create({
    data: {
      ...data,
      slug,
      mainImage: mainImage ?? '',
      images: images?.length
        ? { create: images.map((img: { url: string; alt?: string }, i: number) => ({ url: img.url, alt: img.alt, sortOrder: i })) }
        : { create: { url: mainImage ?? '', alt: data.name, sortOrder: 0 } },
    },
    include: { images: true },
  })
  res.status(201).json(animal)
})

router.put('/:id', validate(animalSchema), async (req, res) => {
  const { images, slug, ...data } = req.body as typeof req.body & {
    images?: { url: string; alt?: string }[]
    slug?: string
  }
  const existing = await prisma.animal.findUnique({
    where: { id: paramId(req) },
    include: { images: true },
  })
  if (!existing) {
    res.status(404).json({ error: 'Animal não encontrado.' })
    return
  }
  await prisma.animalImage.deleteMany({ where: { animalId: existing.id } })
  const animal = await prisma.animal.update({
    where: { id: existing.id },
    data: {
      ...data,
      slug: slug || `animal-${existing.id}`,
      images: {
        create: (images?.length ? images : [{ url: data.mainImage ?? '', alt: data.name, sortOrder: 0 }]).map(
          (img: { url: string; alt?: string }, i: number) => ({ url: img.url, alt: img.alt, sortOrder: i })
        ),
      },
    },
    include: { images: true },
  })
  res.json(animal)
})

router.patch('/:id/toggle', async (req, res) => {
  const existing = await prisma.animal.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Animal não encontrado.' })
    return
  }
  const animal = await prisma.animal.update({
    where: { id: existing.id },
    data: { active: !existing.active },
  })
  res.json(animal)
})

router.delete('/:id', async (req, res) => {
  await prisma.animal.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

// ---------- Público (detalhe) — definido no final para não colidir com rotas admin ---
router.get('/:slug', async (req, res) => {
  const animal = await prisma.animal.findUnique({
    where: { slug: req.params.slug },
    include: { images: { orderBy: { sortOrder: 'asc' } }, experiences: true },
  })
  if (!animal || !animal.active) {
    res.status(404).json({ error: 'Animal não encontrado.' })
    return
  }
  res.json(animal)
})

export default router