import chokidar from 'chokidar'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { syncContent, loadContent } from './sync-json'

const prisma = new PrismaClient()

const FILE = resolve(process.cwd(), 'data/content.json')
const DEBOUNCE_MS = 400

let timer: NodeJS.Timeout | null = null

async function runSync(reason: string) {
  try {
    const content = loadContent()
    const t0 = Date.now()
    await syncContent(content)
    console.log(
      `🔄 [${new Date().toISOString()}] ${reason} → MySQL sincronizado (${Date.now() - t0}ms)`
    )
  } catch (e) {
    console.error(`❌ [${new Date().toISOString()}] Falha na sincronização (${reason})`)
    console.error(e)
  }
}

function schedule() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void runSync('alteração no content.json'), DEBOUNCE_MS)
}

async function main() {
  console.log(`👀 A vigiar ${FILE}`)
  console.log('   Guarde alterações ao ficheiro e o MySQL será atualizado em tempo real.')
  await runSync('arranque')

  const watcher = chokidar.watch(FILE, { ignoreInitial: true })
  watcher.on('change', schedule).on('add', schedule)

  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

main().catch((e) => {
  console.error('❌ Watcher parado com erro:', e)
  process.exitCode = 1
})