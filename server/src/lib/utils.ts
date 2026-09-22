import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { prisma } from './prisma'

export const paramId = (req: Request): string => String(req.params.id)

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Dados inválidos.', details: result.error.flatten() })
      return
    }
    req.body = result.data
    next()
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

export async function generateReservationCode(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `MHM-${year}-`
  const count = await prisma.reservation.count()
  const next = String(count + 1).padStart(6, '0')
  return `${prefix}${next}`
}