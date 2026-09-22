import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import { config } from './config'

import authRoutes from './routes/auth'
import animalRoutes from './routes/animals'
import experienceRoutes from './routes/experiences'
import eventRoutes from './routes/events'
import reservationRoutes from './routes/reservations'
import schoolVisitRoutes from './routes/schoolVisits'
import galleryRoutes from './routes/gallery'
import newsRoutes from './routes/news'
import faqRoutes from './routes/faq'
import contactRoutes from './routes/contacts'
import settingRoutes from './routes/settings'
import dashboardRoutes from './routes/dashboard'
import userRoutes from './routes/users'
import feedbackRoutes from './routes/feedback'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet({ crossOriginResourcePolicy: false }))
  app.use(
    cors({
      origin: config.clientOrigin === '*' ? true : config.clientOrigin.split(','),
      credentials: true,
    })
  )
  app.use(express.json({ limit: '2mb' }))

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados pedidos. Tente novamente mais tarde.' },
  })
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas tentativas. Aguarde alguns minutos.' },
  })

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'MHM Farms API', time: new Date().toISOString() })
  })

  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/animals', apiLimiter, animalRoutes)
  app.use('/api/experiences', apiLimiter, experienceRoutes)
  app.use('/api/events', apiLimiter, eventRoutes)
  app.use('/api/reservations', apiLimiter, reservationRoutes)
  app.use('/api/school-visits', apiLimiter, schoolVisitRoutes)
  app.use('/api/gallery', apiLimiter, galleryRoutes)
  app.use('/api/news', apiLimiter, newsRoutes)
  app.use('/api/faqs', apiLimiter, faqRoutes)
  app.use('/api/contacts', apiLimiter, contactRoutes)
  app.use('/api/settings', apiLimiter, settingRoutes)
  app.use('/api/dashboard', apiLimiter, dashboardRoutes)
  app.use('/api/users', apiLimiter, userRoutes)
  app.use('/api/feedback', apiLimiter, feedbackRoutes)

  // Servir o build do cliente em produção
  const clientDist = path.resolve(process.cwd(), '../client/dist')
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist))
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'))
    })
  }

  app.use(
    (
      err: Error & { status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err)
      res
        .status(err.status || 500)
        .json({ error: err.message || 'Erro interno do servidor.' })
    }
  )

  return app
}