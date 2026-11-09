import { Link } from '@/router';
import { useI18n, type Language } from '@/context/I18nContext';

const PARTNER_COPY: Record<Language, {
  title: string;
  intro: string;
  cards: { title: string; description: string; points: string[] }[];
  apiLink: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
}> = {
  en: {
    title: 'Become a Travelar Partner',
    intro: 'Join Travelar to reach travellers across Tanzania and beyond. We partner with transport operators, accommodation providers, and experience suppliers.',
    cards: [
      {
        title: 'Transport Operators',
        description: 'Bus and ferry operators can manage fleets, routes, schedules, fares, and manifests through our Operator Management System.',
        points: ['Configure routes, stops, and segment-based fares', 'Manage seat maps and vehicle configurations', 'View booking manifests and OTC sales', 'Ferry operators manage vessels, classes, and capacities'],
      },
      {
        title: 'Accommodation Providers',
        description: 'Hotels, lodges, and guesthouses can list properties and manage room availability and rates.',
        points: ['List rooms with photos and amenities', 'Set rates and cancellation policies', 'Manage availability calendars', 'Receive confirmed reservations'],
      },
      {
        title: 'Experience Suppliers',
        description: 'Tour operators and activity providers can list experiences and manage sessions.',
        points: ['List tours, safaris, and activities', 'Set session times and availability', 'Define participant requirements', 'Issue vouchers to confirmed bookings'],
      },
      {
        title: 'API & Integration',
        description: "Integrate with Travelar's platform through our API for distribution and booking management.",
        points: ['GDS and supplier integrations', 'Payment provider adapters', 'Real-time inventory sync', 'Webhook-based confirmation flows'],
      },
    ],
    apiLink: 'API enquiries',
    ctaTitle: 'Ready to partner with us?',
    ctaDescription: 'Write to our partnerships team at partners@travelarway.com about onboarding and integration.',
    ctaButton: 'Email partners',
  },
  sw: {
    title: 'Kuwa Mshirika wa Travelar',
    intro: 'Jiunge na Travelar ili kuwafikia wasafiri kote Tanzania na kwingineko. Tunashirikiana na waendeshaji wa usafiri, watoa malazi na watoa shughuli za utalii.',
    cards: [
      {
        title: 'Waendeshaji wa Usafiri',
        description: 'Waendeshaji wa mabasi na feri wanaweza kudhibiti magari, njia, ratiba, nauli na orodha za abiria kupitia Mfumo wetu wa Usimamizi wa Waendeshaji.',
        points: ['Sanidi njia, vituo na nauli za kila sehemu', 'Dhibiti ramani za viti na usanidi wa magari', 'Angalia orodha za nafasi na mauzo ya OTC', 'Waendeshaji wa feri hudhibiti meli, madaraja na uwezo'],
      },
      {
        title: 'Watoa Malazi',
        description: 'Hoteli, nyumba za kulala wageni na nyumba za mapumziko zinaweza kutangaza huduma na kudhibiti upatikanaji na bei za vyumba.',
        points: ['Orodhesha vyumba vyenye picha na huduma', 'Weka bei na masharti ya kughairi', 'Dhibiti kalenda za upatikanaji', 'Pokea nafasi zilizothibitishwa'],
      },
      {
        title: 'Watoa Shughuli za Utalii',
        description: 'Waendeshaji wa ziara na watoa shughuli wanaweza kutangaza huduma na kudhibiti vipindi.',
        points: ['Orodhesha ziara, safari za wanyama na shughuli', 'Weka saa na upatikanaji wa vipindi', 'Bainisha mahitaji ya washiriki', 'Toa vocha kwa nafasi zilizothibitishwa'],
      },
      {
        title: 'API na Miunganisho',
        description: 'Unganisha huduma zako na jukwaa la Travelar kupitia API yetu kwa usambazaji na usimamizi wa nafasi.',
        points: ['Miunganisho ya GDS na watoa huduma', 'Viunganishi vya watoa huduma za malipo', 'Usawazishaji wa bidhaa wa wakati halisi', 'Uthibitishaji kupitia webhook'],
      },
    ],
    apiLink: 'Maswali kuhusu API',
    ctaTitle: 'Tuko tayari kushirikiana?',
    ctaDescription: 'Andika kwa timu yetu ya washirika kupitia partners@travelarway.com kuhusu kujiunga na kuunganisha mifumo.',
    ctaButton: 'Tuma barua pepe',
  },
  fr: {
    title: 'Devenir partenaire Travelar',
    intro: 'Rejoignez Travelar pour toucher des voyageurs en Tanzanie et au-delà. Nous collaborons avec des transporteurs, des hébergeurs et des prestataires d’activités.',
    cards: [
      {
        title: 'Opérateurs de transport',
        description: 'Les opérateurs de bus et de ferry peuvent gérer leurs véhicules, itinéraires, horaires, tarifs et listes de passagers avec notre système de gestion.',
        points: ['Configurer les itinéraires, arrêts et tarifs par segment', 'Gérer les plans de sièges et les véhicules', 'Consulter les manifestes et ventes OTC', 'Gérer les navires, classes et capacités pour les ferries'],
      },
      {
        title: 'Hébergeurs',
        description: 'Les hôtels, lodges et maisons d’hôtes peuvent présenter leurs établissements et gérer les disponibilités et tarifs des chambres.',
        points: ['Présenter les chambres, photos et équipements', 'Définir les tarifs et conditions d’annulation', 'Gérer les calendriers de disponibilité', 'Recevoir les réservations confirmées'],
      },
      {
        title: 'Prestataires d’activités',
        description: 'Les voyagistes et organisateurs d’activités peuvent publier leurs offres et gérer les sessions.',
        points: ['Proposer des excursions, safaris et activités', 'Définir les horaires et disponibilités', 'Préciser les conditions de participation', 'Émettre des bons pour les réservations confirmées'],
      },
      {
        title: 'API et intégration',
        description: 'Intégrez la plateforme Travelar via notre API pour gérer la distribution et les réservations.',
        points: ['Intégrations GDS et fournisseurs', 'Adaptateurs de prestataires de paiement', 'Synchronisation des disponibilités en temps réel', 'Confirmations par webhook'],
      },
    ],
    apiLink: 'Demandes API',
    ctaTitle: 'Prêt à devenir partenaire ?',
    ctaDescription: 'Écrivez à notre équipe Partenariats à partners@travelarway.com pour l’intégration et le démarrage.',
    ctaButton: 'Écrire aux partenaires',
  },
};

