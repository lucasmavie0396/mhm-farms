import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5173',
  defaultAdmin: {
    email: process.env.ADMIN_EMAIL || 'admin@mhmfarms.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
  whatsapp: process.env.WHATSAPP || '',
}

export function getSetting<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}