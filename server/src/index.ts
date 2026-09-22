import { createApp } from './app'
import { config } from './config'
import { prisma } from './lib/prisma'

const app = createApp()

async function main() {
  await prisma.$connect()
  app.listen(config.port, () => {
    console.log(`🚀 MHM Farms API a correr em http://localhost:${config.port}`)
  })
}

main().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err)
  process.exit(1)
})