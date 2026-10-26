import { Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useI18n, type Language } from '@/context/I18nContext';

interface InfoPageProps {
  title: string;
}

const CONTENT: Record<string, { intro: string; body: string[] }> = {
  'About Travelar': {
    intro: 'Travelar is a multimodal travel booking marketplace and electronic ticketing platform that connects passengers with transport operators, airlines, railway services, ferry operators, accommodation providers, and experiences suppliers.',
    body: [
      'Founded to serve the Tanzanian market with plans to expand across Kenya and other African countries, Travelar offers six booking modes: bus, ferry, flights, train, stays, and experiences.',
      'Travelar is operated by OuterBlocks Limited. The platform supports guest bookings and registered user accounts, with separate systems for operator management (OIMS) and internal company operations (HIMS).',
      'Our mission is to make travel across Africa simpler, more accessible, and more reliable by connecting travellers with trusted operators and suppliers on one unified platform.',
    ],
  },
  'Contact Us': {
    intro: 'We are here to help. Reach out to us for support, partnerships, or general enquiries.',
    body: [
      'For booking support, please use our Help Center or Manage Booking page to retrieve your booking details.',
      'For partnership enquiries, please visit our Partners page or submit an API integration enquiry.',
      'Contact channels will be available as we launch. For now, please use the Help Center for any questions.',
    ],
  },
  'Cancellation and Refund Policy': {
    intro: 'Cancellation and refund policies vary by booking type and supplier.',
    body: [
      'Bus tickets: Cancellation policies are set by each operator. Some tickets may be non-refundable. Please check the fare conditions at the time of booking.',
      'Ferry tickets: Cancellation policies depend on the operator and vessel class. Resident and non-resident fares may have different refund rules.',
      'Flights: Cancellation and refund terms are determined by the airline and fare type. Some fares are non-refundable.',
      'Stays: Cancellation policies are set by each property. Free cancellation may be available up to 48-72 hours before check-in.',
      'Experiences: Full refund may be available up to 12-48 hours before the experience, depending on the supplier.',
      'Train: Cancellation policies follow the railway provider terms.',
    ],
  },
  'Terms and Conditions': {
    intro: 'These terms govern your use of the Travelar platform.',
    body: [
      'Travelar is a booking platform that connects passengers with operators and suppliers. Travelar is not itself a transport operator.',
      'All bookings are subject to the terms and conditions of the relevant operator, airline, accommodation provider, or experience supplier.',
      'Tickets and vouchers are issued only after payment confirmation by the relevant payment service provider.',
      'Travelar reserves the right to refuse or cancel bookings where fraud, abuse, or invalid payment is detected.',
    ],
  },
  'Privacy Policy': {
    intro: 'Your privacy is important to us.',
    body: [
      'Travelar collects personal information necessary for booking processing, including names, contact details, and identification information as required by operators and suppliers.',
      'We do not sell your personal information to third parties.',
      'Payment information is processed securely through our payment service providers. We do not store full card details.',
      'You may request access to, correction of, or deletion of your personal data in accordance with applicable law.',
    ],
  },
  'Cookie Policy': {
    intro: 'Travelar uses cookies to improve your experience.',
    body: [
      'Cookies are small files stored on your device that help us remember your preferences and improve site functionality.',
      'Essential cookies are required for the platform to function correctly. Analytics cookies help us understand how the site is used.',
      'You can manage cookie preferences through your browser settings.',
    ],
  },
  'API and Integration Enquiries': {
    intro: 'Travelar supports integrations with transport operators, airlines, GDS providers, accommodation suppliers, and payment service providers.',
    body: [
      'If you are an operator or supplier interested in integrating with Travelar, please provide details about your service, API capabilities, and commercial requirements.',
      'We support REST API integrations, webhook-based confirmation flows, and real-time inventory synchronization.',
      'Integration enquiries will be reviewed by our partnerships and engineering teams.',
    ],
  },
};

