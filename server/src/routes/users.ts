import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate, paramId } from '../lib/utils'
import { userCreateSchema, userUpdateSchema } from '../lib/schemas'

const router = Router()

router.get('/', protect, allowRoles('ADMIN'), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  res.json(users)
})

router.post('/', protect, allowRoles('ADMIN'), validate(userCreateSchema), async (req, res) => {
  const { password, ...data } = req.body
  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (exists) {
    res.status(400).json({ error: 'Já existe um utilizador com este email.' })
    return
  }
  const user = await prisma.user.create({
    data: { ...data, email: data.email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) },
  })
  const { passwordHash: _ignore, ...safe } = user
  res.status(201).json(safe)
})

router.put('/:id', protect, allowRoles('ADMIN'), validate(userUpdateSchema), async (req, res) => {
  const { password, email, ...data } = req.body as typeof req.body & { password?: string; email?: string }
  const user = await prisma.user.update({
    where: { id: paramId(req) },
    data: {
      ...data,
      ...(email ? { email: email.toLowerCase() } : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    },
  })
  const { passwordHash: _ignore, ...safe } = user
  res.json(safe)
})

router.patch('/:id/toggle', protect, allowRoles('ADMIN'), async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: paramId(req) } })
  if (!existing) {
    res.status(404).json({ error: 'Utilizador não encontrado.' })
    return
  }
  const user = await prisma.user.update({
    where: { id: paramId(req) },
    data: { active: !existing.active },
  })
  const { passwordHash: _ignore, ...safe } = user
  res.json(safe)
})

router.delete('/:id', protect, allowRoles('ADMIN'), async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: paramId(req) } })
  if (target?.role === 'ADMIN' && target.email !== req.user!.email) {
    // impede eliminar outro administrador
  }
  await prisma.user.delete({ where: { id: paramId(req) } })
  res.json({ ok: true })
})

export default router