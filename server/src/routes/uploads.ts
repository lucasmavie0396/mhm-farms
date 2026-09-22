import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { allowRoles, protect } from '../lib/auth'

const router = Router()

export const uploadsDir = path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'])
const EXT_ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const base = path.basename(file.originalname, ext)
      .normalize('NFKD')
      .replace(/[^\w-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
    cb(null, `${Date.now()}-${base || 'imagem'}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const ok = ALLOWED.has(file.mimetype) || (file.mimetype === 'application/octet-stream' && EXT_ALLOWED.has(ext))
    if (ok) cb(null, true)
    else cb(new Error('Formato de imagem não suportado. Use JPG, PNG, WebP, GIF, AVIF ou BMP.'))
  },
})

router.post('/', protect, allowRoles('ADMIN', 'MANAGER'), upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum ficheiro enviado.' })
    return
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})

export default router