const LOCALIZED_CONTENT: Partial<Record<Language, Record<string, { intro: string; body: string[] }>>> = {
  sw: {
    'About Travelar': {
      intro: 'Travelar ni soko la kuhifadhi safari za aina mbalimbali na jukwaa la tiketi za kielektroniki linalowaunganisha abiria na waendeshaji wa usafiri, mashirika ya ndege, reli, feri, malazi na watoa huduma za utalii.',
      body: [
        'Travelar ilianzishwa kuhudumia soko la Tanzania, ikiwa na mipango ya kupanuka Kenya na nchi nyingine za Afrika. Inatoa huduma sita: basi, feri, ndege, treni, malazi na shughuli za utalii.',
        'Travelar inaendeshwa na OuterBlocks Limited. Jukwaa linasaidia nafasi za wageni na akaunti za watumiaji waliosajiliwa, pamoja na mifumo tofauti ya usimamizi wa waendeshaji (OIMS) na shughuli za kampuni (HIMS).',
        'Dhamira yetu ni kurahisisha, kupanua upatikanaji na kuboresha uaminifu wa safari barani Afrika kwa kuwaunganisha wasafiri na watoa huduma wanaoaminika kwenye jukwaa moja.',
      ],
    },
    'Contact Us': {
      intro: 'Tuko hapa kukusaidia. Wasiliana nasi kwa msaada, ushirikiano au maswali ya jumla.',
      body: [
        'Kwa msaada wa nafasi uliyoweka, tumia Kituo cha Msaada au ukurasa wa Dhibiti Nafasi kupata maelezo yako.',
        'Kwa maswali ya ushirikiano, tembelea ukurasa wa Washirika au tuma ombi la muunganisho wa API.',
        'Njia za mawasiliano zitatangazwa huduma itakapozinduliwa. Kwa sasa, tumia Kituo cha Msaada kwa maswali.',
      ],
    },
    'Cancellation and Refund Policy': {
      intro: 'Masharti ya kughairi na kurejesha fedha hutegemea aina ya nafasi na mtoa huduma.',
      body: [
        'Tiketi za basi: Kila mwendeshaji huweka masharti yake. Baadhi ya tiketi hazirejeshewi fedha. Kagua masharti ya nauli unapoweka nafasi.',
        'Tiketi za feri: Masharti hutegemea mwendeshaji na daraja la meli. Nauli za wakazi na wasio wakazi zinaweza kuwa na masharti tofauti.',
        'Ndege: Masharti ya kughairi na kurejesha fedha huamuliwa na shirika la ndege na aina ya nauli. Baadhi ya nauli hazirejeshewi fedha.',
        'Malazi: Kila nyumba huweka masharti yake. Kughairi bila malipo kunaweza kuruhusiwa hadi saa 48–72 kabla ya kuingia.',
        'Shughuli za utalii: Kurejeshewa fedha kamili kunaweza kuruhusiwa saa 12–48 kabla ya shughuli, kutegemea mtoa huduma.',
        'Treni: Masharti ya kughairi hufuata kanuni za mtoa huduma wa reli.',
      ],
    },
    'Terms and Conditions': {
      intro: 'Masharti haya yanatawala matumizi yako ya jukwaa la Travelar.',
      body: [
        'Travelar ni jukwaa la kuweka nafasi linalowaunganisha abiria na waendeshaji na watoa huduma. Travelar yenyewe si mwendeshaji wa usafiri.',
        'Nafasi zote hufuata masharti ya mwendeshaji, shirika la ndege, mtoa malazi au mtoa shughuli husika.',
        'Tiketi na vocha hutolewa tu baada ya malipo kuthibitishwa na mtoa huduma wa malipo husika.',
        'Travelar inaweza kukataa au kughairi nafasi iwapo itabaini ulaghai, matumizi mabaya au malipo batili.',
      ],
    },
    'Privacy Policy': {
      intro: 'Faragha yako ni muhimu kwetu.',
      body: [
        'Travelar hukusanya taarifa binafsi zinazohitajika kuchakata nafasi, zikiwemo majina, mawasiliano na taarifa za utambulisho zinazotakiwa na waendeshaji na watoa huduma.',
        'Hatuuzi taarifa zako binafsi kwa wahusika wengine.',
        'Taarifa za malipo huchakatwa kwa usalama kupitia watoa huduma wetu wa malipo. Hatuhifadhi taarifa kamili za kadi.',
        'Unaweza kuomba kuona, kusahihisha au kufuta taarifa zako binafsi kwa mujibu wa sheria zinazotumika.',
      ],
    },
    'Cookie Policy': {
      intro: 'Travelar hutumia vidakuzi kuboresha matumizi yako.',
      body: [
        'Vidakuzi ni faili ndogo zinazohifadhiwa kwenye kifaa chako ili kutukumbusha mapendeleo yako na kuboresha utendaji wa tovuti.',
        'Vidakuzi muhimu vinahitajika ili jukwaa lifanye kazi. Vidakuzi vya uchanganuzi hutusaidia kuelewa matumizi ya tovuti.',
        'Unaweza kudhibiti vidakuzi kupitia mipangilio ya kivinjari chako.',
      ],
    },
    'API and Integration Enquiries': {
      intro: 'Travelar inaunga mkono miunganisho na waendeshaji wa usafiri, mashirika ya ndege, watoa huduma za GDS, malazi na malipo.',
      body: [
        'Ikiwa wewe ni mwendeshaji au mtoa huduma unayetaka kuunganishwa na Travelar, eleza huduma yako, uwezo wa API na mahitaji ya kibiashara.',
        'Tunaunga mkono miunganisho ya REST API, uthibitishaji kupitia webhook na usawazishaji wa upatikanaji wa wakati halisi.',
        'Maswali ya muunganisho yatapitiwa na timu zetu za ushirikiano na uhandisi.',
      ],
    },
  },
  fr: {
    'About Travelar': {
      intro: 'Travelar est une plateforme de réservation multimodale et de billetterie électronique qui met en relation les voyageurs avec des opérateurs de transport, compagnies aériennes, services ferroviaires, ferries, hébergements et prestataires d’activités.',
      body: [
        'Créée pour le marché tanzanien, avec une ambition d’expansion au Kenya et dans d’autres pays africains, Travelar propose six catégories : bus, ferry, avion, train, hébergement et activités.',
        'Travelar est exploitée par OuterBlocks Limited. La plateforme prend en charge les réservations sans compte et les comptes utilisateurs, ainsi que des systèmes distincts de gestion des opérateurs (OIMS) et des opérations internes (HIMS).',
        'Notre mission est de simplifier les voyages en Afrique, de les rendre plus accessibles et plus fiables en réunissant voyageurs et prestataires de confiance sur une seule plateforme.',
      ],
    },
    'Contact Us': {
      intro: 'Nous sommes là pour vous aider. Contactez-nous pour obtenir de l’aide, proposer un partenariat ou poser une question générale.',
      body: [
        'Pour obtenir de l’aide concernant une réservation, utilisez le Centre d’aide ou la page Gérer ma réservation pour retrouver vos informations.',
        'Pour toute demande de partenariat, consultez notre page Partenaires ou envoyez une demande d’intégration API.',
        'Nos coordonnées seront communiquées au lancement. En attendant, veuillez utiliser le Centre d’aide.',
      ],
    },
    'Cancellation and Refund Policy': {
      intro: 'Les conditions d’annulation et de remboursement varient selon le type de réservation et le prestataire.',
      body: [
        'Billets de bus : chaque opérateur définit ses conditions. Certains billets ne sont pas remboursables. Vérifiez les conditions tarifaires lors de la réservation.',
        'Billets de ferry : les conditions dépendent de l’opérateur et de la classe du navire. Les tarifs résidents et non-résidents peuvent différer.',
        'Vols : les conditions d’annulation et de remboursement sont fixées par la compagnie aérienne et le tarif. Certains tarifs ne sont pas remboursables.',
        'Hébergements : chaque établissement définit ses conditions. L’annulation gratuite peut être possible jusqu’à 48 à 72 heures avant l’arrivée.',
        'Activités : un remboursement intégral peut être possible 12 à 48 heures avant l’activité, selon le prestataire.',
        'Train : les conditions d’annulation suivent les règles du fournisseur ferroviaire.',
      ],
    },
    'Terms and Conditions': {
      intro: 'Les présentes conditions régissent votre utilisation de la plateforme Travelar.',
      body: [
        'Travelar est une plateforme de réservation qui met en relation les voyageurs avec des opérateurs et des prestataires. Travelar n’est pas elle-même un transporteur.',
        'Toute réservation est soumise aux conditions de l’opérateur, de la compagnie aérienne, de l’hébergeur ou du prestataire concerné.',
        'Les billets et bons ne sont émis qu’après confirmation du paiement par le prestataire de paiement concerné.',
        'Travelar se réserve le droit de refuser ou d’annuler une réservation en cas de fraude, d’abus ou de paiement invalide.',
      ],
    },
    'Privacy Policy': {
      intro: 'La protection de votre vie privée est importante pour nous.',
      body: [
        'Travelar collecte les données personnelles nécessaires au traitement des réservations, notamment les noms, coordonnées et pièces d’identité requises par les opérateurs et prestataires.',
        'Nous ne vendons pas vos données personnelles à des tiers.',
        'Les paiements sont traités de manière sécurisée par nos prestataires. Nous ne conservons pas les données complètes des cartes.',
        'Vous pouvez demander l’accès, la rectification ou la suppression de vos données personnelles conformément à la loi applicable.',
      ],
    },
    'Cookie Policy': {
      intro: 'Travelar utilise des cookies pour améliorer votre expérience.',
      body: [
        'Les cookies sont de petits fichiers enregistrés sur votre appareil qui nous aident à mémoriser vos préférences et à améliorer le fonctionnement du site.',
        'Les cookies essentiels sont nécessaires au fonctionnement de la plateforme. Les cookies analytiques nous aident à comprendre l’utilisation du site.',
        'Vous pouvez gérer les cookies dans les paramètres de votre navigateur.',
      ],
    },
    'API and Integration Enquiries': {
      intro: 'Travelar prend en charge les intégrations avec les opérateurs de transport, compagnies aériennes, fournisseurs GDS, hébergeurs et prestataires de paiement.',
      body: [
        'Si vous êtes un opérateur ou prestataire souhaitant intégrer Travelar, présentez votre service, vos capacités API et vos besoins commerciaux.',
        'Nous prenons en charge les intégrations REST API, les confirmations par webhook et la synchronisation des disponibilités en temps réel.',
        'Les demandes d’intégration seront examinées par nos équipes Partenariats et Ingénierie.',
      ],
    },
  },
};

