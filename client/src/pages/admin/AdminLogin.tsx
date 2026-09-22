import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Leaf } from 'lucide-react'
import { useAuth } from '../../lib/settings'
import { usePageMeta } from '../../lib/seo'
import { Notice } from '../../components/admin'

export default function AdminLogin() {
  usePageMeta('Acesso Administrativo')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-900 to-forest-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-forest-700 text-gold-500">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-forest-900">Painel MHM Farms</h1>
          <p className="mt-1 text-sm text-forest-800/60">Inicie sessão para gerir o parque.</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {error && <Notice kind="error">{error}</Notice>}
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mhmfarms.com"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="field-label">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
            <KeyRound className="h-4 w-4" /> {loading ? 'A entrar…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-forest-800/50">
          Credenciais padrão: <code className="rounded bg-forest-50 px-1.5 py-0.5">admin@mhmfarms.com</code> ·{' '}
          <code className="rounded bg-forest-50 px-1.5 py-0.5">Admin123!</code>
        </p>
        <p className="mt-3 text-center">
          <a href="/" className="text-xs font-bold text-forest-700 hover:text-gold-600">
            ← Voltar ao website
          </a>
        </p>
      </div>
    </div>
  )
}