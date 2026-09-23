import type { PublicSettings, Reservation, TicketSale } from '../lib/types'
import { PAYMENT_METHODS } from '../lib/types'

const pad = (n: number) => String(n).padStart(2, '0')

function fmtDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtDay(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
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

type ContactMap = {
  address?: string
  city?: string
  province?: string
  country?: string
  phone?: string
  whatsapp?: string
  email?: string
}

function headerHtml(settings: PublicSettings, contacts: ContactMap, tagline: string): string[] {
  const c = (v: string | undefined) => esc(v || '')
  const out: string[] = []
  if (settings.branding?.logo) {
    const logo = settings.branding.logo.startsWith('/')
      ? window.location.origin + settings.branding.logo
      : settings.branding.logo
    out.push(`<div style="text-align:center;margin-bottom:4px"><img src="${esc(logo)}" alt="" style="max-height:40px;max-width:180px;object-fit:contain"/></div>`)
  }
  out.push(`<div class="brand">MHM FARMS</div>`)
  out.push(`<div class="tag">${esc(tagline)}</div>`)
  const addr = [contacts.address, [contacts.city, contacts.province].filter(Boolean).join(', '), contacts.country]
    .filter(Boolean)
    .join(' — ')
  if (addr) out.push(`<div class="contact">${c(addr)}</div>`)
  if (contacts.phone) out.push(`<div class="contact">Tel.: ${c(contacts.phone)}${contacts.email ? '  ·  ' + c(contacts.email) : ''}</div>`)
  if (contacts.whatsapp) out.push(`<div class="contact">WhatsApp: ${c(contacts.whatsapp)}</div>`)
  return out
}

function footerHtml(contacts: ContactMap): string[] {
  const c = (v: string | undefined) => esc(v || '')
  const out = [`<div class="thank">Obrigado pela sua visita!</div>`]
  if (contacts.whatsapp) out.push(`<div class="contact">WhatsApp: ${c(contacts.whatsapp)}</div>`)
  if (contacts.email) out.push(`<div class="contact">${c(contacts.email)}</div>`)
  return out
}

const RECEIPT_CSS = `
@page { size: 80mm auto; margin: 4mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 72mm; margin: 0 auto; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #111; line-height: 1.45; }
.c { text-align: center; }
.r { text-align: right; }
.muted { color: #555; }
.b { font-weight: 700; }
.mono { font-variant-numeric: tabular-nums; }
.brand { font-size: 16px; font-weight: 800; letter-spacing: 3px; text-align: center; }
.tag { font-size: 10px; text-align: center; color: #444; }
.contact { font-size: 9px; text-align: center; color: #555; }
.rule { border-top: 2px solid #111; margin: 7px 0; }
.rule-thin { border-top: 1px solid #ccc; margin: 5px 0; }
.band { background: #111; color: #fff; text-align: center; font-weight: 800; font-size: 12px; letter-spacing: 1.5px; padding: 5px 0; border-radius: 2px; }
.band-sub { font-size: 9px; color: #666; text-align: center; padding-top: 3px; }
.sec { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; border-bottom: 1px solid #111; padding-bottom: 3px; margin-top: 10px; margin-bottom: 4px; }
.kv { display: flex; justify-content: space-between; gap: 8px; padding: 1.5px 0; }
.kv .k { color: #555; }
.kv .v { font-weight: 700; text-align: right; flex-shrink: 0; max-width: 62%; }
.grid3 { display: grid; grid-template-columns: 1fr 22% 30%; gap: 6px; }
.grid3 > :last-child { text-align: right; }
.th { font-weight: 800; font-size: 9px; letter-spacing: .6px; text-transform: uppercase; color: #444; padding-bottom: 2px; border-bottom: 1px dashed #bbb; }
.item { padding: 3px 0; border-bottom: 1px dotted #ddd; }
.item-name { font-weight: 700; font-size: 10.5px; }
.item-detail { font-size: 10px; color: #444; }
.item-detail .b { color: #111; }
.tot { display: flex; justify-content: space-between; align-items: center; background: #111; color: #fff; font-weight: 800; font-size: 13px; padding: 7px 9px; margin-top: 6px; border-radius: 2px; }
.pay-grid { display: grid; grid-template-columns: 30% 1fr 30%; gap: 6px; }
.pay-row { display: grid; grid-template-columns: 30% 1fr 30%; gap: 6px; padding: 2.5px 0; border-bottom: 1px dotted #ddd; font-size: 10px; }
.pay-row > :last-child { text-align: right; font-weight: 700; }
.highlight { background: #f1f1f1; padding: 3px 6px; margin-top: 4px; border-radius: 2px; }
.thank { text-align: center; font-size: 11px; font-weight: 700; }
`

function wrapHtml(title: string, lines: string[]): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(title)}</title>
<style>${RECEIPT_CSS}</style></head><body>
${lines.join('\n')}
</body></html>`
}

export function buildReceiptHtml(sale: TicketSale, settings: PublicSettings): string {
  const contacts = (settings.contacts || {}) as ContactMap
  const tagline = settings.home?.heroSubtitle || 'Onde a Natureza Ganha Vida'
  const method = PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod

  const out = headerHtml(settings, contacts, tagline)
  out.push(`<div class="rule"></div>`)
  out.push(`<div class="band">RECIBO DE ENTRADA</div>`)
  out.push(`<div class="band-sub">Documento simples · sem valor fiscal</div>`)

  out.push(`<div class="sec">Detalhes</div>`)
  out.push(`<div class="kv"><span class="k">Nº do recibo</span><span class="v mono">${esc(sale.code)}</span></div>`)
  out.push(`<div class="kv"><span class="k">Data e hora</span><span class="v">${fmtDate(new Date(sale.date))}</span></div>`)
  if (sale.seller?.name) out.push(`<div class="kv"><span class="k">Vendedor</span><span class="v">${esc(sale.seller.name)}</span></div>`)
  if (sale.customerName) out.push(`<div class="kv"><span class="k">Cliente</span><span class="v">${esc(sale.customerName)}</span></div>`)

  out.push(`<div class="sec">Itens</div>`)
  out.push(`<div class="th grid3"><span>Descrição</span><span class="c">Qtd</span><span>Total</span></div>`)
  for (const item of sale.items) {
    out.push(
      `<div class="item"><div class="item-name">${esc(item.service)}</div>` +
        `<div class="item-detail grid3"><span>${item.qty} × ${money(item.unit)}</span><span></span><span class="b mono">${money(item.total)}</span></div></div>`
    )
  }

  out.push(
    `<div class="tot"><span>TOTAL · ${sale.totalVisitors} visitante${sale.totalVisitors === 1 ? '' : 's'}</span><span class="mono">${money(sale.totalPrice)}</span></div>`
  )
  out.push(`<div class="kv" style="margin-top:6px"><span class="k">Forma de pagamento</span><span class="v">${method}</span></div>`)

  out.push(`<div class="rule"></div>`)
  out.push(...footerHtml(contacts))

  return wrapHtml(`Recibo ${sale.code}`, out)
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

export function buildReservationReceiptHtml(
  reservation: Reservation,
  sale: TicketSale,
  settings: PublicSettings
): string {
  const contacts = (settings.contacts || {}) as ContactMap
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

  const out = headerHtml(settings, contacts, tagline)
  out.push(`<div class="rule"></div>`)
  out.push(`<div class="band">RECIBO DE RESERVA</div>`)
  out.push(`<div class="band-sub">Documento simples · sem valor fiscal</div>`)

  out.push(`<div class="sec">Dados da reserva</div>`)
  out.push(`<div class="kv"><span class="k">Código da reserva</span><span class="v mono">${esc(reservation.code)}</span></div>`)
  out.push(`<div class="kv"><span class="k">Recibo</span><span class="v mono">${esc(sale.code)}</span></div>`)
  out.push(`<div class="kv"><span class="k">Data da visita</span><span class="v">${fmtDay(new Date(reservation.date))}</span></div>`)
  out.push(`<div class="kv"><span class="k">Hora</span><span class="v">${esc(reservation.time || '—')}</span></div>`)
  out.push(`<div class="kv"><span class="k">Cliente</span><span class="v">${esc(reservation.name)}</span></div>`)
  out.push(`<div class="kv"><span class="k">Telefone</span><span class="v">${esc(reservation.phone || '—')}</span></div>`)
  if (reservation.email) out.push(`<div class="kv"><span class="k">Email</span><span class="v" style="font-size:9px">${esc(reservation.email)}</span></div>`)
  out.push(`<div class="kv"><span class="k">Tipo de visita</span><span class="v">${esc(reservation.visitType)}</span></div>`)
  if (reservation.experience) out.push(`<div class="kv"><span class="k">Experiência</span><span class="v">${esc(reservation.experience.title)}</span></div>`)
  out.push(
    `<div class="kv"><span class="k">Visitantes</span><span class="v">${reservation.totalVisitors} (${reservation.adults} adulto${reservation.adults === 1 ? '' : 's'} · ${reservation.children} criança${reservation.children === 1 ? '' : 's'})</span></div>`
  )

  if (reservation.breakdown && reservation.breakdown.length > 0) {
    out.push(`<div class="sec">Serviços</div>`)
    out.push(`<div class="th grid3"><span>Descrição</span><span class="c">Qtd</span><span>Total</span></div>`)
    for (const item of reservation.breakdown) {
      out.push(
        `<div class="item"><div class="item-name">${esc(item.service)}</div>` +
          `<div class="item-detail grid3"><span>${item.qty} × ${money(item.unit)}</span><span></span><span class="b mono">${money(item.total)}</span></div></div>`
      )
    }
  }

  out.push(
    `<div class="tot"><span>TOTAL DA RESERVA</span><span class="mono">${money(reservation.totalPrice)}</span></div>`
  )

  out.push(`<div class="sec">Pagamentos</div>`)
  if (payments.length > 0) {
    out.push(`<div class="th pay-grid"><span>Data</span><span>Descrição</span><span class="r">Valor</span></div>`)
    for (const p of payments) {
      out.push(
        `<div class="pay-row"><span>${fmtDay(new Date(p.paidAt))} ${pad(new Date(p.paidAt).getHours())}:${pad(new Date(p.paidAt).getMinutes())}</span>` +
          `<span class="muted">${stageLabel(p.stage)} · ${PAYMENT_METHODS[p.method] || p.method}</span><span class="mono">${money(p.amount)}</span></div>`
      )
    }
    out.push(`<div class="rule-thin"></div>`)
    out.push(`<div class="kv"><span class="k">Total já pago</span><span class="v mono">${money(totalPaid)}</span></div>`)
    out.push(
      `<div class="kv highlight"><span class="k">Pago neste recibo</span><span class="v mono">${money(lastPayment?.amount || 0)}</span></div>`
    )
    out.push(`<div class="kv"><span class="k">Em falta</span><span class="v mono">${money(remaining)}</span></div>`)
    if (lastDate) {
      out.push(`<div class="rule-thin"></div>`)
      out.push(`<div class="kv"><span class="k">Data do 1º pagamento</span><span class="v">${fmtDay(new Date(firstDate))}</span></div>`)
      out.push(`<div class="kv"><span class="k">Data do último pagamento</span><span class="v">${fmtDay(new Date(lastDate))}</span></div>`)
    }
  } else {
    out.push(`<div class="muted">Sem pagamentos registados</div>`)
  }

  out.push(`<div class="rule"></div>`)
  out.push(...footerHtml(contacts))

  return wrapHtml(`Reserva ${reservation.code}`, out)
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