const TITLE_KEYS: Record<string, Parameters<ReturnType<typeof useI18n>['tp']>[0]> = {
  'About Travelar': 'aboutTravelar',
  'Contact Us': 'contactUs',
  'Cancellation and Refund Policy': 'cancellationRefundPolicy',
  'Terms and Conditions': 'termsConditions',
  'Privacy Policy': 'privacyPolicy',
  'Cookie Policy': 'cookiePolicy',
  'API and Integration Enquiries': 'apiEnquiries',
};

export function InfoPage({ title }: InfoPageProps) {
  const { lang, tp } = useI18n();
  const content = LOCALIZED_CONTENT[lang]?.[title] ?? CONTENT[title];

  return (
    <div className="bg-background">
      <div className="section-container py-14">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="btn-ghost mb-8 px-0 hover:bg-transparent"><ArrowLeft size={16} /> {tp('backToHome')}</Link>
          <h1 className="mb-5 font-display text-page font-bold text-ink">{TITLE_KEYS[title] ? tp(TITLE_KEYS[title]) : title}</h1>
          {content ? (
            <>
              <p className="mb-8 border-l-4 border-accent pl-4 text-lg leading-relaxed text-ink">{content.intro}</p>
              <div className="space-y-5">
                {content.body.map((para, i) => (
                  <p key={i} className="text-body leading-relaxed text-neutral-600">{para}</p>
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
