import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const envPath = path.join(projectRoot, 'server', '.env')

function loadEnv(file) {
  const env = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[m[1]] = val
  }
  return env
}

function parseDbUrl(urlStr) {
  const url = new URL(urlStr)
  return {
    db: decodeURIComponent(url.pathname.replace(/^\//, '')),
    user: decodeURIComponent(url.username || 'root'),
    pass: decodeURIComponent(url.password || ''),
    host: url.hostname || 'localhost',
    port: url.port || '3306',
  }
}

function findBinary(name) {
  const candidates = [
    process.env.MYSQLDUMP_PATH,
    process.env.MYSQL_BIN_DIR && path.join(process.env.MYSQL_BIN_DIR, name),
    'C:\\xampp\\mysql\\bin\\' + name + '.exe',
    name,
  ].filter(Boolean)
  for (const c of candidates) {
    try {
      execFileSync(c, ['--version'], { stdio: 'ignore' })
      return c
    } catch {
      /* try next */
    }
  }
  throw new Error(`Não encontrei o ${name}. Instale o MySQL/XAMPP ou defina MYSQL_BIN_DIR.`)
}

const env = loadEnv(envPath)
if (!env.DATABASE_URL) throw new Error('Falta DATABASE_URL em server/.env')
const { db, user, pass, host, port } = parseDbUrl(env.DATABASE_URL)

const outFile = path.join(projectRoot, 'server', 'data', db + '.sql')
mkdirSync(path.dirname(outFile), { recursive: true })

const bin = findBinary('mysqldump')
const args = ['--host', host, '--port', port, '--user', user]
if (pass) args.push('--password=' + pass)
args.push('--single-transaction', '--routines', '--triggers', '--result-file=' + outFile, db)

try {
  execFileSync(bin, args, { stdio: 'inherit' })
} catch (e) {
  throw new Error('Falha ao fazer dump da base ' + db + ': ' + (e.message || e))
}

console.log('Backup OK: ' + outFile)