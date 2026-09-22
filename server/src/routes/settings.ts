import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { allowRoles, protect } from '../lib/auth'
import { validate } from '../lib/utils'
import { settingSchema } from '../lib/schemas'
import { getSetting } from '../config'

const router = Router()

const PUBLIC_KEYS = ['prices', 'hours', 'hoursNotice', 'contacts', 'social', 'maps', 'home', 'about', 'seo']

router.get('/public', async (_req, res) => {
  const settings = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } })
  const out: Record<string, unknown> = {}
  for (const s of settings) {
    out[s.key] = getSetting(s.value, null)
  }
  res.json(out)
})

router.get('/admin/all', protect, allowRoles('ADMIN'), async (_req, res) => {
  const settings = await prisma.setting.findMany()
  const out: Record<string, unknown> = {}
  for (const s of settings) out[s.key] = getSetting(s.value, null)
  res.json(out)
})

router.put('/', protect, allowRoles('ADMIN'), validate(settingSchema), async (req, res) => {
  const { key, value } = req.body
  const json = JSON.stringify(value)
  const existing = await prisma.setting.findUnique({ where: { key } })
  if (existing) await prisma.setting.update({ where: { key }, data: { value: json } })
  else await prisma.setting.create({ data: { key, value: json } })
  res.json({ ok: true, key })
})

export default router