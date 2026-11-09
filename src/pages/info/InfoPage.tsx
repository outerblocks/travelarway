import { Link } from '@/router';
import { useI18n, type Language } from '@/context/I18nContext';

interface InfoPageProps {
  title: string;
}

const CONTENT: Record<string, { intro: string; body: string[] }> = {
  'About Travelar': {
    intro: 'Travelar is a multimodal travel booking marketplace and electronic ticketing platform that connects passengers with transport operators, airlines, railway services, ferry operators, accommodation providers, and experiences suppliers.',
    body: [
      'Founded to serve the Tanzanian market with plans to expand across Kenya and other African countries, Travelar offers six booking modes: bus, ferry, flights, train, stays, and experiences.',
      'Travelar is operated by OuterBlocks Limited, trading as Travelar. The platform supports guest bookings and registered user accounts, with separate systems for operator management (OIMS) and internal company operations (HIMS).',
      'Our mission is to make travel across Africa simpler, more accessible, and more reliable by connecting travellers with trusted operators and suppliers on one unified platform.',
    ],
  },
  'Contact Us': {
    intro: 'We are here to help. Reach out to us for support, partnerships, or general enquiries.',
    body: [
      'For booking support, please use our Help Center or Manage Booking page to retrieve your booking details.',
      'For partnership and supplier enquiries, email partners@travelarway.com, visit our Partners page, or submit an API integration enquiry.',
      'Customer support: customer@travelaraway.com, +255 714 559 749.',
    ],
  },
  'API and Integration Enquiries': {
    intro: 'Travelar supports integrations with transport operators, airlines, GDS providers, accommodation suppliers, and payment service providers.',
    body: [
      'If you are an operator or supplier interested in integrating with Travelar, please provide details about your service, API capabilities, and commercial requirements.',
      'We support REST API integrations, webhook-based confirmation flows, and real-time inventory synchronization.',
      'Send integration enquiries to partners@travelarway.com. They will be reviewed by our partnerships and engineering teams.',
    ],
  },
};

