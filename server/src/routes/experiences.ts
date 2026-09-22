import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, slugify, paramId } from '../lib/utils'
import { experienceSchema } from '../lib/schemas'

const router = Router()

router.get('/', async (req, res) => {
  const { type } = req.query
  const where: Record<string, unknown> = { active: true }
  if (type && type !== 'todos') where.type = type
  const experiences = await prisma.experience.findMany({
    where,
    include: { animal: { select: { id: true, name: true, slug: true } } },
    orderBy: { featured: 'desc' },
  })
  res.json(experiences)
})

router.get('/types', async (_req, res) => {
  res.json([
    { key: 'VISITA', label: 'Visitas' },
    { key: 'ALIMENTACAO', label: 'Alimentação' },
    { key: 'PASSEIO', label: 'Passeios' },
    { key: 'EDUCACAO', label: 'Educação' },
    { key: 'FAMILIA', label: 'Família' },
    { key: 'EVENTO', label: 'Eventos' },
    { key: 'AVENTURA', label: 'Aventura' },
  ])
})

router.get('/admin/all', protect, allowRoles('ADMIN', 'MANAGER'), async (_req, res) => {
  res.json(await prisma.experience.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.post('/', protect, allowRoles('ADMIN', 'MANAGER'), validate(experienceSchema), async (req, res) => {
  const data = req.body
  const experience = await prisma.experience.create({
    data: { ...data, image: data.image ?? '', slug: `${slugify(data.title)}-${Date.now().toString(36)}` },
  })
  res.status(201).json(experience)
})

router.put('/:id', protect, allowRoles('ADMIN', 'MANAGER'), validate(experienceSchema), async (req, res) => {
  const { slug, ...data } = req.body as typeof req.body & { slug?: string }
  const experience = await prisma.experience.update({
    where: { id: paramId(req) },
    data: { ...data, image: data.image ?? '', slug: slug || `exp-${paramId(req)}` },
  })
  res.json(experience)
})

router.patch('/:id/toggle', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  const existing = await prisma.experience.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Experiência não encontrada.' })
    return
  }
  const updated = await prisma.experience.update({
    where: { id: paramId(req) },
    data: { active: !existing.active },
  })
  res.json(updated)
})

router.delete('/:id', protect, allowRoles('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.experience.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

router.get('/:slug', async (req, res) => {
  const experience = await prisma.experience.findUnique({
    where: { slug: req.params.slug },
    include: { animal: { select: { id: true, name: true, slug: true } } },
  })
  if (!experience || !experience.active) {
    res.status(404).json({ error: 'Experiência não encontrada.' })
    return
  }
  res.json(experience)
})

export default router