export function PartnersPage() {
  const { lang } = useI18n();
  const copy = PARTNER_COPY[lang];

  return (
    <div className="bg-background">
    <div className="section-container py-14">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 mx-auto max-w-2xl text-center">
          <h1 className="mb-3 font-display text-page font-bold text-ink">{copy.title}</h1>
          <p className="text-body text-neutral-600">
            {copy.intro}
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {copy.cards.map((card, index) => {
            return (
              <div key={card.title} className="card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-sm bg-brand-50 text-listing font-bold text-brand-600">
                  {index + 1}
                </div>
                <h3 className="mb-2 font-display text-listing font-bold text-ink">{card.title}</h3>
                <p className="mb-4 text-body text-neutral-500">{card.description}</p>
                <ul className="space-y-2 text-body text-neutral-600">
                  {card.points.map((point) => <li key={point}>• {point}</li>)}
                </ul>
                {index === 3 && (
                  <Link to="/api-enquiries" className="mt-4 inline-flex items-center gap-1 text-body font-medium text-ink hover:text-brand-700">
                    {copy.apiLink} <span>→</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-ink p-8 text-white">
          <h2 className="mb-3 font-display text-section font-bold">{copy.ctaTitle}</h2>
          <p className="mb-6 max-w-xl text-body text-white/75">{copy.ctaDescription}</p>
          <a href="mailto:partners@travelarway.com" className="btn-light">{copy.ctaButton}</a>
        </div>
      </div>
    </div>
    </div>
  );
}
