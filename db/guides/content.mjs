/** Travelar-authored guide copy. Used only to generate db/seed/0005_travel_guides.sql. */

const researchedAt = '2026-11-08';

function sections(pairs) {
  return pairs.map(([heading, paragraphs]) => ({ heading, paragraphs }));
}

export const GUIDES = [
  {
    id: 'e1000000-0000-4000-8000-000000000001',
    slug: 'dar-es-salaam-zanzibar-ferry',
    topic: 'ferry',
    related_mode: 'ferry',
    cover_path: '/guides/dar-es-salaam-zanzibar-ferry.jpg',
    sort_order: 10,
    researched_at: researchedAt,
    source_notes:
      'Azam Marine / Bakhresa (azammarine.com, bakhresa.com marine); Tanzania Immigration visa guidelines; public port descriptions for Sokoine Drive / Malindi. Times and fares are operator-owned — not Travelar inventory.',
    locales: {
      en: {
        title: 'How to travel from Dar es Salaam to Zanzibar by ferry',
        excerpt:
          'Who operates the crossing, where to board, passport checks, resident and non-resident tickets, and what to confirm before you travel.',
        cover_alt: 'Passenger ferries at the Dar es Salaam waterfront',
        sections: sections([
          [
            'What this crossing is',
            [
              'The usual passenger route is Dar es Salaam to Unguja (Zanzibar Island), arriving at the ferry terminal on Malindi Road in Stone Town. It is a foot-passenger crossing. Cargo and vehicle (Ro-Ro) sailings use different vessels and facilities.',
              'Zanzibar is part of the United Republic of Tanzania. You do not need a second Tanzania visa for the island. You still show a passport at the internal immigration desks at both ports.',
            ],
          ],
          [
            'Who operates it',
            [
              'Azam Marine and Kilimanjaro Fast Ferries are the Bakhresa Group marine companies on this corridor. The fast passenger ships are named Kilimanjaro followed by a number. Azam’s Dar office is on Sokoine Drive, opposite St Joseph’s Cathedral.',
              'Other companies also advertise Dar–Zanzibar sailings. Book with one named operator and confirm that operator’s own date-specific timetable. Do not mix departure times copied from different companies into one plan.',
            ],
          ],
          [
            'How long it takes',
            [
              'Time on the water is commonly about one hour twenty minutes to one hour forty-five minutes on a fast catamaran. Boarding queues, luggage, weather and the shuffle on and off at Malindi make dock-to-dock time longer. Azam asks passengers to report at the terminal well before departure — plan at least an hour.',
              'Sea state is usually calmer in the morning. The last afternoon sailing can be rougher. Operators may change times with weather and season. Confirm on the operator site for your date.',
            ],
          ],
          [
            'Tickets, residency and where to buy',
            [
              'Passenger classes are sold as resident and non-resident, often on separate booking pages and in different currencies. That split is set by the operator, not by Travelar. We do not publish a fare here because it is not our inventory and it changes.',
              'Buy on the operator’s official site or at that operator’s ticket office. Walk past touts on the harbour approach and keep your bags with you. Late check-in is commonly treated as a missed sailing with no refund. Read the operator’s change and cancellation rules before you pay.',
            ],
          ],
          [
            'Documents and connections',
            [
              'Carry the same passport you used to enter Tanzania. If Zanzibar is your first point of entry into the country, immigration there is your entry. If you already entered on the mainland, the ferry desk is an internal check, not a second visa.',
              'Julius Nyerere International Airport (DAR) is a city transfer away from Sokoine Drive. Abeid Amani Karume International Airport (ZNZ) is outside Stone Town. If you are connecting to a flight, do not treat the timetable crossing time as the whole journey.',
            ],
          ],
        ]),
      },
      sw: {
        title: 'Jinsi ya kusafiri kwa feri kutoka Dar es Salaam hadi Zanzibar',
        excerpt:
          'Wanaoendesha kivuko, mahali pa kupanda, ukaguzi wa pasipoti, tiketi za mkazi na asiye mkazi, na yanayothibitishwa kabla ya safari.',
        cover_alt: 'Feri za abiria kwenye pwani ya Dar es Salaam',
        sections: sections([
          [
            'Kivuko hiki ni nini',
            [
              'Njia ya kawaida ya abiria ni kutoka Dar es Salaam kwenda Unguja, kufika kituoni cha feri Malindi, Mji wa Mawe. Ni kivuko cha watembea kwa miguu. Mizigo na magari hutumia meli na maeneo tofauti.',
              'Zanzibar ni sehemu ya Jamhuri ya Muungano wa Tanzania. Huhitaji viza nyingine ya Tanzania kwa kisiwa. Bado unaonyesha pasipoti kwenye madawati ya uhamiaji bandarini pande zote.',
            ],
          ],
          [
            'Nani anaendesha',
            [
              'Azam Marine na Kilimanjaro Fast Ferries ni kampuni za bahari za Bakhresa kwenye njia hii. Meli za kasi huitwa Kilimanjaro na namba. Ofisi ya Azam Dar iko Sokoine Drive, kinyume na Kanisa Kuu la St Joseph.',
              'Kampuni nyingine pia hutangaza safari Dar–Zanzibar. Nunua kwa mwendeshaji mmoja na thibitisha ratiba yake ya tarehe husika. Usichanganye masaa ya kampuni tofauti.',
            ],
          ],
          [
            'Inachukua muda gani',
            [
              'Muda majini kwa kawaida ni kama saa moja na dakika ishirini hadi saa moja na dakika arobaini na tano kwenye catamaran ya kasi. Foleni, mizigo, hali ya hewa na kupanda kushuka Malindi hufanya safari kutoka gati hadi gati kuwa ndefu zaidi. Azam huwaomba abiria kufika mapema — panga angalau saa moja.',
              'Bahari mara nyingi ni shwari asubuhi. Safari ya jioni inaweza kuwa na mawimbi. Wakati wa msimu na hali ya hewa unaweza kubadilisha masaa. Thibitisha kwenye tovuti ya mwendeshaji.',
            ],
          ],
          [
            'Tiketi, ukaazi na mahali pa kununua',
            [
              'Madaraja ya abiria huuzwa kama mkazi na asiye mkazi, mara nyingi kwenye kurasa tofauti na sarafu tofauti. Mgawanyo huo ni wa mwendeshaji, si wa Travelar. Hatuandiki nauli hapa kwa sababu si mali yetu ya kuuza na inabadilika.',
              'Nunua kwenye tovuti rasmi au ofisi ya tiketi ya mwendeshaji huyo. Pita mbele ya madalali bandarini na ushike mizigo. Kuchelewa kuingia mara nyingi huchukuliwa kama kukosa meli bila kurejeshewa pesa.',
            ],
          ],
          [
            'Nyaraka na miunganisho',
            [
              'Beba pasipoti ileile uliyotumia kuingia Tanzania. Ikiwa Zanzibar ndiyo lango lako la kwanza nchini, uhamiaji huko ndio kuingia. Ukiwa tayari umeingia bara, dawati la feri ni ukaguzi wa ndani, si viza ya pili.',
              'Uwanja wa Nyerere (DAR) uko mbali na Sokoine Drive kwa usafiri wa mjini. Uwanja wa ZNZ uko nje ya Mji wa Mawe. Ukiunganisha ndege, usitumie muda wa majini kama muda wote wa safari.',
            ],
          ],
        ]),
      },
      fr: {
        title: 'Voyager en ferry de Dar es Salaam à Zanzibar',
        excerpt:
          'Exploitants, embarquement, contrôles de passeport, billets résident et non-résident, et ce qu’il faut confirmer avant de partir.',
        cover_alt: 'Ferries de passagers sur le front de mer de Dar es Salaam',
        sections: sections([
          [
            'Ce qu’est cette traversée',
            [
              'L’itinéraire passagers habituel relie Dar es Salaam à Unguja et arrive au terminal de Malindi, à Stone Town. C’est une traversée à pied. Fret et véhicules utilisent d’autres navires et quais.',
              'Zanzibar fait partie de la République-Unie de Tanzanie. Aucun second visa tanzanien n’est requis pour l’île. Un passeport est toutefois présenté aux postes d’immigration internes des deux ports.',
            ],
          ],
          [
            'Qui l’exploite',
            [
              'Azam Marine et Kilimanjaro Fast Ferries sont les compagnies maritimes du groupe Bakhresa sur ce corridor. Les catamarans rapides portent le nom Kilimanjaro suivi d’un numéro. Le bureau Azam à Dar est sur Sokoine Drive, en face de la cathédrale Saint-Joseph.',
              'D’autres compagnies annoncent aussi des départs Dar–Zanzibar. Réservez auprès d’un exploitant nommé et confirmez son horaire à la date. Ne mélangez pas les heures de compagnies différentes.',
            ],
          ],
          [
            'Durée',
            [
              'Le temps en mer est souvent d’environ une heure vingt à une heure quarante-cinq sur un catamaran rapide. Files, bagages, météo et embarquement à Malindi allongent le trajet quai à quai. Azam demande de se présenter bien avant le départ — prévoyez au moins une heure.',
              'La mer est en général plus calme le matin. Le dernier départ de l’après-midi peut être plus agité. Les horaires bougent avec la saison. Confirmez sur le site de l’exploitant.',
            ],
          ],
          [
            'Billets, résidence et achat',
            [
              'Les classes se vendent en résident et non-résident, souvent sur des pages et dans des devises distinctes. Ce découpage appartient à l’exploitant, pas à Travelar. Nous ne publions pas de tarif ici : ce n’est pas notre inventaire, et il change.',
              'Achetez sur le site officiel ou au guichet de cet exploitant. Ignorez les rabatteurs du port et gardez vos sacs. Un enregistrement tardif est souvent un départ manqué sans remboursement.',
            ],
          ],
          [
            'Documents et correspondances',
            [
              'Emportez le passeport utilisé pour entrer en Tanzanie. Si Zanzibar est votre premier point d’entrée, l’immigration de l’île est votre entrée. Si vous êtes déjà entré sur le continent, le contrôle du ferry est interne, pas un second visa.',
              'L’aéroport Julius Nyerere (DAR) est un transfert urbain depuis Sokoine Drive. L’aéroport de Zanzibar (ZNZ) est hors de Stone Town. Pour une correspondance aérienne, le temps en mer n’est pas tout le trajet.',
            ],
          ],
        ]),
      },
    },
  },
  {
    id: 'e1000000-0000-4000-8000-000000000002',
    slug: 'first-tanzania-safari',
    topic: 'experiences',
    related_mode: 'experiences',
    cover_path: '/guides/first-tanzania-safari.jpg',
    sort_order: 20,
    researched_at: researchedAt,
    source_notes:
      'TANAPA park list and visitor materials; Ngorongoro is NCAA not TANAPA; northern vs southern circuit geography. Park fees and camp rates are not seeded as inventory.',
    locales: {
      en: {
        title: 'Planning your first Tanzania safari',
        excerpt:
          'Northern circuit first, how Serengeti, Ngorongoro and Tarangire differ, and when the south is a better second trip.',
        cover_alt: 'Open savanna used as a safari landscape',
        sections: sections([
          [
            'Start in the north',
            [
              'Most first visits use the northern circuit from Arusha: Tarangire National Park, the Ngorongoro Conservation Area, and Serengeti National Park, sometimes with Lake Manyara. Those parks sit close enough to link by road. Kilimanjaro International Airport (JRO) is the usual air gateway.',
              'Serengeti and Tarangire are Tanzania National Parks (TANAPA). Ngorongoro Crater sits in the Ngorongoro Conservation Area, run by the Ngorongoro Conservation Area Authority (NCAA), not TANAPA. Fees, vehicle rules and crater-floor hours are NCAA rules.',
            ],
          ],
          [
            'What each park is for',
            [
              'Tarangire, about two hours from Arusha, is known for baobabs and dry-season elephant concentrations along the Tarangire River, roughly July to October.',
              'Ngorongoro Crater is a short, dense game drive on a caldera floor, including a chance of black rhino. Groups are usually limited to hours set by NCAA.',
              'The Serengeti is the large open ecosystem (on the order of 14,750 square kilometres). Resident cats stay in the centre (Seronera) year-round. The wildebeest migration moves with the rains: calving on the southern plains around January–February, Mara River crossings in the north roughly July–September. Two full days in the Serengeti is a practical minimum.',
            ],
          ],
          [
            'When to go',
            [
              'June to October is the long dry season: easier roads, Tarangire at its busiest with elephants, peak demand in the north. January–February is a drier window with calving. The long rains are roughly March–May; some camps close. The short rains are around November–December.',
              'High season means more vehicles at sightings. That is the trade for infrastructure and density. It is not a reason to skip the north on a first trip, but it is a reason to avoid packing three parks into three nights.',
            ],
          ],
          [
            'The south and west wait',
            [
              'Nyerere (formerly much of the Selous) and Ruaha are fly-in from Dar es Salaam or a long road. They take far fewer visitors. Walking and boat safari are more common there. Katavi, Mahale and Gombe are specialist western trips. Keep them for a second visit unless solitude is the whole point of this one.',
            ],
          ],
          [
            'How you actually go',
            [
              'A safari is sold by a licensed tour operator, not as an unguided self-drive for first-time visitors. Park conservation fees are charged per person per day by TANAPA or NCAA and change; check the authority, not a blog, for the year you travel. Travelar will list bookable experiences only from contracted suppliers — this page is planning, not a quote.',
            ],
          ],
        ]),
      },
      sw: {
        title: 'Kupanga safari yako ya kwanza Tanzania',
        excerpt:
          'Anza kaskazini, tofauti ya Serengeti, Ngorongoro na Tarangire, na lini kusini inafaa zaidi kama safari ya pili.',
        cover_alt: 'Uwanda wa savana unaotumika kwenye safari ya wanyama',
        sections: sections([
          [
            'Anza kaskazini',
            [
              'Ziara nyingi za kwanza hutumia mzunguko wa kaskazini kutoka Arusha: Tarangire, Eneo la Hifadhi ya Ngorongoro, na Serengeti, mara nyingine na Ziwa Manyara. Hifadhi hizi zinaweza kuunganishwa kwa barabara. Uwanja wa Kilimanjaro (JRO) ndio lango la kawaida la ndege.',
              'Serengeti na Tarangire ni hifadhi za TANAPA. Korongo la Ngorongoro liko chini ya NCAA, si TANAPA. Ada, magari na saa za sakafu ya korongo ni kanuni za NCAA.',
            ],
          ],
          [
            'Kila hifadhi inafaa nini',
            [
              'Tarangire, kama saa mbili kutoka Arusha, inajulikana kwa mibuyu na makundi ya tembo msimu wa kiangazi kando ya mto, takriban Julai hadi Oktoba.',
              'Korongo la Ngorongoro ni mzunguko mfupi wenye wanyama wengi, ikiwemo nafasi ya faru weusi. Saa huwekwa na NCAA.',
              'Serengeti ni ekosistimu kubwa. Simba na chui hukaa Seronera mwaka mzima. Uhamaji wa nyumbu hufuata mvua: kuzaliana kusini Januari–Februari, kuvuka mto Mara kaskazini takriban Julai–Septemba. Siku mbili kamili Serengeti ni kiwango cha chini chenye maana.',
            ],
          ],
          [
            'Wakati wa kwenda',
            [
              'Juni hadi Oktoba ni kiangazi kirefu: barabara rahisi, Tarangire ina tembo wengi, mahitaji makubwa kaskazini. Januari–Februari ni dirisha kavu la kuzaliana. Mvua ndefu ni takriban Machi–Mei; kambi nyingine hufunga. Mvua fupi ni karibu Novemba–Desemba.',
            ],
          ],
          [
            'Kusini na magharibi ngoja',
            [
              'Nyerere na Ruaha hufikiwa kwa ndege kutoka Dar au barabara ndefu. Wageni ni wachache. Safari ya miguu na mashua ni za kawaida. Katavi, Mahale na Gombe ni safari maalum. Ziweke kwa ziara ya pili isipokuwa upweke ndio lengo.',
            ],
          ],
          [
            'Jinsi unavyoenda',
            [
              'Safari huuzwa na mwendeshaji aliye na leseni, si kuendesha peke yako kwa mgeni wa kwanza. Ada za hifadhi hutozwa kwa mtu kwa siku na TANAPA au NCAA na hubadilika; angalia mamlaka, si blogu. Ukurasa huu ni mipango, si bei.',
            ],
          ],
        ]),
      },
      fr: {
        title: 'Préparer votre premier safari en Tanzanie',
        excerpt:
          'Circuit nord d’abord, différences Serengeti, Ngorongoro et Tarangire, et quand le sud convient mieux en second voyage.',
        cover_alt: 'Savane ouverte typique d’un safari',
        sections: sections([
          [
            'Commencer au nord',
            [
              'La plupart des premiers séjours partent d’Arusha : Tarangire, l’aire de conservation du Ngorongoro et le Serengeti, parfois Manyara. Ces parcs se relient par la route. L’aéroport du Kilimandjaro (JRO) est la porte d’entrée habituelle.',
              'Serengeti et Tarangire relèvent de TANAPA. Le cratère du Ngorongoro est géré par la NCAA, pas TANAPA. Droits, règles véhicules et horaires du fond du cratère sont ceux de la NCAA.',
            ],
          ],
          [
            'À quoi sert chaque parc',
            [
              'Tarangire, à environ deux heures d’Arusha, est connu pour ses baobabs et les éléphants en saison sèche le long de la rivière, grosso modo de juillet à octobre.',
              'Le cratère du Ngorongoro est une journée dense, y compris une chance de rhino noir. Les horaires sont fixés par la NCAA.',
              'Le Serengeti est le grand écosystème. Les félins résidents restent à Seronera toute l’année. La migration suit les pluies : mises bas au sud vers janvier–février, traversées de la Mara au nord vers juillet–septembre. Deux journées pleines dans le Serengeti sont un minimum utile.',
            ],
          ],
          [
            'Quand partir',
            [
              'Juin à octobre : saison sèche longue, routes plus faciles, Tarangire très fréquenté pour les éléphants, forte demande au nord. Janvier–février est une fenêtre plus sèche avec les naissances. Les grandes pluies tombent vers mars–mai ; certains camps ferment.',
            ],
          ],
          [
            'Le sud et l’ouest attendent',
            [
              'Nyerere et Ruaha s’atteignent en avion depuis Dar ou par une longue route. Ils reçoivent beaucoup moins de visiteurs. Marche et bateau y sont plus courants. Katavi, Mahale et Gombe sont des voyages spécialisés. Gardez-les pour une seconde visite, sauf si la solitude est le but.',
            ],
          ],
          [
            'Comment on y va',
            [
              'Un safari se vend via un voyagiste licencié, pas en conduite autonome pour un premier séjour. Les droits de conservation sont par personne et par jour, TANAPA ou NCAA, et changent. Cette page est un guide, pas un devis.',
            ],
          ],
        ]),
      },
    },
  },
  {
    id: 'e1000000-0000-4000-8000-000000000003',
    slug: 'where-to-stay-zanzibar',
    topic: 'stays',
    related_mode: 'stays',
    cover_path: '/guides/where-to-stay-zanzibar.webp',
    sort_order: 30,
    researched_at: researchedAt,
    source_notes:
      'Zanzibar zone geography (Stone Town, Nungwi/Kendwa, Paje/Jambiani, Matemwe/Kiwengwa, east-coast tides, Mnemba). Hotel rates are not inventory.',
    locales: {
      en: {
        title: 'Where to stay in Zanzibar',
        excerpt:
          'Stone Town for the old city, the north for swimming and sunsets, the east for tide and kitesurf — pick the coast that matches the trip.',
        cover_alt: 'Beach and palms on the Zanzibar coast',
        sections: sections([
          [
            'Split the stay',
            [
              'Most trips work as one or two nights in Stone Town plus a beach base. Stone Town is next to the ferry and useful for the first or last night. It is a UNESCO old town of alleys, markets and Forodhani in the evening. It is not a swimming-beach stay. The in-town shore is tidal and small.',
            ],
          ],
          [
            'North: Nungwi and Kendwa',
            [
              'The north tip has the most reliable swimming because the tidal range is smaller than on the east. Sunsets face the water. This is the busiest hotel strip, with dining, dive shops and nightlife. Road time from ZNZ is a bit over an hour. Kendwa is the slightly quieter neighbour of Nungwi.',
            ],
          ],
          [
            'East: Paje, Jambiani and the tide',
            [
              'The east coast has long white sand and a large tidal range. At low tide the sea walks out across flats and seaweed; swimming is mainly at high tide. Check tide times for your dates if daily swimming is the point.',
              'Paje is the kitesurf centre, with schools, a younger evening scene and a wide budget-to-mid range. Jambiani, a short way south, still has village and seaweed farming in view and is quieter. Bwejuu sits in the same east-coast band.',
            ],
          ],
          [
            'North-east and resort strips',
            [
              'Matemwe is quieter, more upmarket, and the usual boat departure for snorkelling at Mnemba Atoll. Kiwengwa holds many larger all-inclusive resorts. Michamvi and Pingwe are more secluded east-coast pockets.',
            ],
          ],
          [
            'How to choose',
            [
              'If you want to swim without watching the tide, start in the north. If you kite, book Paje. If you want Stone Town’s history, stay in town, then move. Travelar stays search will list contracted properties only; this page is the map of zones, not a hotel roster.',
            ],
          ],
        ]),
      },
      sw: {
        title: 'Mahali pa kukaa Zanzibar',
        excerpt:
          'Mji wa Mawe kwa mji mkuu wa kale, kaskazini kwa kuogelea na machweo, mashariki kwa maji ya kujaa na kitesurf.',
        cover_alt: 'Pwani na minazi Zanzibar',
        sections: sections([
          [
            'Gawanya malazi',
            [
              'Safari nyingi hufanya usiku mmoja au viwili Mji wa Mawe kisha pwani. Mji wa Mawe uko karibu na feri. Ni mji wa kale wa UNESCO, si pwani ya kuogelea. Ufuo mjini ni mdogo na wa kujaa.',
            ],
          ],
          [
            'Kaskazini: Nungwi na Kendwa',
            [
              'Ncha ya kaskazini ina kuogelea thabiti zaidi kwa sababu tofauti ya maji ya kujaa ni ndogo kuliko mashariki. Machweo yanaelekea baharini. Hii ndiyo kanda yenye hoteli nyingi. Kutoka ZNZ ni zaidi ya saa moja kwa barabara. Kendwa ni jirani tulivu kidogo ya Nungwi.',
            ],
          ],
          [
            'Mashariki: Paje, Jambiani na maji ya kujaa',
            [
              'Pwani ya mashariki ina mchanga mrefu na tofauti kubwa ya maji. Maji yakipwa bahari hutoka mbali; kuogelea ni hasa maji yakiwa yamejaa. Angalia maji ya kujaa ikiwa kuogelea kila siku ndio lengo.',
              'Paje ni kitovu cha kitesurf. Jambiani kusini kidogo ni tulivu zaidi, bado unaona kijiji na kilimo cha mwani.',
            ],
          ],
          [
            'Kaskazini-mashariki na resort',
            [
              'Matemwe ni tulivu na ndiyo mahali pa kuondokea mashua kwenda Mnemba. Kiwengwa ina resort kubwa za all-inclusive. Michamvi na Pingwe ni visakuo vya mashariki vilivyo faragha zaidi.',
            ],
          ],
          [
            'Jinsi ya kuchagua',
            [
              'Ukipenda kuogelea bila kuangalia maji ya kujaa, anza kaskazini. Ukipenda kite, chagua Paje. Ukipenda historia, kaa mjini kisha hamia. Ukurasa huu ni ramani ya kanda, si orodha ya hoteli.',
            ],
          ],
        ]),
      },
      fr: {
        title: 'Où séjourner à Zanzibar',
        excerpt:
          'Stone Town pour la médina, le nord pour nager et les couchers de soleil, l’est pour la marée et le kitesurf.',
        cover_alt: 'Plage et palmiers sur la côte de Zanzibar',
        sections: sections([
          [
            'Couper le séjour',
            [
              'La plupart des voyages font une ou deux nuits à Stone Town puis une base plage. Stone Town est près du ferry. C’est la médina UNESCO, pas une station balnéaire. Le rivage en ville est petit et soumis à la marée.',
            ],
          ],
          [
            'Nord : Nungwi et Kendwa',
            [
              'La pointe nord offre la baignade la plus régulière, le marnage y étant plus faible qu’à l’est. Les couchers de soleil donnent sur l’eau. C’est la bande hôtelière la plus animée. Comptez un peu plus d’une heure depuis ZNZ. Kendwa est un peu plus calme que Nungwi.',
            ],
          ],
          [
            'Est : Paje, Jambiani et la marée',
            [
              'La côte est a un grand marnage. À marée basse la mer recule sur les platiers ; on nage surtout à marée haute. Vérifiez les marées si vous voulez nager chaque jour.',
              'Paje est la capitale du kitesurf. Jambiani, un peu au sud, reste plus villageoise et plus calme.',
            ],
          ],
          [
            'Nord-est et grandes résidences',
            [
              'Matemwe est plus calme et le départ habituel des bateaux vers l’atoll de Mnemba. Kiwengwa concentre de grands all-inclusive. Michamvi et Pingwe sont plus isolés.',
            ],
          ],
          [
            'Comment choisir',
            [
              'Pour nager sans surveiller la marée, visez le nord. Pour le kite, Paje. Pour l’histoire, Stone Town puis la plage. Cette page est une carte des zones, pas un catalogue d’hôtels.',
            ],
          ],
        ]),
      },
    },
  },
  {
    id: 'e1000000-0000-4000-8000-000000000004',
    slug: 'climbing-kilimanjaro',
    topic: 'experiences',
    related_mode: 'experiences',
    cover_path: '/guides/climbing-kilimanjaro.jpg',
    sort_order: 40,
    researched_at: researchedAt,
    source_notes:
      'TANAPA Kilimanjaro visitor guide; Mountains National Parks Regulations 2003 (licensed operator, no solo); common route durations Marangu/Machame/Lemosho/Rongai/Umbwe/Northern Circuit; Uhuru Peak 5,895 m. Success-rate marketing is not treated as KINAPA fact.',
    locales: {
      en: {
        title: 'Climbing Kilimanjaro: routes and preparation',
        excerpt:
          'Official routes, why extra days matter, licensed operators only, and what to pack. Uhuru Peak is 5,895 metres.',
        cover_alt: 'High African highland landscape on the approach to Kilimanjaro',
        sections: sections([
          [
            'The mountain and the park',
            [
              'Kilimanjaro National Park is a TANAPA park. Uhuru Peak on Kibo is 5,895 metres. Climbs are trekking routes with camps or huts, not technical alpine climbing on the standard trails. Mawenzi technical climbing is a separate, restricted activity.',
              'You cannot climb alone. Park regulations require a licensed tour operator, registered guides and porters, and registration at the gate. Fees (conservation, camping or hut, rescue) depend on visitor category, route and days. Read the current TANAPA tariff; we do not seed a price.',
            ],
          ],
          [
            'The main routes',
            [
              'Marangu approaches from the south-east, uses huts, and is often sold in five days; a sixth day for acclimatization is the usual advice. You descend the same way.',
              'Machame (south-west) is camping, commonly six or seven days, and includes the climb-high sleep-low profile via Lava Tower (about 4,600 metres) then down to Barranco. Lemosho starts further west (Londorossi), is quieter for the first days, then joins Machame; seven or eight days is normal. Park minimums are shorter than what most operators recommend.',
              'Rongai comes from the north, near the Kenyan border, and is often drier in the rain months. Umbwe is shorter and steeper. The Northern Circuit is the longest traverse. Machame-family routes usually descend via Mweka; Marangu and Rongai usually finish at Marangu Gate.',
            ],
          ],
          [
            'Time on the mountain',
            [
              'Altitude, not distance, is the limiter. Extra days raise the chance of a safe summit more than fitness gadgets do. Dry-season windows used by most climbers are roughly June–October and January to early March. Rain still happens. Fly into JRO (between Arusha and Moshi), not DAR, unless you have a domestic connection planned.',
            ],
          ],
          [
            'Gear, health and ethics',
            [
              'Broken-in boots, layered clothing to well below freezing on summit night, rain shell, headlamp, and a sleeping system your operator specifies. Operators must supply suitable group gear; you still bring personal kit.',
              'Talk to a clinician about altitude. Diamox is a medical decision, not a packing-list default. Stay on marked trails, pack out rubbish, and treat porters as contracted crew with limits, not unlimited load.',
            ],
          ],
        ]),
      },
      sw: {
        title: 'Kupanda Kilimanjaro: njia na maandalizi',
        excerpt:
          'Njia rasmi, kwa nini siku za ziada ni muhimu, waendeshaji wenye leseni tu, na vifaa. Uhuru Peak ni mita 5,895.',
        cover_alt: 'Mandhari ya nyanda za juu kuelekea Kilimanjaro',
        sections: sections([
          [
            'Mlima na hifadhi',
            [
              'Hifadhi ya Taifa ya Kilimanjaro ni ya TANAPA. Uhuru Peak kwenye Kibo ni mita 5,895. Njia za kawaida ni trekking, si kupanda mwamba. Kupanda Mawenzi ni shughuli tofauti yenye vikwazo.',
              'Huwezi kupanda peke yako. Kanuni zinahitaji mwendeshaji mwenye leseni, viongozi na wapagazi waliosajiliwa, na usajili langoni. Ada zinategemea kundi, njia na siku. Soma bei ya TANAPA ya mwaka; hatuandiki bei hapa.',
            ],
          ],
          [
            'Njia kuu',
            [
              'Marangu inatoka kusini-mashariki, inatumia vibanda, mara nyingi siku tano; siku ya sita inashauriwa. Unashuka njia ileile.',
              'Machame ni kambi, siku sita au saba, inapanda Lava Tower kisha kushuka Barranco. Lemosho inaanza magharibi, siku saba au nane, kisha inaungana na Machame. Rongai inatoka kaskazini na huwa kavu zaidi mvua inaponyesha. Umbwe ni fupi na mwinuko. Northern Circuit ndiyo ndefu zaidi.',
            ],
          ],
          [
            'Muda mlimani',
            [
              'Urefu, si umbali, ndio kikwazo. Siku za ziada zinasaidia kilele kuliko vifaa vya mazoezi. Dirisha kavu ni takriban Juni–Oktoba na Januari hadi mapema Machi. Tua JRO, si DAR, isipokuwa una ndege ya ndani.',
            ],
          ],
          [
            'Vifaa, afya na maadili',
            [
              'Viatu vilivyovunjwa, mavazi ya tabaka hadi baridi ya usiku wa kilele, koti la mvua, tochi ya kichwa. Ongea na daktari kuhusu urefu. Kaa njiani, toa taka, wapagazi si mzigo usio na kikomo.',
            ],
          ],
        ]),
      },
      fr: {
        title: 'Kilimandjaro : itinéraires et préparation',
        excerpt:
          'Itinéraires officiels, jours supplémentaires, voyagistes licenciés uniquement. Uhuru Peak culmine à 5 895 mètres.',
        cover_alt: 'Hauts plateaux sur l’approche du Kilimandjaro',
        sections: sections([
          [
            'La montagne et le parc',
            [
              'Le parc national du Kilimandjaro relève de TANAPA. Uhuru Peak, sur le Kibo, est à 5 895 mètres. Les voies courantes sont de la randonnée, pas de l’alpinisme. L’ascension technique du Mawenzi est séparée et encadrée.',
              'On ne gravit pas seul. Un voyagiste licencié, des guides et porteurs enregistrés, et une inscription à la porte sont exigés. Les droits dépendent du statut, de la voie et du nombre de jours. Consultez le tarif TANAPA de l’année ; aucun prix n’est semé ici.',
            ],
          ],
          [
            'Les voies principales',
            [
              'Marangu arrive du sud-est, utilise des huttes, souvent en cinq jours ; un sixième jour d’acclimatation est conseillé. La descente se fait par le même chemin.',
              'Machame est en tentes, six ou sept jours, avec le profil monter-haut dormir-bas via la Tour de Lave puis Barranco. Lemosho part plus à l’ouest, sept ou huit jours, puis rejoint Machame. Rongai vient du nord, souvent plus sec sous la pluie. Umbwe est plus court et plus raide. Le Northern Circuit est la plus longue traversée.',
            ],
          ],
          [
            'Le temps sur la montagne',
            [
              'C’est l’altitude, pas la distance, qui limite. Des jours en plus aident plus qu’un gadget de fitness. Fenêtres plus sèches : juin–octobre et janvier à début mars. Atterrissez à JRO, pas à DAR, sauf correspondance intérieure prévue.',
            ],
          ],
          [
            'Matériel, santé et conduite',
            [
              'Chaussures rodées, couches jusqu’au gel de la nuit sommitale, coquille pluie, frontale. Parlez altitude avec un médecin. Restez sur les sentiers, redescendez les déchets, les porteurs ont une charge limitée.',
            ],
          ],
        ]),
      },
    },
  },
  {
    id: 'e1000000-0000-4000-8000-000000000005',
    slug: 'east-africa-journey',
    topic: 'east_africa',
    related_mode: 'flights',
    cover_path: '/guides/east-africa-journey.webp',
    sort_order: 50,
    researched_at: researchedAt,
    source_notes:
      'eac.int partner states (eight); regional gateways NBO DAR JRO ZNZ EBB KGL; visa openness notes that DRC and Somalia are not fully reciprocal. Not a visa advisory.',
    locales: {
      en: {
        title: 'Planning an East Africa journey',
        excerpt:
          'Which airport opens which country, how the EAC eight states sit together, and why a visa rule in one capital is not the rule in the next.',
        cover_alt: 'Airside view typical of an East African international gateway',
        sections: sections([
          [
            'The Community is eight states',
            [
              'The East African Community partner states are Burundi, the Democratic Republic of the Congo, Kenya, Rwanda, Somalia, South Sudan, Tanzania and Uganda. Headquarters sit in Tanzania. Membership is not the same thing as a single tourist visa or identical border practice.',
              'Kenya, Uganda and Rwanda have gone further on ID travel for their own nationals. DRC and Somalia are members whose visa reciprocity with the rest of the bloc is still incomplete. Check the immigration site of each country you enter. This page is not a visa decision.',
            ],
          ],
          [
            'Match the airport to the trip',
            [
              'Nairobi Jomo Kenyatta (NBO) is the region’s busiest long-haul hub. Entebbe (EBB) is Uganda’s scheduled international gateway, a drive from Kampala. Kigali (KGL) is close to the city and the usual air start for Volcanoes National Park (another two to three hours by road).',
              'In Tanzania, JRO sits between Arusha and Moshi for the northern safari and Kilimanjaro. DAR (Julius Nyerere) serves the coast, Zanzibar connections and the southern parks. ZNZ is Unguja. Mombasa (MBA) is Kenya’s coast, not a substitute for NBO on a safari routing.',
            ],
          ],
          [
            'Air versus land between capitals',
            [
              'Short regional flights link NBO with EBB, DAR, KGL and JRO, and DAR with EBB and KGL, among other pairs. Treat those as dated airline schedules, not a Travelar timetable.',
              'Overland, Kenya–Tanzania commonly uses Namanga, Isebania/Sirari or Taveta/Holili. Uganda–Rwanda uses Katuna/Gatuna or Cyanika. Build a full day for a land border the first time; do not stack it against a same-day international departure.',
            ],
          ],
          [
            'Build the itinerary on purpose',
            [
              'A first loop that stays coherent is Kenya (Nairobi or the Mara) plus northern Tanzania (Serengeti/Ngorongoro) plus, if time, Rwanda or Uganda for primates — not all eight states. Yellow-fever and other health rules depend on where you have been, not only where you are going. Confirm with official sources before you buy the second coupon.',
            ],
          ],
        ]),
      },
      sw: {
        title: 'Kupanga safari Afrika Mashariki',
        excerpt:
          'Uwanja gani unafungua nchi gani, nchi nane za EAC, na kwa nini kanuni ya viza ya mji mmoja si ya mji mwingine.',
        cover_alt: 'Mandhari ya uwanja wa ndege wa kimataifa Afrika Mashariki',
        sections: sections([
          [
            'Jumuiya ina nchi nane',
            [
              'Nchi washirika za EAC ni Burundi, DRC, Kenya, Rwanda, Somalia, South Sudan, Tanzania na Uganda. Makao makuu yako Tanzania. Uanachama si viza moja ya watalii.',
              'Kenya, Uganda na Rwanda zimeenda mbali zaidi kwa usafiri wa vitambulisho vya raia wao. DRC na Somalia bado hazijalingana kikamilifu kwenye viza. Angalia tovuti ya uhamiaji ya kila nchi. Ukurasa huu si uamuzi wa viza.',
            ],
          ],
          [
            'Linganisha uwanja na safari',
            [
              'NBO ni kitovu kikubwa. EBB ni lango la Uganda. KGL uko karibu na mji na ndiyo mwanzo wa ndege kwenda Volcanoes. Tanzania: JRO kwa kaskazini na Kilimanjaro; DAR kwa pwani, Zanzibar na hifadhi za kusini; ZNZ ni Unguja.',
            ],
          ],
          [
            'Ndege dhidi ya ardhi',
            [
              'Ndege fupi za kanda zinaunganisha NBO na EBB, DAR, KGL na JRO. Hizo ni ratiba za mashirika, si ratiba ya Travelar. Kenya–Tanzania hutumia Namanga, Sirari au Holili. Uganda–Rwanda hutumia Katuna au Cyanika. Panga siku nzima kwa mpaka wa kwanza.',
            ],
          ],
          [
            'Jenga itinerary kwa makusudi',
            [
              'Mzunguko wa kwanza wenye maana ni Kenya pamoja na kaskazini mwa Tanzania, kisha Rwanda au Uganda ikiwa kuna muda — si nchi zote nane. Homa ya manjano inategemea ulikokotoka. Thibitisha rasmi kabla ya kununua tiketi ya pili.',
            ],
          ],
        ]),
      },
      fr: {
        title: 'Préparer un voyage en Afrique de l’Est',
        excerpt:
          'Quel aéroport ouvre quel pays, les huit États de l’EAC, et pourquoi la règle de visa d’une capitale n’est pas celle de la suivante.',
        cover_alt: 'Vue d’un aéroport international d’Afrique de l’Est',
        sections: sections([
          [
            'Huit États partenaires',
            [
              'Les États partenaires de l’EAC sont le Burundi, la RDC, le Kenya, le Rwanda, la Somalie, le Soudan du Sud, la Tanzanie et l’Ouganda. Le siège est en Tanzanie. L’adhésion n’équivaut pas à un visa touristique unique.',
              'Kenya, Ouganda et Rwanda sont allés plus loin sur les pièces d’identité pour leurs nationaux. La réciprocité visa de la RDC et de la Somalie reste incomplète. Consultez le site d’immigration de chaque pays. Cette page n’est pas un avis de visa.',
            ],
          ],
          [
            'L’aéroport selon le voyage',
            [
              'Nairobi (NBO) est le grand hub. Entebbe (EBB) est la porte ougandaise. Kigali (KGL) est proche de la ville et le départ habituel vers les Volcans. En Tanzanie : JRO pour le nord et le Kilimandjaro, DAR pour la côte, Zanzibar et le sud, ZNZ pour Unguja.',
            ],
          ],
          [
            'Air ou terre',
            [
              'Des vols régionaux relient NBO à EBB, DAR, KGL et JRO. Ce sont des horaires de compagnies, pas un tableau Travelar. Kenya–Tanzanie : Namanga, Sirari ou Holili. Ouganda–Rwanda : Katuna ou Cyanika. Prévoyez une journée pour un premier poste frontière.',
            ],
          ],
          [
            'Construire l’itinéraire',
            [
              'Une première boucle cohérente : Kenya plus nord tanzanien, puis Rwanda ou Ouganda s’il reste du temps — pas les huit États. La fièvre jaune dépend d’où vous venez. Vérifiez les sources officielles avant le second coupon.',
            ],
          ],
        ]),
      },
    },
  },
  {
    id: 'e1000000-0000-4000-8000-000000000006',
    slug: 'international-stopover',
    topic: 'international',
    related_mode: 'flights',
    cover_path: '/guides/international-stopover.jpg',
    sort_order: 60,
    researched_at: researchedAt,
    source_notes:
      'Hub geography for East Africa long-haul: ADD (Ethiopian), DXB (Emirates), DOH (Qatar), IST (Turkish), plus LHR/AMS/CDG/JNB. Connection versus leaving the airport. Not a schedule.',
    locales: {
      en: {
        title: 'Making the most of an international stopover',
        excerpt:
          'Which hubs actually feed East Africa, when a layover is only a connection, and when leaving the airport needs a visa and a longer gap.',
        cover_alt: 'Wide-body aircraft at an international hub',
        sections: sections([
          [
            'Hubs that feed this region',
            [
              'Long-haul into East Africa commonly connects in Addis Ababa (ADD, Ethiopian Airlines), Dubai (DXB, Emirates), Doha (DOH, Qatar Airways) or Istanbul (IST, Turkish Airlines). European gateways such as London Heathrow, Amsterdam and Paris still matter on Kenya Airways, KLM, Air France and British Airways. Johannesburg (JNB) is the southern pivot.',
              'Qatar and others also sell Kilimanjaro (JRO) as well as Nairobi and Dar, which can save a domestic hop if northern Tanzania is the destination. Those are airline commercial choices. Search live offers; do not treat this list as a flight.',
            ],
          ],
          [
            'Connection versus stopover',
            [
              'A connection is bags through-checked, one ticket, you stay airside, and the minimum connection time is set by the airport and the airline. If the inbound is late, protection is the operating carrier’s problem on a single ticket. Two cheap one-way tickets on different carriers is two journeys: a miss is your rebooking.',
              'A stopover is leaving the airport, often overnight. That can need a transit or visitor visa even if you never claimed baggage on a pure connection. Istanbul’s city programme, Doha and Dubai hotel desks, and Addis day rooms are products of those airports and airlines, with their own hour windows. Read the current rule, not a screenshot from last year.',
            ],
          ],
          [
            'Leave room',
            [
              'Do not plan a same-evening safari departure after a long-haul that lands at 14:00 with a visa queue. Build a night in Nairobi, Dar, Arusha or Stone Town. If you do leave the hub city, count immigration, a real transfer, and a return that still meets check-in — three hours is not a city tour.',
              'Night arrivals into ADD, DXB, DOH or IST are normal. If you need a bed, book it before you fly. Travelar flight results show timed itineraries from the GDS; this page explains how to read a layover, not which flight to buy.',
            ],
          ],
        ]),
      },
      sw: {
        title: 'Tumia vyema kituo cha safari ya kimataifa',
        excerpt:
          'Vituo gani vinaingiza Afrika Mashariki, lini layover ni muunganisho tu, na lini kutoka uwanjani kunahitaji viza na muda mrefu.',
        cover_alt: 'Ndege kubwa kwenye kituo cha kimataifa',
        sections: sections([
          [
            'Vituo vinavyolisha kanda',
            [
              'Safari ndefu huunganisha Addis Ababa (ADD), Dubai (DXB), Doha (DOH) au Istanbul (IST). Lango za Ulaya kama LHR, AMS na CDG bado ni muhimu. Johannesburg (JNB) ni kiungo cha kusini. Baadhi ya mashirika huuza JRO moja kwa moja. Tafuta ofa hai; orodha hii si ndege.',
            ],
          ],
          [
            'Muunganisho dhidi ya kituo',
            [
              'Muunganisho ni mizigo imeandikwa hadi mwisho, tiketi moja, unakaa ndani ya uwanja. Tiketi mbili za bei nafuu za mashirika tofauti ni safari mbili: ukikosa, unanunua tena. Kituo ni kutoka nje, mara nyingi usiku. Hilo linaweza kuhitaji viza hata kama muunganisho usio na mizigo hauhitaji.',
            ],
          ],
          [
            'Acha nafasi',
            [
              'Usipange safari ya wanyama jioni ileile baada ya ndege ndefu inayofika saa nane na foleni ya viza. Panga usiku Nairobi, Dar, Arusha au Mji wa Mawe. Matokeo ya ndege ya Travelar yanaonyesha ratiba kutoka GDS; ukurasa huu unaeleza layover, si ndege ya kununua.',
            ],
          ],
        ]),
      },
      fr: {
        title: 'Profiter d’une escale internationale',
        excerpt:
          'Quels hubs desservent l’Afrique de l’Est, quand une correspondance reste côté pistes, et quand sortir de l’aéroport exige un visa et plus de temps.',
        cover_alt: 'Gros-porteur dans un hub international',
        sections: sections([
          [
            'Hubs vers la région',
            [
              'Le long-courrier vers l’Afrique de l’Est correspond souvent à Addis-Abeba (ADD), Dubaï (DXB), Doha (DOH) ou Istanbul (IST). Londres-Heathrow, Amsterdam et Paris restent des portes européennes. Johannesburg (JNB) est le pivot sud. Certaines compagnies vendent aussi JRO. Cherchez des offres en direct ; cette liste n’est pas un vol.',
            ],
          ],
          [
            'Correspondance ou escale',
            [
              'Une correspondance, c’est bagages enregistrés jusqu’au bout, un billet, côté pistes. Deux aller simples bon marché sur deux compagnies, ce sont deux voyages : un manqué se rachète. Une escale, c’est sortir, souvent la nuit. Un visa peut alors être exigé même si une correspondance pure n’en demandait pas.',
            ],
          ],
          [
            'Laisser de la marge',
            [
              'Ne prévoyez pas un safari le soir même après un long-courrier à 14 h et une file de visa. Gardez une nuit à Nairobi, Dar, Arusha ou Stone Town. Les résultats vols Travelar montrent des horaires GDS ; cette page explique une escale, pas quel billet acheter.',
            ],
          ],
        ]),
      },
    },
  },
];
