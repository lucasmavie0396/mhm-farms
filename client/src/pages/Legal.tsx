import { usePageMeta } from '../lib/seo'
import { PageHero } from '../components/cards'

const IMG =
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80'

const TERMOS = [
  ['Reservas', 'As reservas devem ser feitas com antecedência. O código de reserva é gerado automaticamente e deve ser apresentado na entrada.'],
  ['Cancelamentos', 'Cancelamentos com 24 horas de antecedência podem ser reagendados sem custos adicionais.'],
  ['Conduta no parque', 'Pedimos que respeite as regras de segurança e bem-estar animal. Não alimente os animais fora das atividades supervisionadas.'],
  ['Objetos de valor', 'A MHM Farms não se responsabiliza por objetos perdidos ou danificados dentro da propriedade.'],
  ['Responsabilidade', 'A visita é por sua conta e risco. Menores devem estar sempre acompanhados por um adulto.'],
]

const PRIVACIDADE = [
  ['Dados recolhidos', 'Recolhemos apenas os dados necessários para a gestão de reservas e contacto: nome, telefone, email e preferências de visita.'],
  ['Utilização', 'Os seus dados são utilizados exclusivamente para gerir reservas, responder a pedidos e melhorar os serviços da MHM Farms.'],
  ['Partilha', 'Não partilhamos nem vendemos os seus dados a terceiros.'],
  ['Segurança', 'Aplicamos medidas de segurança para proteger os dados, incluindo encriptação de senhas e controlo de acessos.'],
  ['Contacto', 'Para questões relacionadas com a privacidade, contacte-nos em info@mhmfarms.com.'],
]

export default function Legal({ type }: { type: 'termos' | 'privacidade' }) {
  const isTerms = type === 'termos'
  usePageMeta(isTerms ? 'Termos e Condições' : 'Política de Privacidade')

  return (
    <div>
      <PageHero
        kicker={isTerms ? 'Legal' : 'Privacidade'}
        title={isTerms ? 'Termos e Condições' : 'Política de Privacidade'}
        image={IMG}
      />
      <section className="py-16">
        <div className="container-page max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-forest-900">
            {isTerms ? 'Termos de utilização da MHM Farms' : 'Como protegemos os seus dados'}
          </h2>
          <div className="mt-8 space-y-6">
            {(isTerms ? TERMOS : PRIVACIDADE).map(([title, text]) => (
              <div key={title}>
                <h3 className="font-bold text-forest-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-forest-800/75">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-xs text-forest-800/50">
            Última atualização: {new Date().toLocaleDateString('pt-PT')}. © {new Date().getFullYear()} MHM Farms.
          </p>
        </div>
      </section>
    </div>
  )
}