import { z } from 'zod'

export const emailSchema = z.string().email('Email inválido.').max(160)

const uploadUrl = z.string().url().or(z.string().startsWith('/uploads/').or(z.literal('')))
const imageField = uploadUrl.optional().nullable()

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome demasiado curto.').max(120),
  email: emailSchema,
  phone: z.string().max(40).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const userCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: z.string().max(40).optional().or(z.literal('')),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional().default('STAFF'),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: emailSchema.optional(),
  phone: z.string().max(40).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
})

export const animalSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  species: z.string().min(1).max(160),
  family: z.string().max(120).optional().nullable(),
  category: z.enum(['MAMIFERO', 'AVE', 'REPTIL', 'DOMESTICO', 'OUTRO']),
  habitat: z.string().max(300).optional().nullable(),
  diet: z.string().max(300).optional().nullable(),
  lifeExpectancy: z.string().max(120).optional().nullable(),
  description: z.string().min(1),
  curiosity: z.string().max(500).optional().nullable(),
  funFact: z.string().max(500).optional().nullable(),
  behavior: z.string().max(500).optional().nullable(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  mainImage: imageField,
})

export const experienceSchema = z.object({
  title: z.string().min(1).max(160),
  shortDesc: z.string().min(1).max(300),
  description: z.string().optional().nullable(),
  image: imageField,
  type: z.enum(['VISITA', 'ALIMENTACAO', 'PASSEIO', 'EDUCACAO', 'FAMILIA', 'EVENTO', 'AVENTURA']),
  duration: z.string().max(60),
  minAge: z.string().max(60),
  price: z.coerce.number().min(0),
  availability: z.boolean().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  animalId: z.string().optional().nullable(),
})

export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().datetime().or(z.string().min(1)),
  time: z.string().max(60),
  location: z.string().max(200),
  description: z.string().min(1),
  image: imageField,
  price: z.coerce.number().min(0).optional().default(0),
  maxParticipants: z.coerce.number().int().positive().optional().nullable(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
})

export const reservationSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1).max(60),
  adults: z.coerce.number().int().min(0).max(50).default(1),
  children: z.coerce.number().int().min(0).max(50).default(0),
  visitType: z.string().min(1).max(120),
  experienceId: z.string().optional().nullable(),
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(40),
  email: emailSchema,
  notes: z.string().max(1000).optional().nullable(),
})

export const reservationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
})

export const schoolVisitSchema = z.object({
  schoolName: z.string().min(2).max(160),
  teacherName: z.string().min(2).max(120),
  email: emailSchema,
  phone: z.string().min(6).max(40),
  numStudents: z.coerce.number().int().min(1).max(1000),
  numTeachers: z.coerce.number().int().min(0).max(200).default(0),
  schoolLevel: z.string().max(120).optional(),
  preferredDate: z.string().optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
})

export const gallerySchema = z.object({
  title: z.string().max(160).optional(),
  category: z.string().default('animais'),
  type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  url: z.string().min(1),
  videoUrl: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

export const newsSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  image: imageField,
  date: z.string().optional(),
  author: z.string().min(1).max(120),
  category: z.string().max(120),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
})

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().max(120),
  order: z.coerce.number().int().default(0),
  active: z.boolean().optional(),
})

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: z.string().max(40).optional().or(z.literal('')),
  subject: z.string().min(1).max(200),
  message: z.string().min(5).max(3000),
})

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
})

export const feedbackSchema = z.object({
  name: z.string().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
})