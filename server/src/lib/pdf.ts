import PDFDocument from 'pdfkit'
import type { Reservation, Experience } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'
import { prisma } from './prisma'
import { uploadsDir } from '../routes/uploads'
import { buildBreakdown, type PriceBreakdown } from './pricing'

export const reservationsDir = path.resolve(process.cwd(), 'reservations')
fs.mkdirSync(reservationsDir, { recursive: true })

const GREEN = '#1B4332'
const GOLD = '#D4A017'
const LIGHT = '#F3F7F2'

export type SettingsBundle = {
  branding?: { logo?: string }
  contacts?: Record<string, string>
  tagline?: string
}

export async function loadSettings(): Promise<SettingsBundle> {
  const rows = await prisma.setting.findMany()
  const s: Record<string, unknown> = {}
  for (const r of rows) {
    try {
      s[r.key] = JSON.parse(r.value)
    } catch {
      s[r.key] = null
    }
  }
  return {
    branding: (s.branding ?? {}) as SettingsBundle['branding'],
    contacts: (s.contacts ?? {}) as Record<string, string>,
    tagline: ((s.home as { heroSubtitle?: string } | null)?.heroSubtitle) || 'Onde a Natureza Ganha Vida',
  }
}

export async function logoFile(logoUrl?: string): Promise<string | null> {
  if (!logoUrl) return null
  if (logoUrl.startsWith('/uploads/')) {
    const p = path.join(uploadsDir, path.basename(logoUrl))
    if (fs.existsSync(p)) return p
  }
  return null
}

export function reservationPdfPath(code: string): string {
  return path.join(reservationsDir, `${code.replace(/[^\w-]/g, '')}.pdf`)
}

