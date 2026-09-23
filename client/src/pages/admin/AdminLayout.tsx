import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Images,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PawPrint,
  Settings,
  ShoppingCart,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react'
import { useAuth, ROLE_LABELS } from '../../lib/settings'

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/reservas', label: 'Reservas', Icon: Ticket },
  { to: '/admin/venda-entradas', label: 'Venda de entradas', Icon: ShoppingCart },
  { to: '/admin/relatorios', label: 'Relatórios', Icon: BarChart3 },
  { to: '/admin/animais', label: 'Animais', Icon: PawPrint },
  { to: '/admin/experiencias', label: 'Experiências', Icon: Sparkles },
  { to: '/admin/eventos', label: 'Eventos', Icon: CalendarDays },
  { to: '/admin/visitas-escolares', label: 'Visitas Escolares', Icon: GraduationCap },
  { to: '/admin/noticias', label: 'Notícias', Icon: FileText },
  { to: '/admin/galeria', label: 'Galeria', Icon: Images },
  { to: '/admin/faqs', label: 'FAQ', Icon: ClipboardList },
  { to: '/admin/mensagens', label: 'Mensagens', Icon: MessageSquare },
  { to: '/admin/definicoes', label: 'Definições', Icon: Settings },
  { to: '/admin/utilizadores', label: 'Utilizadores', Icon: Users },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = user?.role === 'STAFF' ? NAV.filter((n) => n.to === '/admin/venda-entradas') : NAV

  return (
    <div className="flex min-h-screen bg-forest-50/60">
      <aside className="no-scrollbar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto bg-forest-950 text-white lg:flex">
        <Link to="/admin" className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-700 font-display text-lg font-bold text-gold-500">
            MH
          </span>
          <span>
            <span className="block font-display text-lg font-bold">MHM Farms</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500">
              Administração
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-forest-700 text-gold-400' : 'text-white/70 hover:bg-forest-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-forest-800 p-4">
          <Link to="/" className="mb-2 block text-xs font-bold text-white/50 hover:text-white">
            ← Ver website público
          </Link>
          <button
            onClick={async () => {
              await logout()
              navigate('/admin/login')
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-forest-800 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-forest-700"
          >
            <LogOut className="h-4 w-4" /> Terminar sessão
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-forest-100 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Link to="/admin" className="font-display text-lg font-bold text-forest-900">
              MHM Admin
            </Link>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-sm font-semibold text-forest-800/60">Bem-vindo,</span>
            <span className="text-sm font-bold text-forest-900">{user?.name}</span>
            <span className="badge bg-forest-100 text-forest-800">
              {user ? ROLE_LABELS[user.role] : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-outline !px-4 !py-2 !text-xs !normal-case">
              Ver site
            </Link>
            <button
              onClick={async () => {
                await logout()
                navigate('/admin/login')
              }}
              className="btn-primary !px-4 !py-2 !text-xs !normal-case lg:hidden"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>

        <nav className="no-scrollbar sticky bottom-0 z-30 flex gap-1 overflow-x-auto bg-forest-950 p-2 lg:hidden">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${
                  isActive ? 'bg-forest-700 text-gold-400' : 'text-white/70'
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}