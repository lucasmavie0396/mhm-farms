import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './lib/settings'
import { I18nProvider } from './lib/i18n'
import { AuthProvider } from './lib/settings'
import { SettingsProvider } from './lib/settings'

import Home from './pages/Home'
import About from './pages/About'
import Animals from './pages/Animals'
import AnimalDetail from './pages/AnimalDetail'
import Experiences from './pages/Experiences'
import Booking from './pages/Booking'
import BookingConfirm from './pages/BookingConfirm'
import SchoolVisits from './pages/SchoolVisits'
import Events from './pages/Events'
import Gallery from './pages/Gallery'
import Prices from './pages/Prices'
import Hours from './pages/Hours'
import Location from './pages/Location'
import Contact from './pages/Contact'
import FaqPage from './pages/FaqPage'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import NotFound from './pages/NotFound'
import Legal from './pages/Legal'

import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAnimals from './pages/admin/AdminAnimals'
import AdminReservations from './pages/admin/AdminReservations'
import AdminReports from './pages/admin/AdminReports'
import AdminSchoolVisits from './pages/admin/AdminSchoolVisits'
import AdminEvents from './pages/admin/AdminEvents'
import AdminNews from './pages/admin/AdminNews'
import AdminGallery from './pages/admin/AdminGallery'
import AdminFaq from './pages/admin/AdminFaq'
import AdminMessages from './pages/admin/AdminMessages'
import AdminSettings from './pages/admin/AdminSettings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminExperiences from './pages/admin/AdminExperiences'
import AdminTicketSales from './pages/admin/AdminTicketSales'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen" />
  if (!user) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user || user.role === 'STAFF') return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function AdminIndex() {
  const { user } = useAuth()
  if (user?.role === 'STAFF') return <Navigate to="/admin/venda-entradas" replace />
  return <AdminDashboard />
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/sobre" element={<About />} />
                <Route path="/animais" element={<Animals />} />
                <Route path="/animais/:slug" element={<AnimalDetail />} />
                <Route path="/experiencias" element={<Experiences />} />
                <Route path="/reservar" element={<Booking />} />
                <Route path="/reserva/:code" element={<BookingConfirm />} />
                <Route path="/visitas-escolares" element={<SchoolVisits />} />
                <Route path="/eventos" element={<Events />} />
                <Route path="/galeria" element={<Gallery />} />
                <Route path="/precos" element={<Prices />} />
                <Route path="/horarios" element={<Hours />} />
                <Route path="/como-chegar" element={<Location />} />
                <Route path="/contactos" element={<Contact />} />
                <Route path="/perguntas-frequentes" element={<FaqPage />} />
                <Route path="/noticias" element={<News />} />
                <Route path="/noticias/:slug" element={<NewsDetail />} />
                <Route path="/termos" element={<Legal type="termos" />} />
                <Route path="/privacidade" element={<Legal type="privacidade" />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<AdminIndex />} />
                <Route
                  path="animais"
                  element={
                    <RequireAdmin>
                      <AdminAnimals />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="experiencias"
                  element={
                    <RequireAdmin>
                      <AdminExperiences />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="reservas"
                  element={
                    <RequireAdmin>
                      <AdminReservations />
                    </RequireAdmin>
                  }
                />
                <Route path="venda-entradas" element={<AdminTicketSales />} />
                <Route
                  path="relatorios"
                  element={
                    <RequireAdmin>
                      <AdminReports />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="visitas-escolares"
                  element={
                    <RequireAdmin>
                      <AdminSchoolVisits />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="eventos"
                  element={
                    <RequireAdmin>
                      <AdminEvents />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="noticias"
                  element={
                    <RequireAdmin>
                      <AdminNews />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="galeria"
                  element={
                    <RequireAdmin>
                      <AdminGallery />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="faqs"
                  element={
                    <RequireAdmin>
                      <AdminFaq />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="mensagens"
                  element={
                    <RequireAdmin>
                      <AdminMessages />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="definicoes"
                  element={
                    <RequireAdmin>
                      <AdminSettings />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="utilizadores"
                  element={
                    <RequireAdmin>
                      <AdminUsers />
                    </RequireAdmin>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </I18nProvider>
  )
}