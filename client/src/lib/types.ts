export type Role = 'ADMIN' | 'MANAGER' | 'STAFF'

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: Role
  active?: boolean
}

export interface AnimalImage {
  id: string
  url: string
  alt?: string | null
  sortOrder: number
}

export interface Animal {
  id: string
  slug: string
  name: string
  species: string
  family?: string | null
  category: 'MAMIFERO' | 'AVE' | 'REPTIL' | 'DOMESTICO' | 'OUTRO'
  habitat?: string | null
  diet?: string | null
  lifeExpectancy?: string | null
  description: string
  curiosity?: string | null
  funFact?: string | null
  behavior?: string | null
  featured: boolean
  active: boolean
  mainImage: string
  images: AnimalImage[]
}

export interface Experience {
  id: string
  slug: string
  title: string
  shortDesc: string
  description?: string | null
  image: string
  type: string
  duration: string
  minAge: string
  price: number
  availability: boolean
  featured: boolean
  active: boolean
  animal?: { id: string; name: string; slug: string } | null
}

export interface Event {
  id: string
  slug: string
  title: string
  date: string
  time: string
  location: string
  description: string
  image: string
  price: number
  maxParticipants?: number | null
  active: boolean
  featured: boolean
}

export interface Reservation {
  id: string
  code: string
  date: string
  time: string
  adults: number
  children: number
  totalVisitors: number
  visitType: string
  name: string
  phone: string
  email: string
  notes?: string | null
  experienceId?: string | null
  experience?: Experience | null
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  totalPrice: number
  breakdown?: { service: string; qty: number; unit: number; total: number }[]
  createdAt: string
}

export interface SchoolVisit {
  id: string
  schoolName: string
  teacherName: string
  email: string
  phone: string
  numStudents: number
  numTeachers: number
  schoolLevel?: string | null
  preferredDate?: string | null
  message?: string | null
  status: string
  createdAt: string
}

export interface GalleryItem {
  id: string
  title?: string | null
  category: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  videoUrl?: string | null
  active: boolean
}

export interface News {
  id: string
  slug: string
  title: string
  content: string
  image?: string | null
  date: string
  author: string
  category: string
  active: boolean
  featured: boolean
}

export interface Faq {
  id: string
  question: string
  answer: string
  category: string
  order: number
  active: boolean
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
  status: 'NEW' | 'READ' | 'ARCHIVED'
  createdAt: string
}

export interface PriceRow {
  category: string
  price: number
}

export interface HoursRow {
  day: string
  open: string
  note?: string
}

export interface PublicSettings {
  prices?: PriceRow[]
  hours?: HoursRow[]
  hoursNotice?: string
  contacts?: {
    address: string
    city: string
    province: string
    country: string
    phone: string
    whatsapp: string
    email: string
  }
  social?: {
    facebook: string
    instagram: string
    tiktok: string
    youtube: string
  }
  maps?: {
    embedUrl: string
    gmapsUrl: string
    latitude: string
    longitude: string
  }
  home?: {
    heroTitle: string
    heroSubtitle: string
    heroText: string
  }
  about?: {
    intro: string
    mission: string
    vision: string
    values: string
  }
  seo?: {
    title: string
    description: string
  }
  branding?: {
    logo: string
  }
}

export interface DashboardData {
  range: { from: string; to: string }
  visitors: { today: number; week: number; month: number; period: number; overall: number; ticketVisitors: number }
  reservations: {
    period: number
    pending: number
    confirmed: number
    cancelled: number
    revenue: number
    revenuePending: number
  }
  sales: { period: number; revenue: number }
  content: { animals: number; events: number; messages: number }
  charts: {
    byDay: { date: string; visitors: number }[]
    topExperiences: { id: string | null; name: string; count: number }[]
  }
  recent: Reservation[]
}

export type PaymentMethod = 'CASH' | 'MPESA' | 'EMOLA' | 'CARD' | 'OTHER'

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  MPESA: 'M-Pesa',
  EMOLA: 'e-Mola',
  CARD: 'Cartão / Multicaixa',
  OTHER: 'Outro',
}

export interface TicketSaleItem {
  service: string
  qty: number
  unit: number
  total: number
}

export interface TicketSale {
  id: string
  code: string
  date: string
  items: TicketSaleItem[]
  totalPrice: number
  totalVisitors: number
  paymentMethod: PaymentMethod
  customerName?: string | null
  status: string
  seller?: { id: string; name: string } | null
  createdAt: string
}

export interface Feedback {
  id: string
  name: string
  rating: number
  comment: string
  active: boolean
}

export interface RevenueReport {
  range: { from: string; to: string; status: string }
  summary: {
    reservations: number
    visitors: number
    revenue: number
    pendingValue: number
    confirmed: number
    completed: number
    cancelled: number
    pending: number
    ticketCount: number
    ticketsSold: number
    ticketRevenue: number
    ticketVisitors: number
  }
  byDay: { name: string; count: number; revenue: number; visitors: number; tickets?: number; ticketRevenue?: number; ticketVisitors?: number }[]
  byStatus: { name: string; count: number; revenue: number; visitors: number }[]
  byService: { name: string; qty: number; revenue: number }[]
  ticketByMethod: { name: string; count: number; revenue: number }[]
  reservations: {
    id: string
    code: string
    date: string
    time: string
    name: string
    email: string
    phone: string
    visitors: number
    visitType: string
    experience: string | null
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    totalPrice: number
  }[]
}