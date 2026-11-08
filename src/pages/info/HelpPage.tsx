import { Link } from '@/router';
import { useI18n, type Language } from '@/context/I18nContext';

const HELP_TOPICS = [
  { label: '1', link: '/manage-booking' },
  { label: '2', link: '/cancellation-policy' },
  { label: '3', link: '/cancellation-policy' },
  { label: '4', link: '/signin' },
];

const HELP_COPY: Record<Language, {
  title: string;
  intro: string;
  topics: { title: string; description: string }[];
  moreTitle: string;
  moreDescription: string;
  contact: string;
}> = {
  en: {
    title: 'Help Center',
    intro: 'Find answers to common questions about your bookings.',
    topics: [
      { title: 'Managing your booking', description: 'How to retrieve, view, and modify your booking using your reference number.' },
      { title: 'Payment methods', description: 'Information about mobile money, card payments, and supported providers in your market.' },
      { title: 'Cancellations and refunds', description: 'Understand cancellation policies and refund timelines for different booking types.' },
      { title: 'Account access', description: 'Sign in, create an account, or manage a booking as a guest.' },
    ],
    moreTitle: 'Need more help?',
    moreDescription: "If you can't find what you're looking for, our support team is here to help.",
    contact: 'Contact us',
  },
  sw: {
    title: 'Kituo cha Msaada',
    intro: 'Pata majibu ya maswali ya kawaida kuhusu nafasi zako.',
    topics: [
      { title: 'Kudhibiti nafasi yako', description: 'Jinsi ya kupata, kuona na kubadilisha nafasi yako kwa kutumia nambari ya kumbukumbu.' },
      { title: 'Njia za malipo', description: 'Maelezo kuhusu pesa kwa simu, malipo ya kadi na watoa huduma wanaokubaliwa nchini kwako.' },
      { title: 'Kughairi na kurejeshewa fedha', description: 'Fahamu masharti ya kughairi na muda wa kurejeshewa fedha kwa aina tofauti za nafasi.' },
      { title: 'Kufikia akaunti', description: 'Ingia, fungua akaunti au dhibiti nafasi kama mgeni.' },
    ],
    moreTitle: 'Unahitaji msaada zaidi?',
    moreDescription: 'Ikiwa hujapata unachotafuta, timu yetu ya usaidizi iko tayari kukusaidia.',
    contact: 'Wasiliana nasi',
  },
  fr: {
    title: 'Centre d’aide',
    intro: 'Trouvez des réponses aux questions fréquentes sur vos réservations.',
    topics: [
      { title: 'Gérer votre réservation', description: 'Retrouvez, consultez et modifiez votre réservation à l’aide de sa référence.' },
      { title: 'Moyens de paiement', description: 'Informations sur le paiement mobile, les cartes et les prestataires disponibles dans votre région.' },
      { title: 'Annulations et remboursements', description: 'Consultez les conditions d’annulation et les délais de remboursement selon le type de réservation.' },
      { title: 'Accès au compte', description: 'Connectez-vous, créez un compte ou gérez une réservation en tant qu’invité.' },
    ],
    moreTitle: 'Besoin d’aide supplémentaire ?',
    moreDescription: 'Si vous ne trouvez pas la réponse recherchée, notre équipe d’assistance est là pour vous aider.',
    contact: 'Contactez-nous',
  },
};

export function HelpPage() {
  const { lang } = useI18n();
  const copy = HELP_COPY[lang];

  return (
    <div className="bg-background">
      <div className="section-container py-8 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="mb-2 font-display text-page font-bold text-ink">{copy.title}</h1>
            <p className="text-body text-neutral-600">{copy.intro}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {HELP_TOPICS.map((topic, index) => (
              <Link key={topic.link + index} to={topic.link} className="card group p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-ink text-label font-bold text-white">{topic.label}</div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-display text-listing font-bold text-ink">{copy.topics[index].title}</h3>
                    <p className="text-body text-neutral-500">{copy.topics[index].description}</p>
                  </div>
                                  </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-ink p-5 sm:p-6 text-white">
            <h3 className="mb-2 font-display text-listing font-bold">{copy.moreTitle}</h3>
            <p className="mb-4 text-body text-white/70">{copy.moreDescription}</p>
            <Link to="/contact" className="btn-light">{copy.contact}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
