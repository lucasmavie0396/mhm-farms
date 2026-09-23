import PDFDocument from 'pdfkit'
import { loadSettings, logoFile } from './pdf'
import type { RevenueReportData } from '../routes/reports'

const GREEN = '#1B4332'
const GOLD = '#D4A017'
const LIGHT = '#F3F7F2'
const INK = '#1E293B'
const MUTED = '#64748B'

const M = 48
const FOOT_H = 96

const pad = (p: number | string) => String(p).padStart(2, '0')
const money = (v: number) => `${v.toFixed(2).replace('.', ',')} MT`
const fmtYmd = (s: string) => {
  const [y, m, d] = s.split('-')
  return y && m && d ? `${d}/${m}/${y}` : s
}
const fmtDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
}
const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  MPESA: 'M-Pesa',
  EMOLA: 'e-Mola',
  CARD: 'Cartão / Multicaixa',
  OTHER: 'Outro',
}

type Section = { y: number; contentW: number; pageH: number }

export function buildReportPdf(
  report: RevenueReportData,
  opts: { logoFile?: string; contacts?: Record<string, string>; tagline?: string }
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W = doc.page.width
    const contentW = W - M * 2
    const c = opts.contacts || {}
    const tagline = opts.tagline || 'Onde a Natureza Ganha Vida'
    const s = report.summary
    const totalRevenue = s.revenue + s.ticketRevenue
    const totalVisitors = s.visitors + s.ticketVisitors
    let pageNo = 1

    // ---- Cabeçalho (página 1) ----
    doc.rect(0, 0, W, 152).fill(GREEN)
    doc.rect(0, 152, W, 5).fill(GOLD)

    let leftX = M
    if (opts.logoFile) {
      try {
        doc.save()
        doc.rect(M, 24, 78, 78).fill('#FFFFFF')
        doc.image(opts.logoFile, M + 7, 31, { fit: [64, 64], align: 'center', valign: 'center' })
        doc.restore()
        leftX = M + 102
      } catch (e) {
        console.error('Não foi possível incluir o logótipo no PDF:', e)
        doc.restore()
      }
    }

    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(30).text('Relatório de Receitas', leftX, 26, { width: W - leftX - M })
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(13).text(`MHM Farms — ${tagline}`, leftX, 66, { width: W - leftX - M })

    const periodLabel =
      !report.range.from && !report.range.to
        ? 'Todo o histórico'
        : `Período: ${report.range.from ? fmtYmd(report.range.from) : 'início'} — ${report.range.to ? fmtYmd(report.range.to) : 'hoje'}`
    const statusLabel =
      report.range.status === 'todos' ? 'Estado: Todos' : `Estado: ${STATUS_LABELS[report.range.status] || report.range.status}`
    doc
      .fillColor('#FDE9B0')
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(
        `${periodLabel}     ·     ${statusLabel}     ·     Gerado em ${fmtDate(new Date())}`,
        M,
        104,
        { width: W - M * 2 }
      )

    // ---- Estado de paginação ----
    const sect: Section = { y: 178, contentW, pageH: doc.page.height }

    function drawFooter() {
      const footY = doc.page.height - FOOT_H
      doc.rect(0, footY, W, FOOT_H).fill(GREEN)
      doc.rect(0, footY, W, 4).fill(GOLD)
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text('MHM Farms', M, footY + 14)
      doc
        .fillColor('#E2E8F0')
        .font('Helvetica')
        .fontSize(8.5)
        .text(
          [
            c.address ? `${c.address}${c.city ? `, ${c.city}` : ''}${c.province ? `, ${c.province}` : ''}` : '',
            c.country || '',
            [c.phone ? `Tel.: ${c.phone}` : '', c.whatsapp && c.whatsapp !== c.phone ? `WhatsApp: ${c.whatsapp}` : '', c.email || '']
              .filter(Boolean)
              .join('   ·   '),
          ]
            .filter(Boolean)
            .join('\n'),
          M,
          footY + 30,
          { width: contentW, lineGap: 2 }
        )
      doc.fillColor('#FFFFFF').font('Helvetica-Oblique').fontSize(8).text(
        `Documento gerado automaticamente em ${fmtDate(new Date())} · Página ${pageNo}`,
        M,
        doc.page.height - 20,
        { width: contentW }
      )
    }

    function ensure(h: number) {
      if (sect.y + h > sect.pageH - FOOT_H - 20) {
        doc.addPage()
        pageNo += 1
        sect.y = 40
        drawFooter()
      }
    }

    drawFooter()

    // ---- Resumo (KPIs) ----
    const kpiGap = 14
    const kpiCardW = (contentW - kpiGap) / 2
    const kpiCardH = 78
    const kpis: { label: string; value: string; sub: string }[] = [
      { label: 'Receita total', value: money(totalRevenue), sub: `${s.reservations} reservas · ${s.ticketCount} vendas` },
      { label: 'Entradas vendidas', value: String(s.ticketsSold), sub: `${s.ticketCount} vendas registadas` },
      { label: 'Visitantes', value: String(totalVisitors), sub: `${s.visitors} reservas · ${s.ticketVisitors} entradas` },
      { label: 'A receber', value: money(s.pendingValue), sub: `${s.pending} reservas pendentes` },
    ]
    kpis.forEach((k, i) => {
      const cx = M + (i % 2) * (kpiCardW + kpiGap)
      const cy = sect.y + Math.floor(i / 2) * (kpiCardH + kpiGap)
      doc.rect(cx, cy, 5, kpiCardH).fill(GOLD)
      doc.rect(cx + 5, cy, kpiCardW - 5, kpiCardH).fill(LIGHT)
      doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8).text(k.label.toUpperCase(), cx + 14, cy + 13, { width: kpiCardW - 28 })
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(15).text(k.value, cx + 14, cy + 31, { width: kpiCardW - 28 })
      doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(k.sub, cx + 14, cy + 56, { width: kpiCardW - 28 })
    })
    sect.y += (2 * kpiCardH) + (1 * kpiGap) + 26

    // ---- Movimentações diárias ----
    const cols: { label: string; w: number; align: 'left' | 'center' | 'right' }[] = [
      { label: 'DATA', w: 86, align: 'left' },
      { label: 'RESERVAS', w: 70, align: 'center' },
      { label: 'VISITANTES', w: 84, align: 'center' },
      { label: 'ENTRADAS', w: 78, align: 'center' },
      { label: 'VENDAS', w: 70, align: 'center' },
      { label: 'RECEITA', w: 110, align: 'right' },
    ]
    const colX = (() => {
      let x = M
      return cols.map((c) => {
        const xx = x
        x += c.w
        return xx
      })
    })()

    function tableHeader() {
      doc.rect(M, sect.y, contentW, 24).fill(GREEN)
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
      cols.forEach((c, i) => doc.text(c.label, colX[i] + 8, sect.y + 8, { width: c.w - 16, align: c.align === 'center' ? 'center' : c.align }))
      sect.y += 24
    }

    ensure(60)
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(11).text('MOVIMENTAÇÕES DIÁRIAS', M, sect.y)
    sect.y += 20
    tableHeader()

    const rows = report.byDay
    if (rows.length === 0) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('Sem movimentações no período.', M, sect.y + 8)
      sect.y += 36
    } else {
      rows.forEach((d, idx) => {
        ensure(26)
        const rh = 24
        const total = d.revenue || 0
        doc.rect(M, sect.y, contentW, rh).fill(idx % 2 === 0 ? LIGHT : '#FFFFFF')
        doc.font('Helvetica').fontSize(9)
        doc.fillColor(INK).text(fmtYmd(d.name), colX[0] + 8, sect.y + 8, { width: cols[0].w - 16 })
        doc.fillColor(INK).text(String(d.count || 0), colX[1], sect.y + 8, { width: cols[1].w, align: 'center' })
        doc.fillColor(INK).text(String(d.totalVisitors ?? (d.visitors ?? 0)), colX[2], sect.y + 8, { width: cols[2].w, align: 'center' })
        doc.fillColor(INK).text(String(d.sold ?? 0), colX[3], sect.y + 8, { width: cols[3].w, align: 'center' })
        doc.fillColor(INK).text(String(d.tickets ?? 0), colX[4], sect.y + 8, { width: cols[4].w, align: 'center' })
        doc.font('Helvetica-Bold').text(money(total), colX[5] + 8, sect.y + 8, { width: cols[5].w - 16, align: 'right' })
        sect.y += rh
      })
    }

    ensure(30)
    doc.rect(M, sect.y, contentW, 30).fill(GREEN)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('TOTAIS', M + 12, sect.y + 10, { width: cols[0].w - 20 })
    const sumDay = rows.reduce(
      (acc, d) => {
        acc.reservas += d.count || 0
        acc.vis += d.totalVisitors ?? (d.visitors ?? 0)
        acc.sold += d.sold ?? 0
        acc.vendas += d.tickets ?? 0
        acc.rev += d.revenue || 0
        return acc
      },
      { reservas: 0, vis: 0, sold: 0, vendas: 0, rev: 0 }
    )
    doc.font('Helvetica-Bold').fontSize(10)
    doc.text(String(sumDay.reservas), colX[1], sect.y + 9, { width: cols[1].w, align: 'center' })
    doc.text(String(sumDay.vis), colX[2], sect.y + 9, { width: cols[2].w, align: 'center' })
    doc.text(String(sumDay.sold), colX[3], sect.y + 9, { width: cols[3].w, align: 'center' })
    doc.text(String(sumDay.vendas), colX[4], sect.y + 9, { width: cols[4].w, align: 'center' })
    doc.text(money(sumDay.rev), colX[5] + 8, sect.y + 9, { width: cols[5].w - 16, align: 'right' })
    sect.y += 30 + 24

    // ---- Formas de pagamento ----
    const methods = report.ticketByMethod
    ensure(90)
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(11).text('RECEITA E ENTRADAS POR FORMA DE PAGAMENTO', M, sect.y)
    sect.y += 20
    const mcols: { label: string; w: number; align: 'left' | 'right' | 'center' }[] = [
      { label: 'FORMA DE PAGAMENTO', w: 170, align: 'left' },
      { label: 'VENDAS', w: 85, align: 'center' },
      { label: 'ENTRADAS', w: 85, align: 'center' },
      { label: 'VALOR TOTAL', w: 105, align: 'right' },
      { label: '%', w: 54, align: 'right' },
    ]
    let mx = M
    const mcolX = mcols.map((c) => {
      const xx = mx
      mx += c.w
      return xx
    })
    doc.rect(M, sect.y, contentW, 24).fill(GREEN)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
    mcols.forEach((c, i) => doc.text(c.label, mcolX[i] + 8, sect.y + 8, { width: c.w - 16, align: c.align }))
    sect.y += 24
    if (methods.length === 0) {
      doc.rect(M, sect.y, contentW, 28).fill(LIGHT)
      doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text('Sem vendas de entradas no período.', M + 12, sect.y + 9)
      sect.y += 28 + 24
    } else {
      const methodTotal = methods.reduce((a, m) => a + m.revenue, 0)
      const methodQty = methods.reduce((a, m) => a + (m.qty || 0), 0)
      methods.forEach((m, idx) => {
        ensure(24)
        doc.rect(M, sect.y, contentW, 24).fill(idx % 2 === 0 ? LIGHT : '#FFFFFF')
        doc.font('Helvetica')
        doc.fillColor(INK).fontSize(9).text(PAYMENT_LABELS[m.name] || m.name, mcolX[0] + 8, sect.y + 8, { width: mcols[0].w - 16, ellipsis: true })
        doc.text(String(m.count), mcolX[1], sect.y + 8, { width: mcols[1].w, align: 'center' })
        doc.text(String(m.qty || 0), mcolX[2], sect.y + 8, { width: mcols[2].w, align: 'center' })
        doc.font('Helvetica-Bold').text(money(m.revenue), mcolX[3] + 8, sect.y + 8, { width: mcols[3].w - 16, align: 'right' })
        doc.text(`${methodTotal > 0 ? Math.round((m.revenue / methodTotal) * 100) : 0}%`, mcolX[4] + 8, sect.y + 8, { width: mcols[4].w - 16, align: 'right' })
        sect.y += 24
      })
      ensure(30)
      doc.rect(M, sect.y, contentW, 30).fill(GREEN)
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('TOTAIS', M + 12, sect.y + 10, { width: mcols[0].w - 20 })
      doc.text(String(methods.reduce((a, m) => a + m.count, 0)), mcolX[1], sect.y + 9, { width: mcols[1].w, align: 'center' })
      doc.text(String(methodQty), mcolX[2], sect.y + 9, { width: mcols[2].w, align: 'center' })
      doc.text(money(methodTotal), mcolX[3] + 8, sect.y + 9, { width: mcols[3].w - 16, align: 'right' })
      sect.y += 30 + 24
    }

    // ---- Reservas (movimentações) ----
    ensure(70)
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(11).text(`RESERVAS NO PERÍODO (${report.reservations.length})`, M, sect.y)
    sect.y += 20
    const rcols: { label: string; w: number; align: 'left' | 'right' | 'center' }[] = [
      { label: 'CÓDIGO', w: 80, align: 'left' },
      { label: 'DATA', w: 58, align: 'left' },
      { label: 'NOME', w: 122, align: 'left' },
      { label: 'VISIT.', w: 74, align: 'center' },
      { label: 'VALOR', w: 100, align: 'right' },
      { label: 'ESTADO', w: 65, align: 'left' },
    ]
    let rx = M
    const rcolX = rcols.map((c) => {
      const xx = rx
      rx += c.w
      return xx
    })
    const reservas = report.reservations
    if (reservas.length === 0) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('Sem reservas no período.', M, sect.y + 8)
      sect.y += 36
    } else {
      doc.rect(M, sect.y, contentW, 24).fill(GREEN)
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(6.5)
      rcols.forEach((c, i) => doc.text(c.label, rcolX[i] + 8, sect.y + 8.5, { width: c.w - 16, align: c.align }))
      sect.y += 24
      reservas.forEach((r, idx) => {
        ensure(24)
        const rh = 24
        doc.rect(M, sect.y, contentW, rh).fill(idx % 2 === 0 ? LIGHT : '#FFFFFF')
        doc.font('Helvetica').fontSize(9)
        doc.fontSize(7).fillColor(INK).text(r.code, rcolX[0] + 6, sect.y + 8, { width: rcols[0].w - 12, ellipsis: true })
        doc.text(fmtDate(new Date(r.date)), rcolX[1] + 6, sect.y + 8, { width: rcols[1].w - 12, ellipsis: true })
        doc.fontSize(9).fillColor(INK).text(r.name, rcolX[2] + 8, sect.y + 8, { width: rcols[2].w - 16, ellipsis: true })
        doc.fillColor(INK).text(String(r.visitors), rcolX[3], sect.y + 8, { width: rcols[3].w, align: 'center' })
        doc.font('Helvetica-Bold').text(money(r.totalPrice), rcolX[4] + 8, sect.y + 8, { width: rcols[4].w - 16, align: 'right' })
        doc.font('Helvetica').fontSize(8).fillColor(r.status === 'CANCELLED' ? '#B91C1C' : INK).text(STATUS_LABELS[r.status] || r.status, rcolX[5] + 8, sect.y + 8, { width: rcols[5].w - 16, ellipsis: true })
        sect.y += rh
      })
    }

    doc.end()
  })
}

export async function generateReportPdf(report: RevenueReportData): Promise<Buffer> {
  const settings = await loadSettings()
  const logo = await logoFile(settings.branding?.logo)
  return buildReportPdf(report, {
    logoFile: logo || undefined,
    contacts: settings.contacts,
    tagline: settings.tagline,
  })
}