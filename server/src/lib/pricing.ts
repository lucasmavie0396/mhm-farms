import { prisma } from './prisma'

export interface PriceItem {
  service: string
  qty: number
  unit: number
  total: number
}

export type PriceBreakdown = PriceItem[]

export async function buildBreakdown(opts: {
  adults: number
  children: number
  visitType: string
  experience?: { title: string; price: number } | null
}): Promise<{ items: PriceBreakdown; total: number }> {
  const pricesSetting = await prisma.setting.findUnique({ where: { key: 'prices' } })
  let prices: { category: string; price: number }[] = []
  try {
    prices = pricesSetting ? JSON.parse(pricesSetting.value) : []
  } catch {
    prices = []
  }
  const items: PriceBreakdown = []
  const isFamily =
    opts.visitType.toLowerCase().includes('familiar') || opts.visitType.toLowerCase().includes('família')

  if (isFamily) {
    const famCategory = prices.find((p) => p.category.toLowerCase().includes('famili'))
    if (famCategory) {
      items.push({
        service: famCategory.category,
        qty: 1,
        unit: famCategory.price,
        total: famCategory.price,
      })
    } else {
      items.push(
        ...buildTicketItems(opts.adults, opts.children, prices)
      )
    }
  } else {
    items.push(...buildTicketItems(opts.adults, opts.children, prices))
  }

  if (opts.experience && opts.experience.price > 0) {
    items.push({
      service: opts.experience.title,
      qty: 1,
      unit: opts.experience.price,
      total: opts.experience.price,
    })
  }

  const total = items.reduce((s, i) => s + i.total, 0)
  return { items, total }
}

function buildTicketItems(
  adults: number,
  children: number,
  prices: { category: string; price: number }[]
): PriceBreakdown {
  const items: PriceBreakdown = []
  const adultCategory = prices.find((p) => p.category.toLowerCase().includes('adult'))
  if (adults > 0 && adultCategory) {
    items.push({
      service: `Entrada de adulto${adults > 1 ? 's' : ''}`,
      qty: adults,
      unit: adultCategory.price,
      total: adultCategory.price * adults,
    })
  }
  const childCategory = prices.find((p) => p.category.toLowerCase().includes('crian'))
  if (children > 0 && childCategory) {
    items.push({
      service: `Entrada de criança${children > 1 ? 's' : ''}`,
      qty: children,
      unit: childCategory.price,
      total: childCategory.price * children,
    })
  }
  return items
}