export function buildReservationPdf(
  reservation: Reservation & { experience?: Experience | null },
  opts: { logoFile?: string; contacts?: Record<string, string>; tagline?: string; breakdown?: PriceBreakdown }
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

  const W = doc.page.width
  const M = 48
  const contentW = W - M * 2
  const pad = (p: number | string) => String(p).padStart(2, '0')
  const money = (v: number) => `${v.toFixed(2).replace('.', ',')} MT`
  const fmtDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`

  // ---- Cabeçalho moderno ----
  doc.rect(0, 0, W, 150).fill(GREEN)
  doc.rect(0, 150, W, 5).fill(GOLD)

  let leftX = M
  if (opts.logoFile) {
    try {
      doc.save()
      doc.rect(M, 28, 74, 74).fill('#FFFFFF')
      doc.image(opts.logoFile, M + 6, 34, { fit: [62, 62], align: 'center', valign: 'center' })
      doc.restore()
      leftX = M + 100
    } catch (e) {
      console.error('Não foi possível incluir o logótipo no PDF:', e)
      doc.restore()
    }
  }

  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(30).text('Confirmação de Reserva', leftX, 36, { width: W - leftX - M })
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica')
    .fontSize(13)
    .text(`MHM Farms — ${opts.tagline || 'Onde a Natureza Ganha Vida'}`, leftX, 78, { width: W - leftX - M })
  doc
    .fillColor(GOLD)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(`Código: ${reservation.code}`, leftX, 108, { width: W - leftX - M })

  // ---- Corpo: dados da reserva ----
  type Row = [string, string]
  const rows: Row[] = [
    ['Data da visita', fmtDate(reservation.date)],
    ['Horário', reservation.time || '—'],
    ['Tipo de visita', reservation.visitType],
    ['Experiência', reservation.experience?.title || '—'],
    ['Adultos', String(reservation.adults)],
    ['Crianças', String(reservation.children)],
    ['Total de visitantes', String(reservation.totalVisitors)],
    ['Estado', reservation.status === 'CONFIRMED' ? 'CONFIRMADA' : reservation.status],
  ]

  const colW = contentW / 2
  let y = 186
  let i = 0
  for (const [k, v] of rows) {
    const cx = i % 2 === 0 ? M : M + colW
    const rowH = 34
    const isPair = i % 2 === 0
    doc.rect(cx, y, colW - 16, rowH).fill(isPair ? LIGHT : '#FFFFFF')
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8.5).text(k.toUpperCase(), cx + 12, y + 6, { width: colW - 40 })
    doc.fillColor('#334155').font('Helvetica').fontSize(11).text(v, cx + 12, y + 19, { width: colW - 40 })
    i++
    if (!isPair) y += rowH
  }
  if (i % 2 !== 0) y += 34

  // ---- Serviços discriminados ----
  const breakdown = opts.breakdown || []
  if (breakdown.length) {
    y += 14
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text('SERVIÇOS', M, y + 2)
    y += 18

    const qtyW = 46
    const unitW = 100
    const totW = 104
    const serviceW = contentW - qtyW - unitW - totW
    const cellPad = 10
    const qtyX = M + serviceW
    const unitX = qtyX + qtyW
    const totX = unitX + unitW
    const th = 24
    const rh = 28

    doc.rect(M, y, contentW, th).fill(GREEN)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5)
    doc.text('SERVIÇO', M + cellPad, y + 8, { width: serviceW - cellPad - 8, ellipsis: true })
    doc.text('QTD', qtyX, y + 8, { width: qtyW, align: 'center' })
    doc.text('PREÇO UNIT.', unitX + cellPad, y + 8, { width: unitW - cellPad * 2, align: 'right' })
    doc.text('TOTAL', totX + cellPad, y + 8, { width: totW - cellPad * 2, align: 'right' })
    y += th

    breakdown.forEach((item, idx) => {
      doc.rect(M, y, contentW, rh).fill(idx % 2 === 0 ? LIGHT : '#FFFFFF')
      doc
        .fillColor('#1E293B')
        .font('Helvetica')
        .fontSize(10)
        .text(item.service, M + cellPad, y + 10, { width: serviceW - cellPad - 8, ellipsis: true })
      doc.fillColor('#334155').font('Helvetica').fontSize(10).text(String(item.qty), qtyX, y + 10, { width: qtyW, align: 'center' })
      doc.font('Helvetica').fontSize(10).text(money(item.unit), unitX + cellPad, y + 10, { width: unitW - cellPad * 2, align: 'right' })
      doc.font('Helvetica-Bold').fontSize(10).text(money(item.total), totX + cellPad, y + 10, { width: totW - cellPad * 2, align: 'right' })
      y += rh
    })

    doc.rect(M, y, contentW, 32).fill(GREEN)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text('TOTAL A PAGAR', M + cellPad, y + 10)
    doc.font('Helvetica-Bold').fontSize(13).text(money(reservation.totalPrice), totX + cellPad, y + 8, { width: totW - cellPad * 2, align: 'right' })
    y += 32
  }

  // Observações
  if (reservation.notes) {
    y += 8
    doc.rect(M, y, contentW, 52).fill('#FFF8E1')
    doc.fillColor('#7A5C00').font('Helvetica-Bold').fontSize(9).text('OBSERVAÇÕES', M + 12, y + 6)
    doc.fillColor('#3B3420').font('Helvetica').fontSize(10).text(reservation.notes, M + 12, y + 21, { width: contentW - 24 })
    y += 60
  }

  // Bloco do cliente
  y += 10
  doc.rect(0, y, W, 60).fill('#F8FAF9')
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text('RESERVADO POR', M, y + 10)
  doc
    .fillColor('#1E293B')
    .font('Helvetica')
    .fontSize(11)
    .text(`${reservation.name}\n${reservation.email}${reservation.phone ? `\nTel.: ${reservation.phone}` : ''}`, M, y + 26, {
      width: contentW,
      lineGap: 2,
    })

  // ---- Rodapé: informação da empresa ----
  const c = opts.contacts || {}
  const footY = doc.page.height - 140
  doc.rect(0, footY, W, 140).fill(GREEN)
  doc.rect(0, footY, W, 4).fill(GOLD)
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text('MHM Farms', M, footY + 16)
  doc
    .fillColor('#E2E8F0')
    .font('Helvetica')
    .fontSize(9.5)
    .text(
      [
        c.address ? `${c.address}${c.city ? `, ${c.city}` : ''}${c.province ? `, ${c.province}` : ''}` : '',
        c.country || '',
        [c.phone ? `Tel.: ${c.phone}` : '', c.whatsapp && c.whatsapp !== c.phone ? `WhatsApp: ${c.whatsapp}` : '']
          .filter(Boolean)
          .join('   ·   '),
        c.email || '',
      ]
        .filter(Boolean)
        .join('\n'),
      M,
      footY + 36,
      { width: contentW, lineGap: 3 }
    )
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Oblique')
    .fontSize(8)
    .text(
      `Documento gerado em ${new Date().toLocaleDateString('pt-PT')} · Guarde-o como comprovativo da sua reserva.`,
      M,
      doc.page.height - 28,
      { width: contentW }
    )

    doc.end()
  })
}

export async function generateReservationPdf(
  reservation: Reservation & { experience?: Experience | null }
): Promise<Buffer> {
  const settings = await loadSettings()
  const logo = await logoFile(settings.branding?.logo)
  let breakdown: PriceBreakdown | undefined
  if (Array.isArray((reservation as unknown as { breakdown?: unknown }).breakdown)) {
    breakdown = (reservation as unknown as { breakdown?: PriceBreakdown }).breakdown
  } else {
    const b = await buildBreakdown({
      adults: reservation.adults,
      children: reservation.children,
      visitType: reservation.visitType,
      experience: reservation.experience
        ? { title: reservation.experience.title, price: reservation.experience.price }
        : null,
    })
    breakdown = b.items
  }
  return buildReservationPdf(reservation, {
    logoFile: logo || undefined,
    contacts: settings.contacts,
    tagline: settings.tagline,
    breakdown,
  })
}

export async function generateAndSaveReservationPdf(
  reservation: Reservation & { experience?: Experience | null }
): Promise<string> {
  const buf = await generateReservationPdf(reservation)
  const file = reservationPdfPath(reservation.code)
  fs.writeFileSync(file, buf)
  return file
}