const LOCALIZED_CONTENT: Partial<Record<Language, Record<string, { intro: string; body: string[] }>>> = {
  sw: {
    'About Travelar': {
      intro: 'Travelar ni soko la kuhifadhi safari za aina mbalimbali na jukwaa la tiketi za kielektroniki linalowaunganisha abiria na waendeshaji wa usafiri, mashirika ya ndege, reli, feri, malazi na watoa huduma za utalii.',
      body: [
        'Travelar ilianzishwa kuhudumia soko la Tanzania, ikiwa na mipango ya kupanuka Kenya na nchi nyingine za Afrika. Inatoa huduma sita: basi, feri, ndege, treni, malazi na shughuli za utalii.',
        'Travelar inaendeshwa na OuterBlocks Limited, inayojulikana kama Travelar. Jukwaa linasaidia nafasi za wageni na akaunti za watumiaji waliosajiliwa, pamoja na mifumo tofauti ya usimamizi wa waendeshaji (OIMS) na shughuli za kampuni (HIMS).',
        'Dhamira yetu ni kurahisisha, kupanua upatikanaji na kuboresha uaminifu wa safari barani Afrika kwa kuwaunganisha wasafiri na watoa huduma wanaoaminika kwenye jukwaa moja.',
      ],
    },
    'Contact Us': {
      intro: 'Tuko hapa kukusaidia. Wasiliana nasi kwa msaada, ushirikiano au maswali ya jumla.',
      body: [
        'Kwa msaada wa nafasi uliyoweka, tumia Kituo cha Msaada au ukurasa wa Dhibiti Nafasi kupata maelezo yako.',
        'Kwa maswali ya ushirikiano na watoa huduma, tuma barua pepe partners@travelarway.com, tembelea ukurasa wa Washirika au tuma ombi la muunganisho wa API.',
        'Msaada kwa wateja: customer@travelaraway.com, +255 714 559 749.',
      ],
    },
    'API and Integration Enquiries': {
      intro: 'Travelar inaunga mkono miunganisho na waendeshaji wa usafiri, mashirika ya ndege, watoa huduma za GDS, malazi na malipo.',
      body: [
        'Ikiwa wewe ni mwendeshaji au mtoa huduma unayetaka kuunganishwa na Travelar, eleza huduma yako, uwezo wa API na mahitaji ya kibiashara.',
        'Tunaunga mkono miunganisho ya REST API, uthibitishaji kupitia webhook na usawazishaji wa upatikanaji wa wakati halisi.',
        'Tuma maswali ya muunganisho kwa partners@travelarway.com. Yatapitiwa na timu zetu za ushirikiano na uhandisi.',
      ],
    },
  },
  fr: {
    'About Travelar': {
      intro: 'Travelar est une plateforme de réservation multimodale et de billetterie électronique qui met en relation les voyageurs avec des opérateurs de transport, compagnies aériennes, services ferroviaires, ferries, hébergements et prestataires d’activités.',
      body: [
        'Créée pour le marché tanzanien, avec une ambition d’expansion au Kenya et dans d’autres pays africains, Travelar propose six catégories : bus, ferry, avion, train, hébergement et activités.',
        'Travelar est exploitée par OuterBlocks Limited, sous le nom commercial Travelar. La plateforme prend en charge les réservations sans compte et les comptes utilisateurs, ainsi que des systèmes distincts de gestion des opérateurs (OIMS) et des opérations internes (HIMS).',
        'Notre mission est de simplifier les voyages en Afrique, de les rendre plus accessibles et plus fiables en réunissant voyageurs et prestataires de confiance sur une seule plateforme.',
      ],
    },
    'Contact Us': {
      intro: 'Nous sommes là pour vous aider. Contactez-nous pour obtenir de l’aide, proposer un partenariat ou poser une question générale.',
      body: [
        'Pour obtenir de l’aide concernant une réservation, utilisez le Centre d’aide ou la page Gérer ma réservation pour retrouver vos informations.',
        'Pour les partenariats et fournisseurs, écrivez à partners@travelarway.com, consultez notre page Partenaires ou envoyez une demande d’intégration API.',
        'Service client : customer@travelaraway.com, +255 714 559 749.',
      ],
    },
    'API and Integration Enquiries': {
      intro: 'Travelar prend en charge les intégrations avec les opérateurs de transport, compagnies aériennes, fournisseurs GDS, hébergeurs et prestataires de paiement.',
      body: [
        'Si vous êtes un opérateur ou prestataire souhaitant intégrer Travelar, présentez votre service, vos capacités API et vos besoins commerciaux.',
        'Nous prenons en charge les intégrations REST API, les confirmations par webhook et la synchronisation des disponibilités en temps réel.',
        'Envoyez les demandes d’intégration à partners@travelarway.com. Elles seront examinées par nos équipes Partenariats et Ingénierie.',
      ],
    },
  },
};

const TITLE_KEYS: Record<string, Parameters<ReturnType<typeof useI18n>['tp']>[0]> = {
  'About Travelar': 'aboutTravelar',
  'Contact Us': 'contactUs',
  'API and Integration Enquiries': 'apiEnquiries',
};

export function InfoPage({ title }: InfoPageProps) {
  const { lang, tp } = useI18n();
  const content = LOCALIZED_CONTENT[lang]?.[title] ?? CONTENT[title];

  return (
    <div className="bg-background">
      <div className="section-container py-8 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="btn-ghost mb-8 px-0 hover:bg-transparent">← {tp('backToHome')}</Link>
          <h1 className="mb-5 text-center font-display text-page font-bold text-ink">{TITLE_KEYS[title] ? tp(TITLE_KEYS[title]) : title}</h1>
          {content ? (
            <>
              <p className="mb-8 text-center text-lg leading-relaxed text-ink">{content.intro}</p>
              <div className="space-y-5">
                {content.body.map((para, i) => (
                  <p key={i} className="text-body leading-relaxed text-neutral-600">
                    {para.split(/(customer@travelaraway\.com|partners@travelarway\.com)/g).map((part, j) =>
                      part.includes('@') ? (
                        <a key={j} className="text-ink underline underline-offset-2" href={`mailto:${part}`}>
                          {part}
                        </a>
                      ) : (
                        part
                      ),
                    )}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-body text-neutral-500">{tp('contentComingSoon')}</p>
          )}
          <div className="mt-12 border-t border-neutral-200 pt-8 text-meta text-neutral-500">
            {tp('operatedBy')}
          </div>
        </div>
      </div>
    </div>
  );
}
