import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-32 text-center">
      <p className="font-display text-8xl font-extrabold text-forest-300">404</p>
      <Leaf className="mt-4 h-10 w-10 text-forest-600" />
      <h1 className="mt-4 font-display text-3xl font-bold text-forest-900">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-forest-800/70">
        A página que procura não existe ou foi movida. Explore o nosso website e descubra o mundo
        MHM Farms.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Ir para o início</Link>
        <Link to="/animais" className="btn-outline">Ver os animais</Link>
      </div>
    </div>
  )
}