import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { protect, signToken } from '../lib/auth'
import { validate } from '../lib/utils'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from '../lib/schemas'
import { config } from '../config'

const router = Router()

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !user.active) {
    res.status(401).json({ error: 'Credenciais inválidas.' })
    return
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Credenciais inválidas.' })
    return
  }
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role }
  const token = signToken(payload)
  res.json({ token, user: payload })
})

router.post('/logout', protect, (_req, res) => {
  res.json({ ok: true })
})

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    res.json({ ok: true })
    return
  }
  const token = crypto.randomBytes(32).toString('hex')
  const key = `reset:${user.id}`
  const existing = await prisma.setting.findUnique({ where: { key } })
  const value = JSON.stringify({ token, expires: Date.now() + 1000 * 60 * 60 })
  if (existing) await prisma.setting.update({ where: { key }, data: { value } })
  else await prisma.setting.create({ data: { key, value } })

  const link = `${config.publicBaseUrl}/recuperar-senha?token=${token}`
  // Em produção, enviar por email (SMTP). Aqui devolvemos o link para desenvolvimento.
  res.json({ ok: true, resetLink: `DEV_LINK: ${link}` })
})

router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  const { token, newPassword } = req.body
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: 'reset:' } },
  })
  let userId: string | null = null
  for (const s of settings) {
    const data = JSON.parse(s.value) as { token: string; expires: number }
    if (data.token === token && data.expires > Date.now()) {
      userId = s.key.replace('reset:', '')
      await prisma.setting.delete({ where: { key: s.key } })
      break
    }
  }
  if (!userId) {
    res.status(400).json({ error: 'Token inválido ou expirado.' })
    return
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })
  res.json({ ok: true })
})

router.get('/me', protect, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) {
    res.status(404).json({ error: 'Utilizador não encontrado.' })
    return
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  })
})

router.post('/change-password', protect, validate(changePasswordSchema), async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) {
    res.status(404).json({ error: 'Utilizador não encontrado.' })
    return
  }
  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) {
    res.status(400).json({ error: 'Senha atual incorreta.' })
    return
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })
  res.json({ ok: true })
})

export default router