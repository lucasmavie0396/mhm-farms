import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { prisma } from './prisma'
import type { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions)
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autenticado.' })
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user || !user.active) {
      res.status(401).json({ error: 'Utilizador inválido ou inativo.' })
      return
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Sessão expirada ou inválida.' })
  }
}

export function allowRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Sem permissão para esta operação.' })
      return
    }
    next()
  }
}

export function keep<T>(entity: T): T {
  return entity
}