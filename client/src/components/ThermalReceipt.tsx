import type { PublicSettings, Reservation, TicketSale } from '../lib/types'
import { PAYMENT_METHODS } from '../lib/types'

const pad = (n: number) => String(n).padStart(2, '0')

function fmtDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function money(v: number) {
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 0 }) + ' MT'
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildReceiptHtml(sale: TicketSale, settings: PublicSettings): string {
  const contacts = (settings.contacts || {}) as {
    address?: string
    city?: string
    province?: string
    country?: string
    phone?: string
    whatsapp?: string
    email?: string
  }
  const c = (v: string | undefined) => esc(v || '')
  const tagline = settings.home?.heroSubtitle || 'Onde a Natureza Ganha Vida'
  const method = PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod

  const lines: string[] = []

  if (settings.branding?.logo) {
    const logo = settings.branding.logo.startsWith('/')
      ? window.location.origin + settings.branding.logo
      : settings.branding.logo
    lines.push(
      `<div style="text-align:center"><img src="${esc(logo)}" alt="" style="max-height:36px;max-width:150px;object-fit:contain"/></div>`
    )
  }
  lines.push(`<div class="c b">MHM FARMS</div>`)
  lines.push(`<div class="c t">${esc(tagline)}</div>`)
  const addr = [contacts.address, [contacts.city, contacts.province].filter(Boolean).join(', '), contacts.country]
    .filter(Boolean)
    .join(' — ')
  if (addr) lines.push(`<div class="c t">${c(addr)}</div>`)
  if (contacts.phone) lines.push(`<div class="c t">Tel.: ${c(contacts.phone)}${contacts.email ? '  ·  ' + c(contacts.email) : ''}</div>`)

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="c b lg">RECIBO DE ENTRADA</div>`)
  lines.push(`<div class="c t">Documento simples (sem valor fiscal)</div>`)
  lines.push(`<div class="dash"></div>`)

  lines.push(`<div class="row"><span>Código</span><span class="b">${esc(sale.code)}</span></div>`)
  lines.push(`<div class="row"><span>Data</span><span>${fmtDate(new Date(sale.date))}</span></div>`)
  if (sale.seller?.name) lines.push(`<div class="row"><span>Vendedor</span><span>${esc(sale.seller.name)}</span></div>`)
  if (sale.customerName) lines.push(`<div class="row"><span>Cliente</span><span>${esc(sale.customerName)}</span></div>`)

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="row th"><span>Artigo</span><span>x</span><span>Preço</span><span>Total</span></div>`)

  for (const item of sale.items) {
    lines.push(`<div class="row item-name">${esc(item.service)}</div>`)
    lines.push(
      `<div class="row sm"><span>${item.qty} × ${money(item.unit)}</span><span></span><span></span><span class="b">${money(item.total)}</span></div>`
    )
  }

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="row b lg"><span>TOTAL (${sale.totalVisitors} visitante${sale.totalVisitors === 1 ? '' : 's'})</span><span class="total">${money(sale.totalPrice)}</span></div>`)
  lines.push(`<div class="row"><span>Pagamento</span><span>${method}</span></div>`)

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="c t">Obrigado pela sua visita!</div>`)
  if (contacts.whatsapp) lines.push(`<div class="c t">WhatsApp: ${c(contacts.whatsapp)}</div>`)
  lines.push(`<div class="c t">${c(contacts.email)}</div>`)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Recibo ${esc(sale.code)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.45; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .lg { font-size: 13px; }
  .t { font-size: 10px; color: #222; }
  .dash { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; font-size: 11px; }
  .row .total { font-weight: 700; font-size: 13px; }
  .item-name { font-size: 10px; }
  .sm { font-size: 10px; color: #222; }
  .th { font-weight: 700; }
</style></head><body>
${lines.join('\n')}
</body></html>`
}

export function printSaleReceipt(sale: TicketSale, settings: PublicSettings) {
  const w = window.open('', '_blank', 'width=420,height=640')
  if (!w) return
  w.document.write(buildReceiptHtml(sale, settings))
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
  }, 300)
}

function fmtAndTime(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function buildReservationReceiptHtml(
  reservation: Reservation,
  sale: TicketSale,
  settings: PublicSettings
): string {
  const contacts = (settings.contacts || {}) as {
    address?: string
    city?: string
    province?: string
    country?: string
    phone?: string
    whatsapp?: string
    email?: string
  }
  const c = (v: string | undefined) => esc(v || '')
  const tagline = settings.home?.heroSubtitle || 'Onde a Natureza Ganha Vida'

  const payments = (reservation.payments || []).slice().sort(
    (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
  )
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.round((reservation.totalPrice - totalPaid) * 100) / 100
  const firstDate = payments[0]?.paidAt
  const lastDate = payments[payments.length - 1]?.paidAt
  const lastPayment = payments[payments.length - 1]

  const stageLabel = (stage: string) => (stage === 'SINAL' ? 'Sinal (60%)' : stage === 'FINAL' ? 'Restante (40%)' : stage)

  const lines: string[] = []

  if (settings.branding?.logo) {
    const logo = settings.branding.logo.startsWith('/')
      ? window.location.origin + settings.branding.logo
      : settings.branding.logo
    lines.push(
      `<div style="text-align:center"><img src="${esc(logo)}" alt="" style="max-height:36px;max-width:150px;object-fit:contain"/></div>`
    )
  }
  lines.push(`<div class="c b">MHM FARMS</div>`)
  lines.push(`<div class="c t">${esc(tagline)}</div>`)
  const addr = [contacts.address, [contacts.city, contacts.province].filter(Boolean).join(', '), contacts.country]
    .filter(Boolean)
    .join(' — ')
  if (addr) lines.push(`<div class="c t">${c(addr)}</div>`)
  if (contacts.phone) lines.push(`<div class="c t">Tel.: ${c(contacts.phone)}${contacts.email ? '  ·  ' + c(contacts.email) : ''}</div>`)

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="c b lg">RECIBO DE RESERVA</div>`)
  lines.push(`<div class="c t">Documento simples (sem valor fiscal)</div>`)
  lines.push(`<div class="dash"></div>`)

  lines.push(`<div class="row"><span>Código da reserva</span><span class="b">${esc(reservation.code)}</span></div>`)
  lines.push(`<div class="row"><span>Recibo</span><span class="b">${esc(sale.code)}</span></div>`)
  lines.push(`<div class="row"><span>Data da visita</span><span>${fmtDate(new Date(reservation.date))}</span></div>`)
  lines.push(`<div class="row"><span>Hora</span><span>${esc(reservation.time || '—')}</span></div>`)
  lines.push(`<div class="row"><span>Cliente</span><span>${esc(reservation.name)}</span></div>`)
  lines.push(`<div class="row"><span>Telefone</span><span>${esc(reservation.phone || '—')}</span></div>`)
  if (reservation.email) lines.push(`<div class="row"><span>Email</span><span style="font-size:9px">${esc(reservation.email)}</span></div>`)
  lines.push(`<div class="row"><span>Tipo de visita</span><span>${esc(reservation.visitType)}</span></div>`)
  if (reservation.experience) lines.push(`<div class="row"><span>Experiência</span><span>${esc(reservation.experience.title)}</span></div>`)
  lines.push(`<div class="row"><span>Adultos</span><span>${reservation.adults}</span></div>`)
  lines.push(`<div class="row"><span>Crianças</span><span>${reservation.children}</span></div>`)
  lines.push(`<div class="row"><span>Total de visitantes</span><span>${reservation.totalVisitors}</span></div>`)

  if (reservation.breakdown && reservation.breakdown.length > 0) {
    lines.push(`<div class="dash"></div>`)
    for (const item of reservation.breakdown) {
      lines.push(`<div class="row item-name">${esc(item.service)}</div>`)
      lines.push(
        `<div class="row sm"><span>${item.qty} × ${money(item.unit)}</span><span></span><span></span><span class="b">${money(item.total)}</span></div>`
      )
    }
  }

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="row b lg"><span>TOTAL DA RESERVA</span><span class="total">${money(reservation.totalPrice)}</span></div>`)

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="c b">PAGAMENTOS</div>`)
  if (payments.length > 0) {
    lines.push(`<div class="row th"><span>Data</span><span>Desc./Forma</span><span>Valor</span></div>`)
    for (const p of payments) {
      lines.push(`<div class="row"><span>${fmtAndTime(new Date(p.paidAt))}</span></div>`)
      lines.push(`<div class="row sm"><span>${stageLabel(p.stage)} · ${PAYMENT_METHODS[p.method] || p.method}</span><span></span><span class="b">${money(p.amount)}</span></div>`)
    }
  } else {
    lines.push(`<div class="c t">Sem pagamentos registados</div>`)
  }
  lines.push(`<div class="row mt"><span>Total já pago</span><span class="b">${money(totalPaid)}</span></div>`)
  lines.push(`<div class="row"><span>Pago neste recibo</span><span class="b">${money(lastPayment?.amount || 0)}</span></div>`)
  lines.push(`<div class="row"><span>Em falta</span><span class="b">${money(remaining)}</span></div>`)
  if (lastDate) {
    lines.push(`<div class="row mt"><span>Data do 1º pagamento</span><span>${fmtDate(new Date(firstDate))}</span></div>`)
    lines.push(`<div class="row"><span>Data do último pagamento</span><span>${fmtDate(new Date(lastDate))}</span></div>`)
  }

  lines.push(`<div class="dash"></div>`)
  lines.push(`<div class="c t">Obrigado pela sua visita!</div>`)
  if (contacts.whatsapp) lines.push(`<div class="c t">WhatsApp: ${c(contacts.whatsapp)}</div>`)
  lines.push(`<div class="c t">${c(contacts.email)}</div>`)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Reserva ${esc(reservation.code)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.45; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .lg { font-size: 13px; }
  .t { font-size: 10px; color: #222; }
  .dash { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; font-size: 11px; }
  .row .total { font-weight: 700; font-size: 13px; }
  .item-name { font-size: 10px; }
  .sm { font-size: 10px; color: #222; }
  .mt { margin-top: 4px; }
  .th { font-weight: 700; }
</style></head><body>
${lines.join('\n')}
</body></html>`
}

export function printReservationReceipt(reservation: Reservation, sale: TicketSale, settings: PublicSettings) {
  const w = window.open('', '_blank', 'width=420,height=640')
  if (!w) return
  w.document.write(buildReservationReceiptHtml(reservation, sale, settings))
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
  }, 300)
}