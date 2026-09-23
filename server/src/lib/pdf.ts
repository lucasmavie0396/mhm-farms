import PDFDocument from 'pdfkit'
import type { Reservation, Experience, ReservationPayment } from '@prisma/client'
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

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Dinheiro',
  MPESA: 'M-Pesa',
  EMOLA: 'e-Mola',
  CARD: 'Cartão / Multicaixa',
  OTHER: 'Outro',
}

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
  opts: {
    logoFile?: string
    contacts?: Record<string, string>
    tagline?: string
    breakdown?: PriceBreakdown
    payments?: ReservationPayment[]
  }
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
  let y = 186
  const pageBreak = () => {
    if (y > doc.page.height - 165) {
      doc.addPage()
      y = 60
    }
  }

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

  // ---- Pagamento: sinal (60%) e restante (40%) ----
  const payments = opts.payments || []
  if (payments.length > 0) {
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
    const remaining = Math.round((reservation.totalPrice - totalPaid) * 100) / 100
    const firstDate = payments[0].paidAt
    const lastDate = payments[payments.length - 1].paidAt
    const sinal = payments.find((p) => p.stage === 'SINAL') || payments[0]
    const finalPay = payments.find((p) => p.stage !== 'SINAL')

    pageBreak()
    y += 14
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text('PAGAMENTO', M, y + 2)
    y += 20

    const halfW = (contentW - 16) / 2
    const blockH = 72
    const drawPayBox = (x: number, title: string, subtitle: string, amount: number, accent: boolean) => {
      doc.rect(x, y, halfW, blockH).fill(accent ? '#FFF7E6' : LIGHT)
      doc.rect(x, y, 4, blockH).fill(accent ? GOLD : GREEN)
      doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8.5).text(title, x + 14, y + 10, { width: halfW - 28 })
      doc.fillColor('#475569').font('Helvetica').fontSize(9).text(subtitle, x + 14, y + 26, { width: halfW - 28 })
      doc.fillColor(accent ? GOLD : GREEN).font('Helvetica-Bold').fontSize(14).text(money(amount), x + 14, y + 46, { width: halfW - 28 })
    }
    drawPayBox(M, 'SINAL (60%) — PAGO NA RESERVA', `Pago em ${fmtDate(sinal.paidAt)}\nForma: ${PAYMENT_LABEL[sinal.method] || sinal.method}`, sinal.amount, true)
    drawPayBox(
      M + halfW + 16,
      'RESTANTE (40%) — PAGO NA ENTRADA',
      finalPay
        ? `Pago em ${fmtDate(finalPay.paidAt)}\nForma: ${PAYMENT_LABEL[finalPay.method] || finalPay.method}`
        : 'Por pagar no dia da visita',
      finalPay ? finalPay.amount : remaining,
      false
    )
    y += blockH + 12

    const dateRowH = 34
    doc.rect(M, y, halfW, dateRowH).fill('#F1F5F9')
    doc.rect(M + halfW + 16, y, halfW, dateRowH).fill('#F1F5F9')
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8).text('DATA DO PRIMEIRO PAGAMENTO', M, y + 6, { width: halfW - 20 })
    doc.fillColor('#1E293B').font('Helvetica').fontSize(11).text(fmtDate(firstDate), M, y + 19, { width: halfW - 20 })
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8).text('DATA DO ÚLTIMO PAGAMENTO', M + halfW + 16, y + 6, { width: halfW - 20 })
    doc.fillColor('#1E293B').font('Helvetica').fontSize(11).text(fmtDate(lastDate), M + halfW + 16, y + 19, { width: halfW - 20 })
    y += dateRowH + 10

    doc.fillColor('#475569').font('Helvetica').fontSize(9).text(
      `Total pago: ${money(totalPaid)}${remaining > 0.001 ? `  ·  Por liquidar: ${money(remaining)}` : '  ·  Reserva totalmente liquidada'}`,
      M,
      y + 4,
      { width: contentW }
    )
    y += 22
  }

  // Observações
  if (reservation.notes) {
    pageBreak()
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
  const payments = await prisma.reservationPayment.findMany({
    where: { reservationId: reservation.id },
    orderBy: { paidAt: 'asc' },
  })
  return buildReservationPdf(reservation, {
    logoFile: logo || undefined,
    contacts: settings.contacts,
    tagline: settings.tagline,
    breakdown,
    payments,
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