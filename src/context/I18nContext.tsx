import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

export type Language = 'en' | 'sw' | 'fr';

const STORAGE_KEY = 'travelar_lang';

type TranslationKey =
  | 'dashboard'
  | 'overview'
  | 'profile'
  | 'allBookings'
  | 'busBookings'
  | 'ferryBookings'
  | 'flightBookings'
  | 'trainBookings'
  | 'stayBookings'
  | 'experienceBookings'
  | 'settings'
  | 'signOut'
  | 'welcomeBack'
  | 'upcomingTrips'
  | 'completedTrips'
  | 'totalSpent'
  | 'travelModes'
  | 'tripHistory'
  | 'nextTrip'
  | 'noTripsCategory'
  | 'bookNextTrip'
  | 'all'
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'trip'
  | 'trips'
  | 'passenger'
  | 'passengers'
  | 'ref'
  | 'daysAway'
  | 'dayAway'
  | 'today'
  | 'name'
  | 'email'
  | 'signInMethod'
  | 'emailPassword'
  | 'google'
  | 'apple'
  | 'quickActions'
  | 'manageBooking'
  | 'searchNewTrips'
  | 'bus'
  | 'ferry'
  | 'flights'
  | 'train'
  | 'stays'
  | 'experiences'
  | 'bookings'
  | 'recentBookings'
  | 'viewAll'
  | 'language'
  | 'english'
  | 'swahili'
  | 'french'
  | 'loadingAccount'
  | 'operatorDashboard'
  | 'selectOperator'
  | 'schedules'
  | 'fleet'
  | 'manifest'
  | 'revenue'
  | 'totalBookings'
  | 'confirmedBookings'
  | 'pendingBookings'
  | 'cancelledBookings'
  | 'totalRevenue'
  | 'activeTrips'
  | 'activeSailings'
  | 'availableSeats'
  | 'totalCapacity'
  | 'capacityUtil'
  | 'vessel'
  | 'vesselName'
  | 'departurePort'
  | 'arrivalPort'
  | 'departureTime'
  | 'arrivalTime'
  | 'busModel'
  | 'registrationNo'
  | 'busClass'
  | 'route'
  | 'date'
  | 'customer'
  | 'phone'
  | 'amount'
  | 'status'
  | 'confirmed'
  | 'pending'
  | 'refunded'
  | 'noBookings'
  | 'noSchedules'
  | 'operatorPortal'
  | 'busOperators'
  | 'ferryOperators'
  | 'searchOperator'
  | 'mgmtConsole'
  | 'fleetManagement'
  | 'vesselManagement'
  | 'scheduleManagement'
  | 'bookingManagement'
  | 'analytics'
  | 'addTrip'
  | 'addSailing'
  | 'addVehicle'
  | 'addVessel'
  | 'editSchedule'
  | 'vehicleStatus'
  | 'vesselStatus'
  | 'lastService'
  | 'lastInspection'
  | 'mileage'
  | 'yearBuilt'
  | 'assignedTo'
  | 'unassigned'
  | 'active'
  | 'maintenance'
  | 'retired'
  | 'dryDock'
  | 'scheduled'
  | 'boarding'
  | 'departed'
  | 'completed'
  | 'bookedSeats'
  | 'totalSeats'
  | 'seatNumbers'
  | 'classBooked'
  | 'bookedAt'
  | 'revenueTrend'
  | 'dailyRevenue'
  | 'last14Days'
  | 'backToSite'
  | 'mgmtOverview'
  | 'totalVehicles'
  | 'totalVessels'
  | 'activeVehicles'
  | 'inMaintenance'
  | 'occupancyRate'
  | 'avgFare'
  | 'confirmAction'
  | 'cancelBooking'
  | 'refundBooking'
  | 'viewDetails'
  | 'searchBookings'
  | 'allStatuses'
  | 'noVehicles'
  | 'noVessels'
  | 'operations'
  | 'savedTrips'
  | 'paymentMethods'
  | 'promoCodes'
  | 'goodMorning'
  | 'goodAfternoon'
  | 'goodEvening';

type TranslationMap = Record<TranslationKey, string>;

const _PUBLIC_KEYS = [
  'languageLabel', 'languageEnglish', 'languageSwahili', 'languageFrench',
  'home', 'help', 'manageBooking', 'dashboard', 'busConsole', 'ferryConsole',
  'signIn', 'signOut', 'toggleMenu', 'footerDescription', 'aboutTravelar',
  'contactUs', 'helpCenter', 'explore', 'customerSupport', 'partners',
  'becomeTransportOperator', 'apiEnquiries', 'legal', 'cancellationRefundPolicy',
  'termsConditions', 'privacyPolicy', 'cookiePolicy', 'operatedBy',
  'paymentMethodsAvailable',
  'whereToNext', 'findYourWay',
  'popularWaysToGo', 'search', 'fromPublishedFare', 'subjectToAvailability',
  'exploreDestinations', 'all', 'tanzania', 'theWorld',
  'bookable', 'comingSoon', 'planBetterTrip',
  'growTravelBusiness', 'partnerDescription', 'becomePartner',
  'flights', 'bus', 'ferry', 'trains', 'stays', 'experiences',
  'oneWay', 'return', 'multiCity', 'departure', 'destination', 'originAirport',
  'destinationAirport', 'departurePort', 'arrivalPort', 'departureStation',
  'arrivalStation', 'chooseCity', 'searchLocation', 'airportOrCity',
  'selectDate', 'departureDate', 'returnDate', 'checkIn', 'checkOut',
  'selectCheckIn', 'selectCheckOut', 'selectReturnDate', 'residency',
  'resident', 'nonResident', 'cabinClass', 'economy', 'premiumEconomy',
  'business', 'firstClass', 'addFlightLeg', 'removeLastLeg', 'adults',
  'children', 'infants', 'rooms', 'age12Plus', 'age2to11', 'under2',
  'travelersLabel', 'travelerSingular', 'travelerPlural',
  'roomSingular', 'roomPlural', 'done',
  'searchTrips', 'searchStays', 'searchExperiences', 'noMatchesFound',
  'clearSelection', 'previousMonth', 'nextMonth', 'january', 'february',
  'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'sun', 'mon', 'tue', 'wed', 'thu',
  'fri', 'sat', 'destinationRegions',
  'from', 'to', 'ferryFastCatamaran', 'busDepartures', 'beachfrontPoolVillas',
  'ferryGuideTitle', 'ferryGuideExcerpt', 'safariGuideTitle', 'safariGuideExcerpt',
  'staysGuideTitle', 'staysGuideExcerpt', 'kilimanjaroGuideTitle', 'kilimanjaroGuideExcerpt',
  'eastAfricaGuideTitle', 'eastAfricaGuideExcerpt', 'stopoverGuideTitle', 'stopoverGuideExcerpt',
  'originRequired', 'destinationRequired', 'departureDateRequired', 'checkOutRequired',
  'checkOutAfterCheckIn', 'returnDateRequired', 'returnDateAfterDeparture',
  'atLeastOneTraveller', 'flightLegDeparture', 'flightLegDestination', 'flightLegDate',
  'pleaseSelectDepartureAirport', 'pleaseSelectDestinationAirport', 'destinationDifferent',
  'pleaseSelectDate', 'destinationOrActivityRequired', 'destinationMustDifferOrigin',
  'decrease', 'increase',
  'backToHome', 'contentComingSoon',
  'eastAfrica', 'international', 'dealFerryTitle', 'dealBusTitle', 'dealStayTitle',
  'checkoutBack', 'checkoutTitle', 'checkoutIntro', 'checkoutPaymentMethod',
  'checkoutChoosePayment', 'checkoutMobileMoney', 'checkoutPayWithWallet',
  'checkoutCardPayment', 'checkoutCardLabel', 'checkoutCreditDebit',
  'checkoutMobileMoneyProvider', 'checkoutPhoneNumber', 'checkoutNameOnCard',
  'checkoutCardholderPlaceholder', 'checkoutCardNumber', 'checkoutExpiryDate',
  'checkoutCouponTitle', 'checkoutPromoHint', 'checkoutCouponPlaceholder',
  'checkoutApply', 'checkoutCouponApplied', 'checkoutTenPercentDiscount',
  'checkoutInvalidCoupon', 'checkoutBreakdown',
  'checkoutPassengers',
  'checkoutProcessingFee', 'checkoutTotal', 'checkoutSecurePayment', 'checkoutPaymentFailed',
  'checkoutPaymentConfirmed', 'checkoutRedirectingTicket', 'checkoutPay',
  'checkoutTryAgain', 'checkoutTicketAfterPayment', 'checkoutNoBooking',
  'checkoutPaymentDeclined', 'checkoutAwaitingBank', 'checkoutConnecting',
  'checkoutAwaitingConfirmation', 'checkoutProcessingPayment',
  'checkoutVerifyingPayment', 'checkoutSendingPayment',
  'checkoutCardPaymentAria', 'checkoutDemoNotice', 'checkoutSimulateRequest',
  'checkoutDemoResult', 'checkoutQuoteUnavailable', 'checkoutPhoneRequired',
  'checkoutDemoProcessing', 'checkoutDemoFlow', 'checkoutCardHostedNotice',
  'checkoutDemoTicketStarting',
  'ticketNoBooking', 'ticketBookingConfirmed', 'ticketPrinting',
  'ticketPaymentConfirmed', 'ticketSentTo', 'ticketPrinterName',
  'ticketConfirmingPayment', 'ticketReady', 'ticketPassengers',
  'ticketPassenger', 'ticketTotalPaid', 'ticketPresentAtBoarding',
  'ticketDemoTitle', 'ticketDemoNotice', 'ticketDemoAmount',
  'ticketDemoPreparing', 'ticketDemoPrinted', 'ticketDemoQrNotice',
  'ticketThankYou', 'ticketPreparing', 'ticketDownload', 'ticketPrint',
  'ticketBookAnother', 'ticketKeepReference', 'ticketDownloadUnavailable',
  'ticketDownloadFailed', 'ticketOperator', 'ticketRoute', 'ticketDate',
  'ticketCheckIn', 'ticketCheckOut', 'ticketDeparts', 'ticketArrives',
  'ticketVessel', 'ticketTrain', 'ticketFlight', 'ticketStay', 'ticketRoom', 'ticketBus',
  'ticketExperience', 'ticketClass', 'ticketBoardAt', 'ticketDropAt',
  'ticketQrLabel', 'ticketLabel',
  'ticketReference',
  'ticketPassengerFallback',
  'passengerLabel', 'seatLabel', 'fullNameAsOnId', 'enterFullName',
  'emailLabel',
  'countryCallingCode', 'genderLabel', 'categoryLabel', 'countryOfResidence',
  'identificationLabel', 'requiredLabel', 'optionalField', 'idTypeLabel',
  'selectIdType', 'idNumberLabel', 'enterIdNumber', 'optionalLabel',
  'countryOfIssue', 'selectCountry', 'drivingLicence', 'nationalId',
  'passport', 'voterCard', 'male', 'female', 'adult', 'child',
  'modifySearch', 'findingAvailableBuses', 'unableLoadSearchResults',
  'bookingServiceTryAgain', 'selectTravelDate', 'passengerCount',
  'busCount', 'noTripsForRoute', 'tryDifferentDateRouteBus',
  'nextDay', 'sameDay', 'searchingFlights', 'unableLoadFlights',
  'noFlightsFound', 'tryDifferentDateRoute', 'searchingAccommodations',
  'unableLoadStays', 'allDestinations', 'noPropertiesFound',
  'tryDifferentDestinationDate', 'findingAvailableSailings',
  'unableLoadSailings', 'bookingServiceProblem', 'noSailingsFound',
  'selectSailingClass',
  'searchingTrainServices', 'unableLoadTrains', 'noTrainsFound',
  'searchingExperiences', 'unableLoadExperiences', 'noExperiencesFound',
  'seatSelectionUnavailable', 'seats', 'selectFlight',
  'arrival', 'flightSearch', 'ferrySearch', 'trainSearch',
  'flightCount', 'sailingCount', 'trainServiceCount',
  'propertyCount', 'experienceCount', 'durationLabel',
  'totalPrice', 'refundable', 'nonRefundable', 'nightCount',
  'personSuffix', 'dateCount',
  'morning', 'journey', 'via',
  'availableClasses', 'availableCount', 'perAdult', 'bookButton',
  'adultCount', 'infant',
  'backToResults', 'selectYourSeats', 'selectSeatsForJourney',
  'seatFree', 'seatYours', 'seatTaken', 'front', 'driver',
  'seatOccupied', 'seatSelected', 'seatAvailable', 'farePerPerson',
  'boardingAndDropoff', 'chooseBoardingDropoff', 'boardingPoint',
  'dropOffPoint', 'selectBoardingPoint', 'selectDropOffPoint',
  'loadingSeatMap', 'unableLoadTrip', 'selectedTripMissing',
  'selectClassAndDetails', 'loadingSailingDetails', 'unableLoadSailing',
  'pleaseGoBackTryAgain', 'selectVesselClass', 'noSeatSelectionFerry',
  'ferryPassengerIdNote', 'passengerInformation',
  'enterTravelDocumentDetails', 'continueToReview', 'summary',
  'vessel', 'flightSummary', 'trainLabel', 'trainNoteAutoSeat',
  'reviewYourBooking', 'serviceDetails', 'boardingSection',
  'sailingDetails', 'passengersCount', 'proceedToCheckout',
  'fareRevalidationNote', 'classCapacityRevalidationNote',
  'editButton', 'preparingBookingReview', 'unableLoadBookingReview',
  'classNotSelected', 'classNotFound', 'propertyNotFound',
  'roomNotFound', 'experienceNotFound', 'fareSummary',
  'flightDetails', 'flightReservationNote', 'baseFare',
  'taxesAndFees', 'included', 'aircraft', 'guestInformation',
  'priceSummary', 'nights', 'locationLabel', 'sessionLabel',
  'meetingPoint', 'experienceDetails', 'participantInformation',
  'participants', 'reviewStay',
  'passengerJourney', 'fullServiceRoute', 'bookingReview',
  'flightBookingReview', 'ferryBookingReview', 'trainBookingReview',
  'requiredField',
  'noteLabel',
  'loadingStayDetails', 'availableRooms', 'maxOccupancy',
  'roomAvailable', 'perNight', 'selected', 'yourStay', 'guests',
  'selectRoom', 'stayDuration',
  'selectDateAndSession', 'availableDates', 'availableSessions',
  'bookingSummary', 'pricePerPerson', 'cancellationLabel',
  'nightSingular', 'roomSingular',
  'signInTitle', 'signInWelcome', 'passwordLabel', 'enterPassword',
  'signingIn', 'dontHaveAccount', 'createOne', 'manageBookingNoAccount',
  'createAccountTitle', 'registerIntro', 'fullNameLabel',
  'enterFullNamePlaceholder', 'confirmPasswordLabel', 'atLeastSixChars',
  'reenterPassword', 'creatingAccount', 'alreadyHaveAccount',
  'pleaseEnterEmailAndPassword', 'requiredFields', 'passwordsDoNotMatch',
  'passwordMinLength', 'manageBookingTitle', 'manageBookingDescription',
  'bookingReferenceLabel', 'emailUsedForBooking', 'findBooking',
  'searchingBooking', 'pleaseEnterBookingReference', 'pleaseEnterBookingEmail',
  'noBookingFound', 'checkBookingReferenceAgain', 'bookingReferencePrivacy',
  'signInToAccount',
  'searchingOptions', 'tryAgain',
  'orContinueWith', 'continueWithProvider', 'connectingToProvider',
  'loadingTrainDetails',
  'bookBus',
  'seatSelectionError', 'selectSeatsForDetails', 'pricesIn',
  'requiredForFerry', 'perAdultResidency', 'flightBookingTitle',
  'selectVesselClassError', 'loadingFlightDetails', 'flightNotFound',
  'trainNotFound',
  'enterPassengerDetails', 'fieldsMarkedRequired',
] as const;

export type PublicTranslationKey = (typeof _PUBLIC_KEYS)[number];
type PublicTranslationMap = Record<PublicTranslationKey, Record<Language, string>>;

const PUBLIC_TRANSLATIONS: PublicTranslationMap = {
  languageLabel: { en: 'Language', sw: 'Lugha', fr: 'Langue' },
  languageEnglish: { en: 'English', sw: 'Kiingereza', fr: 'Anglais' },
  languageSwahili: { en: 'Kiswahili', sw: 'Kiswahili', fr: 'Swahili' },
  languageFrench: { en: 'Français', sw: 'Kifaransa', fr: 'Français' },
  home: { en: 'Home', sw: 'Nyumbani', fr: 'Accueil' },
  help: { en: 'Help', sw: 'Msaada', fr: 'Aide' },
  manageBooking: { en: 'Manage Booking', sw: 'Dhibiti Nafasi', fr: 'Gérer ma réservation' },
  dashboard: { en: 'Dashboard', sw: 'Dashibodi', fr: 'Tableau de bord' },
  busConsole: { en: 'Bus Console', sw: 'Dashibodi ya Basi', fr: 'Espace bus' },
  ferryConsole: { en: 'Ferry Console', sw: 'Dashibodi ya Feri', fr: 'Espace ferry' },
  signIn: { en: 'Sign In', sw: 'Ingia', fr: 'Se connecter' },
  signOut: { en: 'Sign Out', sw: 'Toka', fr: 'Se déconnecter' },
  toggleMenu: { en: 'Toggle menu', sw: 'Fungua au funga menyu', fr: 'Ouvrir ou fermer le menu' },
  footerDescription: {
    en: 'Multimodal travel booking for Tanzania and beyond.',
    sw: 'Uwekaji nafasi wa usafiri wa aina mbalimbali Tanzania na kwingineko.',
    fr: 'Réservez vos voyages en Tanzanie et au-delà, tous modes de transport confondus.',
  },
  aboutTravelar: { en: 'About Travelar', sw: 'Kuhusu Travelar', fr: 'À propos de Travelar' },
  contactUs: { en: 'Contact Us', sw: 'Wasiliana Nasi', fr: 'Contactez-nous' },
  helpCenter: { en: 'Help Center', sw: 'Kituo cha Msaada', fr: 'Centre d’aide' },
  explore: { en: 'Explore', sw: 'Gundua', fr: 'Explorer' },
  customerSupport: { en: 'Customer Support', sw: 'Huduma kwa Wateja', fr: 'Service client' },
  partners: { en: 'Partners', sw: 'Washirika', fr: 'Partenaires' },
  becomeTransportOperator: {
    en: 'Become a Transport Operator',
    sw: 'Jiunge kama Mwendeshaji wa Usafiri',
    fr: 'Devenir opérateur de transport',
  },
  apiEnquiries: { en: 'API and Integration Enquiries', sw: 'Maswali ya API na Muunganisho', fr: 'API et intégrations' },
  legal: { en: 'Legal', sw: 'Kisheria', fr: 'Mentions légales' },
  cancellationRefundPolicy: { en: 'Cancellation and Refund Policy', sw: 'Sera ya Kughairi na Kurejesha Pesa', fr: 'Annulation et remboursement' },
  termsConditions: { en: 'Terms and Conditions', sw: 'Vigezo na Masharti', fr: 'Conditions générales' },
  privacyPolicy: { en: 'Privacy Policy', sw: 'Sera ya Faragha', fr: 'Politique de confidentialité' },
  cookiePolicy: { en: 'Cookie Policy', sw: 'Sera ya Vidakuzi', fr: 'Politique relative aux cookies' },
  operatedBy: { en: 'Operated by OuterBlocks Destinations Limited.', sw: 'Inaendeshwa na OuterBlocks Destinations Limited.', fr: 'Exploité par OuterBlocks Destinations Limited.' },
  paymentMethodsAvailable: { en: 'Payment methods available', sw: 'Njia za malipo zinazopatikana', fr: 'Moyens de paiement disponibles' },
  whereToNext: { en: 'Where to next?', sw: 'Safari inayofuata ni wapi?', fr: 'Où partir ensuite ?' },
  findYourWay: {
    en: 'Find your way by bus, ferry, flight, train, or stay.',
    sw: 'Panga safari kwa basi, feri, ndege, treni au malazi.',
    fr: 'Voyagez en bus, ferry, avion, train ou réservez un hébergement.',
  },
  popularWaysToGo: { en: 'Popular ways to go', sw: 'Safari maarufu', fr: 'Voyages populaires' },
  search: { en: 'Search', sw: 'Tafuta', fr: 'Rechercher' },
  fromPublishedFare: { en: 'From published fare', sw: 'Kuanzia nauli iliyotangazwa', fr: 'À partir du tarif publié' },
  subjectToAvailability: { en: 'Subject to availability', sw: 'Inategemea upatikanaji', fr: 'Sous réserve de disponibilité' },
  exploreDestinations: { en: 'Explore destinations', sw: 'Gundua maeneo', fr: 'Explorer les destinations' },
  all: { en: 'All', sw: 'Yote', fr: 'Tout' },
  tanzania: { en: 'Tanzania', sw: 'Tanzania', fr: 'Tanzanie' },
  theWorld: { en: 'The World', sw: 'Dunia', fr: 'Le monde' },
  bookable: { en: 'Bookable', sw: 'Inapatikana kuweka nafasi', fr: 'Réservable' },
  comingSoon: { en: 'Coming soon', sw: 'Inakuja hivi karibuni', fr: 'Bientôt disponible' },
  planBetterTrip: { en: 'Plan a better trip', sw: 'Panga safari bora', fr: 'Préparez un meilleur voyage' },
  growTravelBusiness: { en: 'Grow your travel business', sw: 'Kuza biashara yako ya usafiri', fr: 'Développez votre activité touristique' },
  partnerDescription: {
    en: 'Are you a bus operator, ferry company, accommodation provider, or experience supplier? Partner with Travelar to reach travellers across Tanzania and beyond.',
    sw: 'Je, unaendesha basi, feri, malazi au shughuli za utalii? Shirikiana na Travelar kuwafikia wasafiri Tanzania na kwingineko.',
    fr: 'Vous gérez une compagnie de bus ou de ferry, un hébergement ou des activités ? Devenez partenaire de Travelar et touchez des voyageurs en Tanzanie et au-delà.',
  },
  becomePartner: { en: 'Become a partner', sw: 'Kuwa mshirika', fr: 'Devenir partenaire' },
  flights: { en: 'Flight', sw: 'Ndege', fr: 'Vol' },
  bus: { en: 'Bus', sw: 'Basi', fr: 'Bus' },
  ferry: { en: 'Ferry', sw: 'Feri', fr: 'Ferry' },
  trains: { en: 'Trains', sw: 'Treni', fr: 'Train' },
  stays: { en: 'Stays', sw: 'Malazi', fr: 'Hébergements' },
  experiences: { en: 'Experiences', sw: 'Matukio', fr: 'Activités' },
  oneWay: { en: 'One-way', sw: 'Kwenda tu', fr: 'Aller simple' },
  return: { en: 'Return', sw: 'Kwenda na kurudi', fr: 'Aller-retour' },
  multiCity: { en: 'Multi-city', sw: 'Miji mingi', fr: 'Multi-destinations' },
  departure: { en: 'Departure', sw: 'Kuondoka', fr: 'Départ' },
  destination: { en: 'Destination', sw: 'Unakoenda', fr: 'Destination' },
  originAirport: { en: 'Origin Airport', sw: 'Uwanja wa Ndege wa Kuanzia', fr: 'Aéroport de départ' },
  destinationAirport: { en: 'Destination Airport', sw: 'Uwanja wa Ndege wa Kufika', fr: 'Aéroport d’arrivée' },
  departurePort: { en: 'Departure Port', sw: 'Bandari ya Kuondokea', fr: 'Port de départ' },
  arrivalPort: { en: 'Arrival Port', sw: 'Bandari ya Kufikia', fr: 'Port d’arrivée' },
  departureStation: { en: 'Departure Station', sw: 'Kituo cha Kuondokea', fr: 'Gare de départ' },
  arrivalStation: { en: 'Arrival Station', sw: 'Kituo cha Kufikia', fr: 'Gare d’arrivée' },
  chooseCity: { en: 'Choose city', sw: 'Chagua jiji', fr: 'Choisir une ville' },
  searchLocation: { en: 'Search location...', sw: 'Tafuta eneo...', fr: 'Rechercher un lieu...' },
  airportOrCity: { en: 'Airport or city', sw: 'Uwanja wa ndege au jiji', fr: 'Aéroport ou ville' },
  selectDate: { en: 'Select date', sw: 'Chagua tarehe', fr: 'Choisir une date' },
  departureDate: { en: 'Departure Date', sw: 'Tarehe ya Kuondoka', fr: 'Date de départ' },
  returnDate: { en: 'Return Date', sw: 'Tarehe ya Kurudi', fr: 'Date de retour' },
  checkIn: { en: 'Check-in', sw: 'Kuingia', fr: 'Arrivée' },
  checkOut: { en: 'Check-out', sw: 'Kutoka', fr: 'Départ' },
  selectCheckIn: { en: 'Select check-in', sw: 'Chagua tarehe ya kuingia', fr: 'Choisir la date d’arrivée' },
  selectCheckOut: { en: 'Select check-out', sw: 'Chagua tarehe ya kutoka', fr: 'Choisir la date de départ' },
  selectReturnDate: { en: 'Select return date', sw: 'Chagua tarehe ya kurudi', fr: 'Choisir la date de retour' },
  residency: { en: 'Residency', sw: 'Makazi', fr: 'Résidence' },
  resident: { en: 'Resident', sw: 'Mkazi', fr: 'Résident' },
  nonResident: { en: 'Non-Resident', sw: 'Asiye Mkazi', fr: 'Non-résident' },
  cabinClass: { en: 'Cabin Class', sw: 'Daraja la Ndege', fr: 'Classe de cabine' },
  economy: { en: 'Economy', sw: 'Uchumi', fr: 'Économique' },
  premiumEconomy: { en: 'Premium Economy', sw: 'Uchumi wa Juu', fr: 'Économique premium' },
  business: { en: 'Business', sw: 'Biashara', fr: 'Affaires' },
  firstClass: { en: 'First Class', sw: 'Daraja la Kwanza', fr: 'Première classe' },
  addFlightLeg: { en: 'Add flight leg', sw: 'Ongeza sehemu ya safari', fr: 'Ajouter une étape' },
  removeLastLeg: { en: 'Remove last leg', sw: 'Ondoa sehemu ya mwisho', fr: 'Supprimer la dernière étape' },
  adults: { en: 'Adults', sw: 'Watu Wazima', fr: 'Adultes' },
  children: { en: 'Children', sw: 'Watoto', fr: 'Enfants' },
  infants: { en: 'Infants', sw: 'Watoto Wachanga', fr: 'Nourrissons' },
  rooms: { en: 'Rooms', sw: 'Vyumba', fr: 'Chambres' },
  travelersLabel: { en: 'Travelers', sw: 'Wasafiri', fr: 'Voyageurs' },
  travelerSingular: { en: 'traveler', sw: 'msafiri', fr: 'voyageur' },
  travelerPlural: { en: 'travelers', sw: 'wasafiri', fr: 'voyageurs' },
  roomPlural: { en: 'rooms', sw: 'vyumba', fr: 'chambres' },
  done: { en: 'Done', sw: 'Tayari', fr: 'Terminé' },
  age12Plus: { en: 'Age 12+', sw: 'Umri 12+', fr: '12 ans et +' },
  age2to11: { en: 'Age 2-11', sw: 'Umri 2-11', fr: '2 à 11 ans' },
  under2: { en: 'Under 2', sw: 'Chini ya miaka 2', fr: 'Moins de 2 ans' },
  searchTrips: { en: 'Search Trips', sw: 'Tafuta Safari', fr: 'Rechercher un voyage' },
  searchStays: { en: 'Search Stays', sw: 'Tafuta Malazi', fr: 'Rechercher un hébergement' },
  searchExperiences: { en: 'Search Experiences', sw: 'Tafuta Matukio', fr: 'Rechercher des activités' },
  noMatchesFound: { en: 'No matches found', sw: 'Hakuna matokeo', fr: 'Aucun résultat' },
  clearSelection: { en: 'Clear selection', sw: 'Futa chaguo', fr: 'Effacer la sélection' },
  previousMonth: { en: 'Previous month', sw: 'Mwezi uliopita', fr: 'Mois précédent' },
  nextMonth: { en: 'Next month', sw: 'Mwezi ujao', fr: 'Mois suivant' },
  january: { en: 'January', sw: 'Januari', fr: 'janvier' },
  february: { en: 'February', sw: 'Februari', fr: 'février' },
  march: { en: 'March', sw: 'Machi', fr: 'mars' },
  april: { en: 'April', sw: 'Aprili', fr: 'avril' },
  may: { en: 'May', sw: 'Mei', fr: 'mai' },
  june: { en: 'June', sw: 'Juni', fr: 'juin' },
  july: { en: 'July', sw: 'Julai', fr: 'juillet' },
  august: { en: 'August', sw: 'Agosti', fr: 'août' },
  september: { en: 'September', sw: 'Septemba', fr: 'septembre' },
  october: { en: 'October', sw: 'Oktoba', fr: 'octobre' },
  november: { en: 'November', sw: 'Novemba', fr: 'novembre' },
  december: { en: 'December', sw: 'Desemba', fr: 'décembre' },
  sun: { en: 'Sun', sw: 'Jumapili', fr: 'Dim' },
  mon: { en: 'Mon', sw: 'Jumatatu', fr: 'Lun' },
  tue: { en: 'Tue', sw: 'Jumanne', fr: 'Mar' },
  wed: { en: 'Wed', sw: 'Jumatano', fr: 'Mer' },
  thu: { en: 'Thu', sw: 'Alhamisi', fr: 'Jeu' },
  fri: { en: 'Fri', sw: 'Ijumaa', fr: 'Ven' },
  sat: { en: 'Sat', sw: 'Jumamosi', fr: 'Sam' },
  destinationRegions: { en: 'Destination regions', sw: 'Maeneo ya safari', fr: 'Régions des destinations' },
  from: { en: 'From', sw: 'Kutoka', fr: 'Départ' },
  to: { en: 'To', sw: 'Kwenda', fr: 'Arrivée' },
  ferryFastCatamaran: { en: 'Ferry · Fast catamaran service', sw: 'Feri · Huduma ya catamaran ya haraka', fr: 'Ferry · Catamaran rapide' },
  busDepartures: { en: 'Bus · Overnight & daytime departures', sw: 'Basi · Safari za usiku na mchana', fr: 'Bus · Départs de jour et de nuit' },
  beachfrontPoolVillas: { en: 'Stays · Beachfront pool villas', sw: 'Malazi · Vila za ufukweni zenye bwawa', fr: 'Hébergements · Villas avec piscine en bord de mer' },
  ferryGuideTitle: { en: 'How to travel from Dar es Salaam to Zanzibar by ferry', sw: 'Jinsi ya kusafiri kwa feri kutoka Dar es Salaam hadi Zanzibar', fr: 'Voyager en ferry de Dar es Salaam à Zanzibar' },
  ferryGuideExcerpt: { en: 'What to know about booking, boarding, and the crossing, including resident and non-resident fares.', sw: 'Mambo ya kujua kuhusu kuweka nafasi, kupanda feri na safari, ikiwemo nauli za wakazi na wasio wakazi.', fr: 'Réservation, embarquement et traversée : découvrez aussi les tarifs résidents et non-résidents.' },
  safariGuideTitle: { en: 'Planning your first Tanzania safari', sw: 'Kupanga safari yako ya kwanza Tanzania', fr: 'Préparer votre premier safari en Tanzanie' },
  safariGuideExcerpt: { en: 'Choose a park and safari style for your first visit to the Serengeti and beyond.', sw: 'Chagua hifadhi na aina ya safari kwa ziara yako ya kwanza Serengeti na maeneo mengine.', fr: 'Choisissez un parc et un type de safari pour découvrir le Serengeti et ses environs.' },
  staysGuideTitle: { en: 'Where to stay in Zanzibar', sw: 'Mahali pa kukaa Zanzibar', fr: 'Où séjourner à Zanzibar' },
  staysGuideExcerpt: { en: 'Compare Stone Town, the east coast, and the north to find the right area for your trip.', sw: 'Linganisha Stone Town, pwani ya mashariki na kaskazini ili kupata eneo linalokufaa.', fr: 'Comparez Stone Town, la côte est et le nord pour choisir le quartier qui vous convient.' },
  kilimanjaroGuideTitle: { en: 'Climbing Kilimanjaro: routes and preparation', sw: 'Kupanda Kilimanjaro: njia na maandalizi', fr: 'Kilimandjaro : itinéraires et préparation' },
  kilimanjaroGuideExcerpt: { en: 'An overview of the main routes, preparation, permits, and essential gear.', sw: 'Muhtasari wa njia kuu, maandalizi, vibali na vifaa muhimu.', fr: 'Aperçu des principaux itinéraires, de la préparation, des permis et de l’équipement.' },
  eastAfricaGuideTitle: { en: 'Planning an East Africa journey', sw: 'Kupanga safari Afrika Mashariki', fr: 'Préparer un voyage en Afrique de l’Est' },
  eastAfricaGuideExcerpt: { en: 'Compare regional routes, airports, and connections for a multi-country itinerary.', sw: 'Linganisha njia za kikanda, viwanja vya ndege na miunganisho ya safari ya nchi nyingi.', fr: 'Comparez les itinéraires, aéroports et correspondances pour voyager dans plusieurs pays.' },
  stopoverGuideTitle: { en: 'Making the most of an international stopover', sw: 'Tumia vyema kituo cha safari ya kimataifa', fr: 'Profiter pleinement d’une escale internationale' },
  stopoverGuideExcerpt: { en: 'Choose a convenient stopover and check onward connections.', sw: 'Chagua kituo kinachofaa na uhakiki miunganisho ya safari inayofuata.', fr: 'Choisissez une escale pratique et vérifiez vos correspondances.' },
  originRequired: { en: 'Please select a departure location', sw: 'Tafadhali chagua eneo la kuondokea', fr: 'Veuillez choisir un lieu de départ' },
  destinationRequired: { en: 'Please select a destination', sw: 'Tafadhali chagua unakoenda', fr: 'Veuillez choisir une destination' },
  departureDateRequired: { en: 'Please select a departure date', sw: 'Tafadhali chagua tarehe ya kuondoka', fr: 'Veuillez choisir une date de départ' },
  checkOutRequired: { en: 'Please select a check-out date', sw: 'Tafadhali chagua tarehe ya kutoka', fr: 'Veuillez choisir une date de départ' },
  checkOutAfterCheckIn: { en: 'Check-out must be after check-in', sw: 'Tarehe ya kutoka lazima iwe baada ya kuingia', fr: 'Le départ doit avoir lieu après la date d’arrivée' },
  returnDateRequired: { en: 'Please select a return date', sw: 'Tafadhali chagua tarehe ya kurudi', fr: 'Veuillez choisir une date de retour' },
  returnDateAfterDeparture: { en: 'Return date must be after departure date', sw: 'Tarehe ya kurudi lazima iwe baada ya tarehe ya kuondoka', fr: 'La date de retour doit être après la date de départ' },
  atLeastOneTraveller: { en: 'At least one adult or child is required', sw: 'Angalau mtu mzima au mtoto mmoja anahitajika', fr: 'Au moins un adulte ou un enfant est requis' },
  flightLegDeparture: { en: 'Flight leg {number}: Departure', sw: 'Sehemu ya safari {number}: Kuondoka', fr: 'Étape {number} : départ' },
  flightLegDestination: { en: 'Flight leg {number}: Destination', sw: 'Sehemu ya safari {number}: Unakoenda', fr: 'Étape {number} : destination' },
  flightLegDate: { en: 'Flight leg {number}: Departure date', sw: 'Sehemu ya safari {number}: Tarehe ya kuondoka', fr: 'Étape {number} : date de départ' },
  pleaseSelectDepartureAirport: { en: 'Please select a departure airport or city', sw: 'Tafadhali chagua uwanja wa ndege au jiji la kuondokea', fr: 'Veuillez choisir un aéroport ou une ville de départ' },
  pleaseSelectDestinationAirport: { en: 'Please select a destination airport or city', sw: 'Tafadhali chagua uwanja wa ndege au jiji la kufika', fr: 'Veuillez choisir un aéroport ou une ville d’arrivée' },
  destinationDifferent: { en: 'Destination must be different from departure', sw: 'Unakoenda lazima pawe tofauti na unapoanzia', fr: 'La destination doit être différente du lieu de départ' },
  pleaseSelectDate: { en: 'Please select a date', sw: 'Tafadhali chagua tarehe', fr: 'Veuillez choisir une date' },
  destinationOrActivityRequired: { en: 'Please select a destination or activity', sw: 'Tafadhali chagua unakoenda au shughuli', fr: 'Veuillez choisir une destination ou une activité' },
  destinationMustDifferOrigin: { en: 'Destination must be different from origin', sw: 'Unakoenda lazima pawe tofauti na unapoanzia', fr: 'La destination doit être différente du lieu de départ' },
  decrease: { en: 'decrease', sw: 'punguza', fr: 'diminuer' },
  increase: { en: 'increase', sw: 'ongeza', fr: 'augmenter' },
  backToHome: { en: 'Back to home', sw: 'Rudi nyumbani', fr: 'Retour à l’accueil' },
  contentComingSoon: { en: 'Content for this page will be available soon.', sw: 'Maudhui ya ukurasa huu yatapatikana hivi karibuni.', fr: 'Le contenu de cette page sera bientôt disponible.' },
  eastAfrica: { en: 'East Africa', sw: 'Afrika Mashariki', fr: 'Afrique de l’Est' },
  international: { en: 'International', sw: 'Kimataifa', fr: 'International' },
  dealFerryTitle: { en: 'Dar es Salaam → Zanzibar', sw: 'Dar es Salaam → Zanzibar', fr: 'Dar es Salaam → Zanzibar' },
  dealBusTitle: { en: 'Dar es Salaam → Arusha', sw: 'Dar es Salaam → Arusha', fr: 'Dar es Salaam → Arusha' },
  dealStayTitle: { en: 'Zanzibar Beach Resort', sw: 'Mapumziko ya Ufukweni Zanzibar', fr: 'Séjour balnéaire à Zanzibar' },
  checkoutBack: { en: 'Back', sw: 'Rudi', fr: 'Retour' },
  checkoutTitle: { en: 'Checkout', sw: 'Malipo', fr: 'Paiement' },
  checkoutIntro: { en: 'Explore the payment steps in demo mode. Payments cannot be accepted here.', sw: 'Angalia hatua za malipo katika hali ya majaribio. Malipo hayawezi kupokelewa hapa.', fr: 'Découvrez les étapes de paiement en mode démo. Aucun paiement ne peut être accepté ici.' },
  checkoutPaymentMethod: { en: 'Payment method', sw: 'Njia ya malipo', fr: 'Moyen de paiement' },
  checkoutChoosePayment: { en: 'Select how you would like to pay.', sw: 'Chagua jinsi unavyotaka kulipa.', fr: 'Choisissez votre mode de paiement.' },
  checkoutMobileMoney: { en: 'Mobile Money', sw: 'Pesa kwa Simu', fr: 'Paiement mobile' },
  checkoutPayWithWallet: { en: 'Pay with your mobile wallet', sw: 'Lipa kwa pochi yako ya simu', fr: 'Payez avec votre portefeuille mobile' },
  checkoutCardPayment: { en: 'Card payment', sw: 'Malipo ya kadi', fr: 'Paiement par carte' },
  checkoutCardLabel: { en: 'Card', sw: 'Kadi', fr: 'Carte' },
  checkoutCreditDebit: { en: 'Credit or debit card', sw: 'Kadi ya mkopo au debit', fr: 'Carte de crédit ou de débit' },
  checkoutMobileMoneyProvider: { en: 'Mobile Money Provider', sw: 'Mtoa Huduma wa Pesa kwa Simu', fr: 'Opérateur de paiement mobile' },
  checkoutPhoneNumber: { en: 'Phone Number', sw: 'Nambari ya Simu', fr: 'Numéro de téléphone' },
  checkoutNameOnCard: { en: 'Name on Card', sw: 'Jina kwenye Kadi', fr: 'Nom sur la carte' },
  checkoutCardholderPlaceholder: { en: 'Enter cardholder name', sw: 'Weka jina la mwenye kadi', fr: 'Saisissez le nom du titulaire' },
  checkoutCardNumber: { en: 'Card Number', sw: 'Nambari ya Kadi', fr: 'Numéro de carte' },
  checkoutExpiryDate: { en: 'Expiry Date', sw: 'Tarehe ya Mwisho wa Matumizi', fr: 'Date d’expiration' },
  checkoutCouponTitle: { en: 'Coupon or discount code', sw: 'Kuponi au msimbo wa punguzo', fr: 'Code promo ou de réduction' },
  checkoutPromoHint: { en: 'Have a promo code? Apply it here.', sw: 'Una msimbo wa ofa? Uweke hapa.', fr: 'Vous avez un code promo ? Saisissez-le ici.' },
  checkoutCouponPlaceholder: { en: 'Enter coupon code', sw: 'Weka msimbo wa kuponi', fr: 'Saisissez le code promo' },
  checkoutApply: { en: 'Apply', sw: 'Tumia', fr: 'Appliquer' },
  checkoutCouponApplied: { en: 'Coupon applied:', sw: 'Kuponi imetumika:', fr: 'Code appliqué :' },
  checkoutTenPercentDiscount: { en: '10% discount', sw: 'Punguzo la 10%', fr: '10 % de réduction' },
  checkoutInvalidCoupon: { en: 'Invalid coupon code', sw: 'Msimbo wa kuponi si sahihi', fr: 'Code promo invalide' },
  checkoutBreakdown: { en: 'Your payment breakdown', sw: 'Muhtasari wa malipo yako', fr: 'Détail de votre paiement' },
  checkoutPassengers: { en: 'Passengers', sw: 'Abiria', fr: 'Passagers' },
  checkoutProcessingFee: { en: 'Processing fee', sw: 'Ada ya uchakataji', fr: 'Frais de traitement' },
  checkoutTotal: { en: 'Total', sw: 'Jumla', fr: 'Total' },
  checkoutSecurePayment: { en: 'Your payment is secured and encrypted', sw: 'Malipo yako ni salama na yamesimbwa kwa siri', fr: 'Votre paiement est sécurisé et chiffré' },
  checkoutPaymentFailed: { en: 'Payment failed', sw: 'Malipo yameshindwa', fr: 'Échec du paiement' },
  checkoutPaymentConfirmed: { en: 'Payment confirmed', sw: 'Malipo yamethibitishwa', fr: 'Paiement confirmé' },
  checkoutRedirectingTicket: { en: 'Redirecting to your ticket...', sw: 'Tunaelekeza kwenye tiketi yako...', fr: 'Redirection vers votre billet…' },
  checkoutPay: { en: 'Pay', sw: 'Lipa', fr: 'Payer' },
  checkoutTryAgain: { en: 'Try again', sw: 'Jaribu tena', fr: 'Réessayer' },
  checkoutTicketAfterPayment: { en: 'Ticket issued only after payment confirmation', sw: 'Tiketi hutolewa baada tu ya malipo kuthibitishwa', fr: 'Le billet est émis après confirmation du paiement' },
  checkoutNoBooking: { en: 'No booking to check out.', sw: 'Hakuna nafasi ya kulipia.', fr: 'Aucune réservation à régler.' },
  checkoutPaymentDeclined: { en: 'Payment was declined. Please try a different payment method.', sw: 'Malipo yamekataliwa. Tafadhali jaribu njia nyingine ya malipo.', fr: 'Le paiement a été refusé. Veuillez essayer un autre moyen de paiement.' },
  checkoutAwaitingBank: { en: 'Awaiting bank', sw: 'Inasubiri benki', fr: 'En attente de la banque' },
  checkoutConnecting: { en: 'Connecting', sw: 'Inaunganisha', fr: 'Connexion en cours' },
  checkoutAwaitingConfirmation: { en: 'Awaiting confirmation...', sw: 'Inasubiri uthibitisho...', fr: 'En attente de confirmation…' },
  checkoutProcessingPayment: { en: 'Processing payment...', sw: 'Inachakata malipo...', fr: 'Traitement du paiement…' },
  checkoutVerifyingPayment: { en: 'Verifying your {method} payment with the provider.', sw: 'Inathibitisha malipo yako ya {method} kwa mtoa huduma.', fr: 'Vérification de votre paiement {method} auprès du prestataire.' },
  checkoutSendingPayment: { en: 'Sending a payment request via {method}.', sw: 'Inatuma ombi la malipo kupitia {method}.', fr: 'Envoi d’une demande de paiement via {method}.' },
  checkoutCardPaymentAria: { en: 'Card Payment', sw: 'Malipo ya Kadi', fr: 'Paiement par carte' },
  checkoutDemoNotice: { en: 'Demo checkout: ClickPesa is not connected. Fares are sample data, not live quotes. No payment will be sent or money charged. Continuing prints a clearly marked demo ticket only.', sw: 'Malipo ya majaribio: ClickPesa haijaunganishwa. Nauli ni data ya mfano, si bei za moja kwa moja. Ombi la malipo halitatumwa wala pesa kukatwa. Ukiendelea, itachapishwa tiketi ya majaribio iliyoainishwa wazi.', fr: 'Paiement de démonstration : ClickPesa n’est pas connecté. Les tarifs sont des exemples, pas des offres en temps réel. Aucun paiement ne sera envoyé ni débité. La suite imprime uniquement un billet de démonstration clairement identifié.' },
  checkoutSimulateRequest: { en: 'Simulate payment request', sw: 'Onyesha ombi la malipo', fr: 'Simuler la demande de paiement' },
  checkoutDemoResult: { en: 'Demo payment flow complete. No request was sent and no money was charged.', sw: 'Mtiririko wa malipo ya majaribio umekamilika. Ombi halikutumwa na pesa hazikukatwa.', fr: 'Simulation de paiement terminée. Aucune demande n’a été envoyée et aucun montant n’a été débité.' },
  checkoutQuoteUnavailable: { en: 'A verified price is unavailable for this selection. Return to the results and choose an available service.', sw: 'Bei iliyothibitishwa haipatikani kwa chaguo hili. Rudi kwenye matokeo na uchague huduma inayopatikana.', fr: 'Aucun prix vérifié n’est disponible pour cette sélection. Revenez aux résultats et choisissez un service disponible.' },
  checkoutPhoneRequired: { en: 'Enter the mobile money number to simulate the request.', sw: 'Weka nambari ya pesa kwa simu ili kuonyesha ombi.', fr: 'Saisissez le numéro de paiement mobile pour simuler la demande.' },
  checkoutDemoProcessing: { en: 'Simulating payment flow (demo only)', sw: 'Inaonyesha mtiririko wa malipo (majaribio tu)', fr: 'Simulation du parcours de paiement (démo uniquement)' },
  checkoutDemoTicketStarting: { en: 'Preparing your demo ticket for printing…', sw: 'Inaandaa tiketi yako ya majaribio kwa uchapishaji…', fr: 'Préparation de votre billet de démonstration pour impression…' },
  checkoutDemoFlow: { en: 'Simulating {method} locally. No request is sent to ClickPesa or a bank.', sw: 'Inaonyesha {method} hapa tu. Ombi halitumwi kwa ClickPesa wala benki.', fr: 'Simulation locale de {method}. Aucune demande n’est envoyée à ClickPesa ni à une banque.' },
  checkoutCardHostedNotice: { en: 'ClickPesa card payments use a hosted checkout. Card details are not collected here, and the hosted checkout is unavailable until the provider is connected.', sw: 'Malipo ya kadi ya ClickPesa hutumia ukurasa salama wa malipo. Maelezo ya kadi hayaingizwi hapa, na ukurasa huo hautapatikana hadi mtoa huduma aunganishwe.', fr: 'Les paiements par carte ClickPesa utilisent une page de paiement hébergée. Les données de carte ne sont pas collectées ici ; cette page sera disponible lorsque le prestataire sera connecté.' },
  ticketNoBooking: { en: 'No confirmed booking found.', sw: 'Hakuna nafasi iliyothibitishwa.', fr: 'Aucune réservation confirmée.' },
  ticketBookingConfirmed: { en: 'Booking Confirmed', sw: 'Nafasi Imethibitishwa', fr: 'Réservation confirmée' },
  ticketDemoTitle: { en: 'Demo ticket simulation', sw: 'Uigaji wa tiketi ya majaribio', fr: 'Simulation de billet' },
  ticketDemoNotice: { en: 'DEMO ONLY · NOT A REAL BOOKING · NOT VALID FOR TRAVEL · NO PAYMENT WAS TAKEN', sw: 'MAJARIBIO TU · SI NAFASI HALISI · HAIRUHUSIWI KWA SAFARI · HAKUNA MALIPO YALIYOFANYIKA', fr: 'DÉMO UNIQUEMENT · PAS UNE VRAIE RÉSERVATION · NON VALABLE POUR VOYAGER · AUCUN PAIEMENT EFFECTUÉ' },
  ticketDemoAmount: { en: 'DEMO AMOUNT · NOT PAID', sw: 'KIASI CHA MAJARIBIO · HAKIJALIPWA', fr: 'MONTANT DE DÉMO · NON PAYÉ' },
  ticketDemoPreparing: { en: 'Preparing demo print', sw: 'Inaandaa uchapishaji wa majaribio', fr: 'Préparation de l’impression de démonstration' },
  ticketDemoPrinted: { en: 'Demo ticket printed', sw: 'Tiketi ya majaribio imechapishwa', fr: 'Billet de démonstration imprimé' },
  ticketDemoQrNotice: { en: 'Demo code only · Not valid for boarding', sw: 'Msimbo wa majaribio tu · Hautumiki kupanda', fr: 'Code de démonstration uniquement · Non valable pour l’embarquement' },
  ticketPrinting: { en: 'Printing your ticket', sw: 'Inachapisha tiketi yako', fr: 'Impression de votre billet' },
  ticketPaymentConfirmed: { en: 'Payment confirmed', sw: 'Malipo yamethibitishwa', fr: 'Paiement confirmé' },
  ticketSentTo: { en: 'Sent to', sw: 'Imetumwa kwa', fr: 'Envoyé à' },
  ticketPrinterName: { en: 'Travelar thermal printer', sw: 'Printa ya joto ya Travelar', fr: 'Imprimante thermique Travelar' },
  ticketConfirmingPayment: { en: 'Confirming payment', sw: 'Inathibitisha malipo', fr: 'Confirmation du paiement' },
  ticketReady: { en: 'Ticket ready', sw: 'Tiketi iko tayari', fr: 'Billet prêt' },
  ticketPassengers: { en: 'PASSENGERS', sw: 'ABIRIA', fr: 'PASSAGERS' },
  ticketPassenger: { en: 'PASSENGER', sw: 'ABIRIA', fr: 'PASSAGER' },
  ticketTotalPaid: { en: 'TOTAL PAID', sw: 'JUMLA ILIYOLIPWA', fr: 'TOTAL PAYÉ' },
  ticketPresentAtBoarding: { en: 'Present this ticket at boarding.', sw: 'Onyesha tiketi hii unapopanda.', fr: 'Présentez ce billet à l’embarquement.' },
  ticketThankYou: { en: 'Asante · Thank you', sw: 'Asante', fr: 'Merci' },
  ticketPreparing: { en: 'Preparing ticket...', sw: 'Inaandaa tiketi...', fr: 'Préparation du billet…' },
  ticketDownload: { en: 'Download ticket', sw: 'Pakua tiketi', fr: 'Télécharger le billet' },
  ticketPrint: { en: 'Print ticket', sw: 'Chapisha tiketi', fr: 'Imprimer le billet' },
  ticketBookAnother: { en: 'Book another trip', sw: 'Weka nafasi ya safari nyingine', fr: 'Réserver un autre voyage' },
  ticketKeepReference: { en: 'Keep your booking reference available and present this ticket when boarding.', sw: 'Hifadhi nambari ya nafasi yako na uonyeshe tiketi hii unapopanda.', fr: 'Gardez votre référence de réservation et présentez ce billet à l’embarquement.' },
  ticketDownloadUnavailable: { en: 'Ticket content is unavailable for download. Please try again.', sw: 'Maudhui ya tiketi hayapatikani kwa kupakua. Tafadhali jaribu tena.', fr: 'Le billet ne peut pas être téléchargé. Veuillez réessayer.' },
  ticketDownloadFailed: { en: 'The ticket could not be downloaded. Please try printing it instead.', sw: 'Tiketi haikuweza kupakuliwa. Tafadhali jaribu kuichapisha.', fr: 'Le billet n’a pas pu être téléchargé. Essayez plutôt de l’imprimer.' },
  ticketOperator: { en: 'Operator', sw: 'Mwendeshaji', fr: 'Opérateur' },
  ticketRoute: { en: 'Route', sw: 'Njia', fr: 'Itinéraire' },
  ticketDate: { en: 'Date', sw: 'Tarehe', fr: 'Date' },
  ticketCheckIn: { en: 'Check in', sw: 'Kuingia', fr: 'Arrivée' },
  ticketCheckOut: { en: 'Check out', sw: 'Kutoka', fr: 'Départ' },
  ticketDeparts: { en: 'Departs', sw: 'Inaondoka', fr: 'Départ' },
  ticketArrives: { en: 'Arrives', sw: 'Inafika', fr: 'Arrivée' },
  ticketVessel: { en: 'Vessel', sw: 'Meli', fr: 'Navire' },
  ticketTrain: { en: 'Train', sw: 'Treni', fr: 'Train' },
  ticketFlight: { en: 'Flight', sw: 'Ndege', fr: 'Vol' },
  ticketStay: { en: 'Stay', sw: 'Malazi', fr: 'Hébergement' },
  ticketRoom: { en: 'Room', sw: 'Chumba', fr: 'Chambre' },
  ticketExperience: { en: 'Experience', sw: 'Shughuli', fr: 'Activité' },
  ticketClass: { en: 'Class', sw: 'Daraja', fr: 'Classe' },
  ticketBus: { en: 'Bus', sw: 'Basi', fr: 'Bus' },
  ticketBoardAt: { en: 'Board at', sw: 'Panda hapa', fr: 'Embarquement à' },
  ticketDropAt: { en: 'Drop at', sw: 'Shukia hapa', fr: 'Débarquement à' },
  ticketQrLabel: { en: 'QR code for ticket reference {reference}', sw: 'Msimbo wa QR wa tiketi {reference}', fr: 'Code QR du billet {reference}' },
  ticketLabel: { en: '{mode} TICKET', sw: 'TIKETI YA {mode}', fr: 'BILLET {mode}' },
  ticketReference: { en: 'Ref', sw: 'Kumb.', fr: 'Réf.' },
  ticketPassengerFallback: { en: 'Passenger', sw: 'Abiria', fr: 'Passager' },
  passengerLabel: { en: 'Passenger', sw: 'Abiria', fr: 'Passager' },
  seatLabel: { en: 'Seat', sw: 'Kiti', fr: 'Siège' },
  fullNameAsOnId: { en: 'Full name as on ID', sw: 'Majina kamili kama yalivyo kwenye kitambulisho', fr: 'Nom complet comme sur la pièce d’identité' },
  enterFullName: { en: 'Enter full name', sw: 'Weka majina kamili', fr: 'Saisissez le nom complet' },
  emailLabel: { en: 'Email', sw: 'Barua pepe', fr: 'E-mail' },
  countryCallingCode: { en: 'Country calling code', sw: 'Msimbo wa simu wa nchi', fr: 'Indicatif téléphonique du pays' },
  genderLabel: { en: 'Gender', sw: 'Jinsia', fr: 'Genre' },
  categoryLabel: { en: 'Category', sw: 'Aina', fr: 'Catégorie' },
  countryOfResidence: { en: 'Country of residence', sw: 'Nchi unayoishi', fr: 'Pays de résidence' },
  identificationLabel: { en: 'Identification', sw: 'Utambulisho', fr: 'Identification' },
  requiredLabel: { en: 'Required', sw: 'Inahitajika', fr: 'Obligatoire' },
  optionalField: { en: 'Optional field', sw: 'Sehemu ya hiari', fr: 'Champ facultatif' },
  idTypeLabel: { en: 'ID type', sw: 'Aina ya kitambulisho', fr: 'Type de pièce d’identité' },
  selectIdType: { en: 'Select ID type', sw: 'Chagua aina ya kitambulisho', fr: 'Choisissez le type de pièce' },
  idNumberLabel: { en: 'ID number', sw: 'Nambari ya kitambulisho', fr: 'Numéro de pièce d’identité' },
  enterIdNumber: { en: 'Enter ID number', sw: 'Weka nambari ya kitambulisho', fr: 'Saisissez le numéro de pièce' },
  optionalLabel: { en: 'Optional', sw: 'Hiari', fr: 'Facultatif' },
  countryOfIssue: { en: 'Country of issue', sw: 'Nchi iliyotoa', fr: 'Pays de délivrance' },
  selectCountry: { en: 'Select country', sw: 'Chagua nchi', fr: 'Choisissez un pays' },
  drivingLicence: { en: 'Driving Licence', sw: 'Leseni ya Udereva', fr: 'Permis de conduire' },
  nationalId: { en: 'National ID', sw: 'Kitambulisho cha Taifa', fr: 'Carte nationale d’identité' },
  passport: { en: 'Passport', sw: 'Pasipoti', fr: 'Passeport' },
  voterCard: { en: 'Voter Card', sw: 'Kadi ya Mpiga Kura', fr: 'Carte d’électeur' },
  male: { en: 'Male', sw: 'Mwanaume', fr: 'Homme' },
  female: { en: 'Female', sw: 'Mwanamke', fr: 'Femme' },
  adult: { en: 'Adult', sw: 'Mtu mzima', fr: 'Adulte' },
  child: { en: 'Child', sw: 'Mtoto', fr: 'Enfant' },
  infant: { en: 'Infant', sw: 'Mchanga', fr: 'Nourrisson' },
  modifySearch: { en: 'Modify search', sw: 'Badilisha utafutaji', fr: 'Modifier la recherche' },
  findingAvailableBuses: { en: 'Finding available buses...', sw: 'Inatafuta mabasi yanayopatikana...', fr: 'Recherche des bus disponibles…' },
  unableLoadSearchResults: { en: 'Unable to load search results', sw: 'Imeshindwa kupakia matokeo ya utafutaji', fr: 'Impossible de charger les résultats' },
  bookingServiceTryAgain: { en: 'There was a problem connecting to the booking service. Please try again.', sw: 'Kulikuwa na tatizo la kuunganisha huduma ya nafasi. Tafadhali jaribu tena.', fr: 'Un problème est survenu lors de la connexion au service de réservation. Veuillez réessayer.' },
  selectTravelDate: { en: 'Select your travel date', sw: 'Chagua tarehe ya safari yako', fr: 'Choisissez votre date de voyage' },
  passengerCount: { en: '{count} passenger{plural}', sw: 'Abiria {count}', fr: '{count} passager{plural}' },
  busCount: { en: '{count} buses', sw: 'Mabasi {count}', fr: '{count} bus' },
  noTripsForRoute: { en: 'No trips found for this route', sw: 'Hakuna safari zilizopatikana kwenye njia hii', fr: 'Aucun trajet trouvé pour cet itinéraire' },
  tryDifferentDateRouteBus: { en: 'Try a different date or route. Buses may not operate this segment on the selected date.', sw: 'Jaribu tarehe au njia nyingine. Huenda mabasi yasitumie sehemu hii katika tarehe uliyochagua.', fr: 'Essayez une autre date ou un autre itinéraire. Aucun bus ne circule peut-être sur ce tronçon à la date choisie.' },
  nextDay: { en: 'Next day', sw: 'Siku inayofuata', fr: 'Lendemain' },
  sameDay: { en: 'Same day', sw: 'Siku hiyo hiyo', fr: 'Même jour' },
  searchingFlights: { en: 'Searching flights...', sw: 'Inatafuta safari za ndege...', fr: 'Recherche des vols…' },
  unableLoadFlights: { en: 'Unable to load flights', sw: 'Imeshindwa kupakia safari za ndege', fr: 'Impossible de charger les vols' },
  noFlightsFound: { en: 'No flights found', sw: 'Hakuna safari za ndege zilizopatikana', fr: 'Aucun vol trouvé' },
  tryDifferentDateRoute: { en: 'Try a different date or route.', sw: 'Jaribu tarehe au njia nyingine.', fr: 'Essayez une autre date ou un autre itinéraire.' },
  searchingAccommodations: { en: 'Searching accommodations...', sw: 'Inatafuta malazi...', fr: 'Recherche d’hébergements…' },
  unableLoadStays: { en: 'Unable to load stays', sw: 'Imeshindwa kupakia malazi', fr: 'Impossible de charger les hébergements' },
  allDestinations: { en: 'All destinations', sw: 'Maeneo yote', fr: 'Toutes les destinations' },
  noPropertiesFound: { en: 'No properties found', sw: 'Hakuna malazi yaliyopatikana', fr: 'Aucun hébergement trouvé' },
  tryDifferentDestinationDate: { en: 'Try a different destination or date.', sw: 'Jaribu unakoenda au tarehe nyingine.', fr: 'Essayez une autre destination ou une autre date.' },
  findingAvailableSailings: { en: 'Finding available sailings...', sw: 'Inatafuta safari za feri...', fr: 'Recherche des traversées disponibles…' },
  unableLoadSailings: { en: 'Unable to load sailings', sw: 'Imeshindwa kupakia safari za feri', fr: 'Impossible de charger les traversées' },
  bookingServiceProblem: { en: 'There was a problem connecting to the booking service.', sw: 'Kulikuwa na tatizo la kuunganisha huduma ya nafasi.', fr: 'Un problème est survenu lors de la connexion au service de réservation.' },
  noSailingsFound: { en: 'No sailings found', sw: 'Hakuna safari za feri zilizopatikana', fr: 'Aucune traversée trouvée' },
  selectSailingClass: { en: 'Select a sailing to choose your class', sw: 'Chagua safari ya feri ili kuchagua daraja', fr: 'Choisissez une traversée pour sélectionner votre classe' },
  searchingTrainServices: { en: 'Searching train services...', sw: 'Inatafuta huduma za treni...', fr: 'Recherche des trains…' },
  unableLoadTrains: { en: 'Unable to load trains', sw: 'Imeshindwa kupakia treni', fr: 'Impossible de charger les trains' },
  noTrainsFound: { en: 'No trains found', sw: 'Hakuna treni zilizopatikana', fr: 'Aucun train trouvé' },
  searchingExperiences: { en: 'Searching experiences...', sw: 'Inatafuta shughuli...', fr: 'Recherche d’activités…' },
  unableLoadExperiences: { en: 'Unable to load experiences', sw: 'Imeshindwa kupakia shughuli', fr: 'Impossible de charger les activités' },
  noExperiencesFound: { en: 'No experiences found', sw: 'Hakuna shughuli zilizopatikana', fr: 'Aucune activité trouvée' },
  seatSelectionUnavailable: { en: 'No seat selection', sw: 'Hakuna uchaguzi wa viti', fr: 'Choix du siège indisponible' },
  seats: { en: 'seats', sw: 'viti', fr: 'places' },
  selectFlight: { en: 'Select Flight', sw: 'Chagua Ndege', fr: 'Choisir le vol' },
  arrival: { en: 'Arrival', sw: 'Kuwasili', fr: 'Arrivée' },
  flightSearch: { en: 'Flight search', sw: 'Utafutaji wa ndege', fr: 'Recherche de vols' },
  ferrySearch: { en: 'Ferry search', sw: 'Utafutaji wa feri', fr: 'Recherche de ferry' },
  trainSearch: { en: 'Train search', sw: 'Utafutaji wa treni', fr: 'Recherche de train' },
  flightCount: { en: '{count} flights found', sw: 'Safari za ndege {count} zimepatikana', fr: '{count} vol(s) trouvé(s)' },
  sailingCount: { en: '{count} sailings found', sw: 'Safari za feri {count} zimepatikana', fr: '{count} traversée(s) trouvée(s)' },
  trainServiceCount: { en: '{count} train services found', sw: 'Huduma za treni {count} zimepatikana', fr: '{count} train(s) trouvé(s)' },
  propertyCount: { en: '{count} properties found', sw: 'Malazi {count} yamepatikana', fr: '{count} hébergement(s) trouvé(s)' },
  experienceCount: { en: '{count} experiences found', sw: 'Shughuli {count} zimepatikana', fr: '{count} activité(s) trouvée(s)' },
  durationLabel: { en: 'Duration', sw: 'Muda', fr: 'Durée' },
  totalPrice: { en: 'Total price', sw: 'Bei ya jumla', fr: 'Prix total' },
  refundable: { en: 'Refundable', sw: 'Inaweza kurejeshewa fedha', fr: 'Remboursable' },
  nonRefundable: { en: 'Non-refundable', sw: 'Hairudishiwi fedha', fr: 'Non remboursable' },
  nightCount: { en: '{count} night{plural}', sw: 'Usiku {count}', fr: '{count} nuit{plural}' },
  personSuffix: { en: '/person', sw: '/mtu', fr: '/personne' },
  dateCount: { en: '{count} dates', sw: 'Tarehe {count}', fr: '{count} dates' },
  morning: { en: 'Morning', sw: 'Asubuhi', fr: 'Matin' },
  journey: { en: 'Journey', sw: 'Safari', fr: 'Trajet' },
  via: { en: 'Via', sw: 'Kupitia', fr: 'Via' },
  availableClasses: { en: 'Available Classes', sw: 'Madaraja Yanayopatikana', fr: 'Classes disponibles' },
  availableCount: { en: '{count} left', sw: 'Zimebaki {count}', fr: '{count} disponible(s)' },
  perAdult: { en: 'per adult', sw: 'kwa mtu mzima', fr: 'par adulte' },
  bookButton: { en: 'Book', sw: 'Weka nafasi', fr: 'Réserver' },
  adultCount: { en: '{count} adult{plural}', sw: 'Watu wazima {count}', fr: '{count} adulte{plural}' },
  backToResults: { en: 'Back to results', sw: 'Rudi kwenye matokeo', fr: 'Retour aux résultats' },
  selectYourSeats: { en: 'Select your seats', sw: 'Chagua viti vyako', fr: 'Choisissez vos sièges' },
  selectSeatsForJourney: { en: 'Select {count} seat{plural} for your journey', sw: 'Chagua viti {count} kwa safari yako', fr: 'Choisissez {count} siège{plural} pour votre trajet' },
  seatFree: { en: 'Free', sw: 'Huru', fr: 'Libre' },
  seatYours: { en: 'Yours', sw: 'Chako', fr: 'À vous' },
  seatTaken: { en: 'Taken', sw: 'Kimechukuliwa', fr: 'Occupé' },
  front: { en: 'Front', sw: 'Mbele', fr: 'Avant' },
  driver: { en: 'Driver', sw: 'Dereva', fr: 'Conducteur' },
  seatOccupied: { en: 'occupied', sw: 'kimechukuliwa', fr: 'occupé' },
  seatSelected: { en: 'selected', sw: 'kimechaguliwa', fr: 'sélectionné' },
  seatAvailable: { en: 'available', sw: 'kinapatikana', fr: 'disponible' },
  farePerPerson: { en: 'Fare per person', sw: 'Nauli kwa mtu', fr: 'Tarif par personne' },
  boardingAndDropoff: { en: 'Boarding & drop-off', sw: 'Kupanda na kushuka', fr: 'Embarquement et débarquement' },
  chooseBoardingDropoff: { en: 'Choose where you get on and off for this bus journey.', sw: 'Chagua sehemu za kupanda na kushuka kwenye safari hii ya basi.', fr: 'Choisissez vos lieux d’embarquement et de débarquement pour ce trajet en bus.' },
  boardingPoint: { en: 'Boarding point', sw: 'Sehemu ya kupandia', fr: 'Lieu d’embarquement' },
  dropOffPoint: { en: 'Drop-off point', sw: 'Sehemu ya kushukia', fr: 'Lieu de débarquement' },
  selectBoardingPoint: { en: 'Select boarding point', sw: 'Chagua sehemu ya kupandia', fr: 'Choisissez le lieu d’embarquement' },
  selectDropOffPoint: { en: 'Select drop-off point', sw: 'Chagua sehemu ya kushukia', fr: 'Choisissez le lieu de débarquement' },
  loadingSeatMap: { en: 'Loading seat map...', sw: 'Inapakia ramani ya viti...', fr: 'Chargement du plan des sièges…' },
  unableLoadTrip: { en: 'Unable to load this trip', sw: 'Imeshindwa kupakia safari hii', fr: 'Impossible de charger ce trajet' },
  selectedTripMissing: { en: 'The selected trip could not be found. Please go back and try again.', sw: 'Safari uliyochagua haikupatikana. Tafadhali rudi nyuma na ujaribu tena.', fr: 'Le trajet sélectionné est introuvable. Veuillez revenir en arrière et réessayer.' },
  selectClassAndDetails: { en: 'Select class & enter details', sw: 'Chagua daraja na uweke maelezo', fr: 'Choisissez une classe et renseignez vos informations' },
  loadingSailingDetails: { en: 'Loading sailing details...', sw: 'Inapakia maelezo ya safari ya feri...', fr: 'Chargement des détails de la traversée…' },
  unableLoadSailing: { en: 'Unable to load this sailing', sw: 'Imeshindwa kupakia safari hii ya feri', fr: 'Impossible de charger cette traversée' },
  pleaseGoBackTryAgain: { en: 'Please go back and try again.', sw: 'Tafadhali rudi nyuma na ujaribu tena.', fr: 'Veuillez revenir en arrière et réessayer.' },
  selectVesselClass: { en: 'Select Vessel Class', sw: 'Chagua Daraja la Meli', fr: 'Choisissez la classe du navire' },
  noSeatSelectionFerry: { en: 'No seat selection required for ferry travel. Choose your travel class.', sw: 'Safari ya feri haihitaji kuchagua kiti. Chagua daraja la safari.', fr: 'Aucun siège n’est à sélectionner pour le ferry. Choisissez votre classe.' },
  ferryPassengerIdNote: { en: 'Identification is required for all ferry passengers (residents and non-residents).', sw: 'Vitambulisho vinahitajika kwa abiria wote wa feri (wakazi na wasio wakazi).', fr: 'Une pièce d’identité est requise pour tous les passagers du ferry (résidents et non-résidents).' },
  passengerInformation: { en: 'Passenger Information', sw: 'Maelezo ya Abiria', fr: 'Informations sur les passagers' },
  enterTravelDocumentDetails: { en: 'Enter details as they appear on your travel document.', sw: 'Weka maelezo kama yalivyo kwenye hati yako ya kusafiria.', fr: 'Saisissez les informations telles qu’elles figurent sur votre document de voyage.' },
  continueToReview: { en: 'Continue to Review', sw: 'Endelea Kukagua', fr: 'Continuer vers la vérification' },
  summary: { en: 'Summary', sw: 'Muhtasari', fr: 'Résumé' },
  vessel: { en: 'Vessel', sw: 'Meli', fr: 'Navire' },
  flightSummary: { en: 'Flight Summary', sw: 'Muhtasari wa Ndege', fr: 'Résumé du vol' },
  trainLabel: { en: 'Train', sw: 'Treni', fr: 'Train' },
  trainNoteAutoSeat: { en: 'Note: This class does not support seat selection. Seats will be assigned automatically.', sw: 'Kumbuka: Daraja hili haliruhusu kuchagua kiti. Viti vitapangiwa kiotomatiki.', fr: 'Remarque : cette classe ne permet pas de choisir un siège. Les sièges seront attribués automatiquement.' },
  reviewYourBooking: { en: 'Review your booking', sw: 'Kagua nafasi yako', fr: 'Vérifiez votre réservation' },
  serviceDetails: { en: 'Service Details', sw: 'Maelezo ya Huduma', fr: 'Détails du service' },
  boardingSection: { en: 'Boarding & Drop-off', sw: 'Kupanda na kushuka', fr: 'Embarquement et débarquement' },
  sailingDetails: { en: 'Sailing Details', sw: 'Maelezo ya Safari ya Feri', fr: 'Détails de la traversée' },
  passengersCount: { en: 'Passengers ({count})', sw: 'Abiria ({count})', fr: 'Passagers ({count})' },
  proceedToCheckout: { en: 'Proceed to Checkout', sw: 'Endelea Kulipa', fr: 'Passer au paiement' },
  fareRevalidationNote: { en: 'Fare and availability will be revalidated before booking is confirmed.', sw: 'Nauli na upatikanaji vitathibitishwa tena kabla ya nafasi kuthibitishwa.', fr: 'Le tarif et la disponibilité seront vérifiés avant la confirmation de la réservation.' },
  classCapacityRevalidationNote: { en: 'Class capacity will be revalidated before booking confirmation.', sw: 'Uwezo wa daraja utathibitishwa tena kabla ya nafasi kuthibitishwa.', fr: 'La capacité de la classe sera vérifiée avant la confirmation de la réservation.' },
  editButton: { en: 'Edit', sw: 'Hariri', fr: 'Modifier' },
  preparingBookingReview: { en: 'Preparing your booking review...', sw: 'Inaandaa ukaguzi wa nafasi yako...', fr: 'Préparation du récapitulatif de votre réservation…' },
  unableLoadBookingReview: { en: 'Unable to load booking review', sw: 'Imeshindwa kupakia ukaguzi wa nafasi', fr: 'Impossible de charger le récapitulatif' },
  classNotSelected: { en: 'No class selected', sw: 'Hakuna daraja lililochaguliwa', fr: 'Aucune classe sélectionnée' },
  classNotFound: { en: 'Class not found', sw: 'Daraja halikupatikana', fr: 'Classe introuvable' },
  propertyNotFound: { en: 'Property not found', sw: 'Malazi hayakupatikana', fr: 'Hébergement introuvable' },
  roomNotFound: { en: 'Room not found', sw: 'Chumba hakikupatikana', fr: 'Chambre introuvable' },
  experienceNotFound: { en: 'Experience not found', sw: 'Shughuli haikupatikana', fr: 'Activité introuvable' },
  fareSummary: { en: 'Fare Summary', sw: 'Muhtasari wa Nauli', fr: 'Récapitulatif du tarif' },
  flightDetails: { en: 'Flight Details', sw: 'Maelezo ya Safari ya Ndege', fr: 'Détails du vol' },
  flightReservationNote: { en: 'A reservation will be created first. Ticket issuance is confirmed only after the airline/supplier confirms it. A reservation is not an issued ticket.', sw: 'Nafasi itawekwa kwanza. Tiketi itatolewa tu baada ya shirika la ndege au mtoa huduma kuthibitisha. Nafasi si tiketi iliyotolewa.', fr: 'Une réservation sera d’abord créée. Le billet ne sera émis qu’après confirmation par la compagnie aérienne ou le fournisseur. Une réservation n’est pas un billet émis.' },
  baseFare: { en: 'Base fare ({count} pax)', sw: 'Nauli ya msingi (abiria {count})', fr: 'Tarif de base ({count} passagers)' },
  taxesAndFees: { en: 'Taxes & fees', sw: 'Kodi na ada', fr: 'Taxes et frais' },
  included: { en: 'Included', sw: 'Imejumuishwa', fr: 'Inclus' },
  aircraft: { en: 'Aircraft', sw: 'Aina ya Ndege', fr: 'Appareil' },
  guestInformation: { en: 'Guest Information', sw: 'Maelezo ya Mgeni', fr: 'Informations sur le client' },
  priceSummary: { en: 'Price Summary', sw: 'Muhtasari wa Bei', fr: 'Récapitulatif des prix' },
  nights: { en: 'Nights', sw: 'Usiku', fr: 'Nuits' },
  locationLabel: { en: 'Location', sw: 'Eneo', fr: 'Lieu' },
  sessionLabel: { en: 'Session', sw: 'Kipindi', fr: 'Séance' },
  meetingPoint: { en: 'Meeting point', sw: 'Sehemu ya kukutana', fr: 'Point de rendez-vous' },
  experienceDetails: { en: 'Experience Details', sw: 'Maelezo ya Shughuli', fr: 'Détails de l’activité' },
  participantInformation: { en: 'Participant Information', sw: 'Maelezo ya Mshiriki', fr: 'Informations sur les participants' },
  participants: { en: 'Participants', sw: 'Washiriki', fr: 'Participants' },
  reviewStay: { en: 'Review your stay', sw: 'Kagua malazi yako', fr: 'Vérifiez votre séjour' },
  passengerJourney: { en: 'Passenger journey', sw: 'Safari ya abiria', fr: 'Trajet du passager' },
  fullServiceRoute: { en: 'Full service route', sw: 'Njia kamili ya huduma', fr: 'Itinéraire complet du service' },
  bookingReview: { en: 'Booking Review', sw: 'Ukaguzi wa Nafasi', fr: 'Récapitulatif de réservation' },
  flightBookingReview: { en: 'Flight Booking Review', sw: 'Ukaguzi wa Nafasi ya Ndege', fr: 'Récapitulatif de réservation de vol' },
  ferryBookingReview: { en: 'Ferry Booking Review', sw: 'Ukaguzi wa Nafasi ya Feri', fr: 'Récapitulatif de réservation de ferry' },
  trainBookingReview: { en: 'Train Booking Review', sw: 'Ukaguzi wa Nafasi ya Treni', fr: 'Récapitulatif de réservation de train' },
  requiredField: { en: 'Required', sw: 'Inahitajika', fr: 'Obligatoire' },
  noteLabel: { en: 'Note', sw: 'Kumbuka', fr: 'Remarque' },
  loadingStayDetails: { en: 'Loading stay details...', sw: 'Inapakia maelezo ya malazi...', fr: 'Chargement des détails de l’hébergement…' },
  availableRooms: { en: 'Available Rooms', sw: 'Vyumba Vinavyopatikana', fr: 'Chambres disponibles' },
  maxOccupancy: { en: 'Max {count}', sw: 'Idadi ya juu {count}', fr: 'Max. {count}' },
  roomAvailable: { en: '{count} available', sw: '{count} vinapatikana', fr: '{count} disponibles' },
  perNight: { en: 'per night', sw: 'kwa usiku', fr: 'par nuit' },
  selected: { en: 'Selected', sw: 'Imechaguliwa', fr: 'Sélectionné' },
  yourStay: { en: 'Your Stay', sw: 'Malazi Yako', fr: 'Votre séjour' },
  guests: { en: 'Guests', sw: 'Wageni', fr: 'Voyageurs' },
  selectRoom: { en: 'Select a room', sw: 'Chagua chumba', fr: 'Sélectionner une chambre' },
  stayDuration: { en: '{nights} · {rooms}', sw: '{nights} · {rooms}', fr: '{nights} · {rooms}' },
  selectDateAndSession: { en: 'Select Date & Session', sw: 'Chagua Tarehe na Kipindi', fr: 'Choisir une date et une séance' },
  availableDates: { en: 'Available dates', sw: 'Tarehe zinazopatikana', fr: 'Dates disponibles' },
  availableSessions: { en: 'Available sessions', sw: 'Vipindi vinavyopatikana', fr: 'Séances disponibles' },
  bookingSummary: { en: 'Booking Summary', sw: 'Muhtasari wa Nafasi', fr: 'Récapitulatif de réservation' },
  pricePerPerson: { en: 'Price per person', sw: 'Bei kwa mtu', fr: 'Prix par personne' },
  cancellationLabel: { en: 'Cancellation', sw: 'Kughairi', fr: 'Annulation' },
  nightSingular: { en: 'night', sw: 'usiku', fr: 'nuit' },
  roomSingular: { en: 'room', sw: 'chumba', fr: 'chambre' },
  signInTitle: { en: 'Sign in', sw: 'Ingia', fr: 'Se connecter' },
  signInWelcome: { en: 'Welcome back. Sign in to manage your bookings.', sw: 'Karibu tena. Ingia ili kudhibiti nafasi zako.', fr: 'Ravi de vous revoir. Connectez-vous pour gérer vos réservations.' },
  passwordLabel: { en: 'Password', sw: 'Nenosiri', fr: 'Mot de passe' },
  enterPassword: { en: 'Enter password', sw: 'Weka nenosiri', fr: 'Saisissez votre mot de passe' },
  signingIn: { en: 'Signing in...', sw: 'Inaingia...', fr: 'Connexion…' },
  dontHaveAccount: { en: "Don't have an account?", sw: 'Huna akaunti?', fr: 'Vous n’avez pas de compte ?' },
  createOne: { en: 'Create one', sw: 'Fungua akaunti', fr: 'Créer un compte' },
  manageBookingNoAccount: { en: 'Manage a booking without an account', sw: 'Dhibiti nafasi bila akaunti', fr: 'Gérer une réservation sans compte' },
  createAccountTitle: { en: 'Create account', sw: 'Fungua akaunti', fr: 'Créer un compte' },
  registerIntro: { en: 'Sign up to book and manage your travel.', sw: 'Jisajili ili kuweka na kudhibiti nafasi za safari.', fr: 'Inscrivez-vous pour réserver et gérer vos voyages.' },
  fullNameLabel: { en: 'Full name', sw: 'Majina kamili', fr: 'Nom complet' },
  enterFullNamePlaceholder: { en: 'Enter your full name', sw: 'Weka majina yako kamili', fr: 'Saisissez votre nom complet' },
  confirmPasswordLabel: { en: 'Confirm password', sw: 'Thibitisha nenosiri', fr: 'Confirmez le mot de passe' },
  atLeastSixChars: { en: 'At least 6 characters', sw: 'Angalau herufi 6', fr: '6 caractères minimum' },
  reenterPassword: { en: 'Re-enter password', sw: 'Weka nenosiri tena', fr: 'Saisissez à nouveau le mot de passe' },
  creatingAccount: { en: 'Creating account...', sw: 'Inafungua akaunti...', fr: 'Création du compte…' },
  alreadyHaveAccount: { en: 'Already have an account?', sw: 'Tayari una akaunti?', fr: 'Vous avez déjà un compte ?' },
  pleaseEnterEmailAndPassword: { en: 'Please enter your email and password.', sw: 'Tafadhali weka barua pepe na nenosiri.', fr: 'Veuillez saisir votre e-mail et votre mot de passe.' },
  requiredFields: { en: 'Please fill in all required fields.', sw: 'Tafadhali jaza sehemu zote zinazohitajika.', fr: 'Veuillez remplir tous les champs obligatoires.' },
  passwordsDoNotMatch: { en: 'Passwords do not match.', sw: 'Manenosiri hayalingani.', fr: 'Les mots de passe ne correspondent pas.' },
  passwordMinLength: { en: 'Password must be at least 6 characters.', sw: 'Nenosiri lazima liwe na angalau herufi 6.', fr: 'Le mot de passe doit comporter au moins 6 caractères.' },
  manageBookingTitle: { en: 'Manage your booking', sw: 'Dhibiti nafasi yako', fr: 'Gérer votre réservation' },
  manageBookingDescription: { en: 'Retrieve your booking using your reference number and email.', sw: 'Pata nafasi yako kwa kutumia nambari ya kumbukumbu na barua pepe.', fr: 'Retrouvez votre réservation à l’aide de sa référence et de votre adresse e-mail.' },
  bookingReferenceLabel: { en: 'Booking reference', sw: 'Nambari ya kumbukumbu ya nafasi', fr: 'Référence de réservation' },
  emailUsedForBooking: { en: 'Email used for booking', sw: 'Barua pepe iliyotumika kuweka nafasi', fr: 'E-mail utilisé pour la réservation' },
  findBooking: { en: 'Find booking', sw: 'Tafuta nafasi', fr: 'Rechercher la réservation' },
  searchingBooking: { en: 'Searching...', sw: 'Inatafuta...', fr: 'Recherche…' },
  pleaseEnterBookingReference: { en: 'Please enter your booking reference.', sw: 'Tafadhali weka nambari ya kumbukumbu ya nafasi.', fr: 'Veuillez saisir la référence de votre réservation.' },
  pleaseEnterBookingEmail: { en: 'Please enter the email used for the booking.', sw: 'Tafadhali weka barua pepe iliyotumika kuweka nafasi.', fr: 'Veuillez saisir l’e-mail utilisé pour la réservation.' },
  noBookingFound: { en: 'No booking found with reference "{reference}".', sw: 'Hakuna nafasi iliyopatikana yenye kumbukumbu "{reference}".', fr: 'Aucune réservation trouvée avec la référence « {reference} ».' },
  checkBookingReferenceAgain: { en: 'Please check your reference number and try again.', sw: 'Tafadhali hakiki nambari ya kumbukumbu kisha ujaribu tena.', fr: 'Vérifiez votre référence et réessayez.' },
  bookingReferencePrivacy: { en: 'A booking reference alone does not reveal passenger information. Email verification is required.', sw: 'Nambari ya kumbukumbu pekee haionyeshi maelezo ya abiria. Uthibitishaji wa barua pepe unahitajika.', fr: 'La référence seule ne révèle pas les informations des passagers. Une vérification par e-mail est nécessaire.' },
  signInToAccount: { en: 'Sign in to your account', sw: 'Ingia kwenye akaunti yako', fr: 'Connectez-vous à votre compte' },
  searchingOptions: { en: 'Searching for available options...', sw: 'Inatafuta machaguo yanayopatikana...', fr: 'Recherche des options disponibles…' },
  tryAgain: { en: 'Try again', sw: 'Jaribu tena', fr: 'Réessayer' },
  orContinueWith: { en: 'or continue with', sw: 'au endelea kwa kutumia', fr: 'ou continuer avec' },
  continueWithProvider: { en: 'Continue with {provider}', sw: 'Endelea kwa kutumia {provider}', fr: 'Continuer avec {provider}' },
  connectingToProvider: { en: 'Connecting to {provider}...', sw: 'Inaunganisha na {provider}...', fr: 'Connexion à {provider}…' },
  loadingTrainDetails: { en: 'Loading train details...', sw: 'Inapakia maelezo ya treni...', fr: 'Chargement des détails du train…' },
  bookBus: { en: 'Book Bus', sw: 'Weka Nafasi ya Basi', fr: 'Réserver un bus' },
  seatSelectionError: { en: 'Please select {count} seat{plural}. You have selected {selected}.', sw: 'Tafadhali chagua viti {count}. Umechagua {selected}.', fr: 'Veuillez choisir {count} siège{plural}. Vous en avez sélectionné {selected}.' },
  selectSeatsForDetails: { en: 'Select seats on the left to enter passenger details.', sw: 'Chagua viti upande wa kushoto ili kuweka maelezo ya abiria.', fr: 'Choisissez les sièges à gauche pour saisir les informations des passagers.' },
  pricesIn: { en: 'Prices in {currency}', sw: 'Bei katika {currency}', fr: 'Prix en {currency}' },
  requiredForFerry: { en: 'Required for ferry', sw: 'Inahitajika kwa feri', fr: 'Obligatoire pour le ferry' },
  perAdultResidency: { en: 'per adult · {residency}', sw: 'kwa mtu mzima · {residency}', fr: 'par adulte · {residency}' },
  flightBookingTitle: { en: 'Passenger details', sw: 'Maelezo ya abiria', fr: 'Informations sur les passagers' },
  selectVesselClassError: { en: 'Please select a vessel class', sw: 'Tafadhali chagua daraja la meli', fr: 'Veuillez choisir une classe de navire' },
  loadingFlightDetails: { en: 'Loading flight details...', sw: 'Inapakia maelezo ya safari ya ndege...', fr: 'Chargement des détails du vol…' },
  flightNotFound: { en: 'Flight not found', sw: 'Safari ya ndege haikupatikana', fr: 'Vol introuvable' },
  trainNotFound: { en: 'Train not found', sw: 'Treni haikupatikana', fr: 'Train introuvable' },
  enterPassengerDetails: { en: 'Enter details for {count} passenger{plural}.', sw: 'Weka maelezo ya abiria {count}.', fr: 'Saisissez les informations de {count} passager{plural}.' },
  fieldsMarkedRequired: { en: 'Fields marked * are required.', sw: 'Sehemu zilizo na * zinahitajika.', fr: 'Les champs marqués d’un * sont obligatoires.' },
};

const en: TranslationMap = {
  dashboard: 'Dashboard',
  overview: 'Overview',
  profile: 'Profile',
  allBookings: 'All Bookings',
  busBookings: 'Bus',
  ferryBookings: 'Ferry',
  flightBookings: 'Flights',
  trainBookings: 'Train',
  stayBookings: 'Stays',
  experienceBookings: 'Experiences',
  settings: 'Settings',
  signOut: 'Sign Out',
  welcomeBack: 'Welcome back',
  upcomingTrips: 'Upcoming trips',
  completedTrips: 'Completed',
  totalSpent: 'Total spent',
  travelModes: 'Travel modes',
  tripHistory: 'Trip history',
  nextTrip: 'Next trip',
  noTripsCategory: 'No trips in this category.',
  bookNextTrip: 'Book your next trip',
  all: 'All',
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  trip: 'trip',
  trips: 'trips',
  passenger: 'passenger',
  passengers: 'passengers',
  ref: 'Ref',
  daysAway: 'days away',
  dayAway: 'day away',
  today: 'Today',
  name: 'Name',
  email: 'Email',
  signInMethod: 'Sign-in method',
  emailPassword: 'Email & Password',
  google: 'Google',
  apple: 'Apple',
  quickActions: 'Quick actions',
  manageBooking: 'Manage a booking',
  searchNewTrips: 'Search new trips',
  bus: 'Bus',
  ferry: 'Ferry',
  flights: 'Flights',
  train: 'Train',
  stays: 'Stays',
  experiences: 'Experiences',
  bookings: 'Bookings',
  recentBookings: 'Recent bookings',
  viewAll: 'View all',
  language: 'Language',
  english: 'English',
  swahili: 'Swahili',
  french: 'French',
  loadingAccount: 'Loading account...',
  operatorDashboard: 'Operator Dashboard',
  selectOperator: 'Select Operator',
  schedules: 'Schedules',
  fleet: 'Fleet',
  manifest: 'Booking Manifest',
  revenue: 'Revenue',
  totalBookings: 'Total bookings',
  confirmedBookings: 'Confirmed',
  pendingBookings: 'Pending',
  cancelledBookings: 'Cancelled',
  totalRevenue: 'Total revenue',
  activeTrips: 'Active trips',
  activeSailings: 'Active sailings',
  availableSeats: 'Available seats',
  totalCapacity: 'Total capacity',
  capacityUtil: 'Capacity utilisation',
  vessel: 'Vessel',
  vesselName: 'Vessel name',
  departurePort: 'Departure port',
  arrivalPort: 'Arrival port',
  departureTime: 'Departure',
  arrivalTime: 'Arrival',
  busModel: 'Bus model',
  registrationNo: 'Reg. number',
  busClass: 'Class',
  route: 'Route',
  date: 'Date',
  customer: 'Customer',
  phone: 'Phone',
  amount: 'Amount',
  status: 'Status',
  confirmed: 'Confirmed',
  pending: 'Pending',
  refunded: 'Refunded',
  noBookings: 'No bookings found.',
  noSchedules: 'No schedules configured.',
  operatorPortal: 'Operator Portal',
  busOperators: 'Bus Operators',
  ferryOperators: 'Ferry Operators',
  searchOperator: 'Search operator...',
  mgmtConsole: 'Management Console',
  fleetManagement: 'Fleet Management',
  vesselManagement: 'Vessel Management',
  scheduleManagement: 'Schedule Management',
  bookingManagement: 'Booking Management',
  analytics: 'Analytics',
  addTrip: 'Add Trip',
  addSailing: 'Add Sailing',
  addVehicle: 'Add Vehicle',
  addVessel: 'Add Vessel',
  editSchedule: 'Edit Schedule',
  vehicleStatus: 'Vehicle Status',
  vesselStatus: 'Vessel Status',
  lastService: 'Last Service',
  lastInspection: 'Last Inspection',
  mileage: 'Mileage (km)',
  yearBuilt: 'Year Built',
  assignedTo: 'Assigned To',
  unassigned: 'Unassigned',
  active: 'Active',
  maintenance: 'In Maintenance',
  retired: 'Retired',
  dryDock: 'Dry Dock',
  scheduled: 'Scheduled',
  boarding: 'Boarding',
  departed: 'Departed',
  bookedSeats: 'Booked',
  totalSeats: 'Total Seats',
  seatNumbers: 'Seats',
  classBooked: 'Class',
  bookedAt: 'Booked At',
  revenueTrend: 'Revenue Trend',
  dailyRevenue: 'Daily Revenue',
  last14Days: 'Last 14 days',
  backToSite: 'Back to Site',
  mgmtOverview: 'Operations Overview',
  totalVehicles: 'Total Vehicles',
  totalVessels: 'Total Vessels',
  activeVehicles: 'Active Vehicles',
  inMaintenance: 'In Maintenance',
  occupancyRate: 'Occupancy Rate',
  avgFare: 'Avg. Fare',
  confirmAction: 'Confirm',
  cancelBooking: 'Cancel Booking',
  refundBooking: 'Refund Booking',
  viewDetails: 'View Details',
  searchBookings: 'Search bookings...',
  allStatuses: 'All Statuses',
  noVehicles: 'No vehicles in fleet.',
  noVessels: 'No vessels registered.',
  operations: 'Operations',
  savedTrips: 'Saved',
  paymentMethods: 'Payment Methods',
  promoCodes: 'Promo Codes',
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
};

const sw: TranslationMap = {
  dashboard: 'Dashibodi',
  overview: 'Muhtasari',
  profile: 'Wasifu',
  allBookings: 'Mahudhurio Yote',
  busBookings: 'Basi',
  ferryBookings: 'Feri',
  flightBookings: 'Ndege',
  trainBookings: 'Treni',
  stayBookings: 'Malazi',
  experienceBookings: 'Matukio',
  settings: 'Mipangilio',
  signOut: 'Toka',
  welcomeBack: 'Karibu tena',
  upcomingTrips: 'Safari zinazokuja',
  completedTrips: 'Zilizokamilika',
  totalSpent: 'Jumla iliyotumika',
  travelModes: 'Aina za usafiri',
  tripHistory: 'Historia ya safari',
  nextTrip: 'Safari inayofuata',
  noTripsCategory: 'Hakuna safari katika kategoria hii.',
  bookNextTrip: 'Weka nafasi ya safari inayofuata',
  all: 'Zote',
  upcoming: 'Zinazokuja',
  completed: 'Zilizokamilika',
  cancelled: 'Zilizokatishwa',
  trip: 'safari',
  trips: 'safari',
  passenger: 'abiria',
  passengers: 'abiria',
  ref: 'Ref',
  daysAway: 'siku zilizobaki',
  dayAway: 'siku iliyobaki',
  today: 'Leo',
  name: 'Jina',
  email: 'Barua pepe',
  signInMethod: 'Njia ya kuingia',
  emailPassword: 'Barua pepe na Nenosiri',
  google: 'Google',
  apple: 'Apple',
  quickActions: 'Vitendo vya haraka',
  manageBooking: 'Dhibiti mahudhurio',
  searchNewTrips: 'Tafuta safari mpya',
  bus: 'Basi',
  ferry: 'Feri',
  flights: 'Ndege',
  train: 'Treni',
  stays: 'Malazi',
  experiences: 'Matukio',
  bookings: 'Mahudhurio',
  recentBookings: 'Mahudhurio ya hivi karibuni',
  viewAll: 'Tazama zote',
  language: 'Lugha',
  english: 'Kiingereza',
  swahili: 'Kiswahili',
  french: 'Kifaransa',
  loadingAccount: 'Inapakia akaunti...',
  operatorDashboard: 'Dashibodi ya Mwendeshaji',
  selectOperator: 'Chagua Mwendeshaji',
  schedules: 'Ratiba',
  fleet: 'Gari',
  manifest: 'Orodha ya Abiria',
  revenue: 'Mapato',
  totalBookings: 'Mahudhurio yote',
  confirmedBookings: 'Yamethibitishwa',
  pendingBookings: 'Yanasubiri',
  cancelledBookings: 'Yamekatishwa',
  totalRevenue: 'Mapato yote',
  activeTrips: 'Safari zinazoendelea',
  activeSailings: 'Safari za feri zinazoendelea',
  availableSeats: 'Viti vilivyobaki',
  totalCapacity: 'Uwezo wote',
  capacityUtil: 'Matumizi ya uwezo',
  vessel: 'Chombo',
  vesselName: 'Jina la chombo',
  departurePort: 'Bandari ya kwondo',
  arrivalPort: 'Bandari ya kufika',
  departureTime: 'Kuondoka',
  arrivalTime: 'Kufika',
  busModel: 'Aina ya basi',
  registrationNo: 'Namba ya usajili',
  busClass: 'Daraja',
  route: 'Njia',
  date: 'Tarehe',
  customer: 'Mteja',
  phone: 'Simu',
  amount: 'Kiasi',
  status: 'Hali',
  confirmed: 'Imethibitishwa',
  pending: 'Inasubiri',
  refunded: 'Imerudishiwa',
  noBookings: 'Hakuna mahudhurio yaliyopatikana.',
  noSchedules: 'Hakuna ratiba zilizowekwa.',
  operatorPortal: 'Lango la Mwendeshaji',
  busOperators: 'Wendeshaji wa Basi',
  ferryOperators: 'Wendeshaji wa Feri',
  searchOperator: 'Tafuta mwendeshaji...',
  mgmtConsole: 'Kituo cha Usimamizi',
  fleetManagement: 'Usimamizi wa Magari',
  vesselManagement: 'Usimamizi wa Vombo',
  scheduleManagement: 'Usimamizi wa Ratiba',
  bookingManagement: 'Usimamizi wa Mahudhurio',
  analytics: 'Uchambuzi',
  addTrip: 'Ongeza Safari',
  addSailing: 'Ongeza Safari ya Feri',
  addVehicle: 'Ongeza Gari',
  addVessel: 'Ongeza Chombo',
  editSchedule: 'Hariri Ratiba',
  vehicleStatus: 'Hali ya Gari',
  vesselStatus: 'Hali ya Chombo',
  lastService: 'Huduma ya Mwisho',
  lastInspection: 'Ukaguzi wa Mwisho',
  mileage: 'Kilomita',
  yearBuilt: 'Mwaka wa Ujenzi',
  assignedTo: 'Imekabidhiwa',
  unassigned: 'Haijakabidhiwa',
  active: 'Inafanya Kazi',
  maintenance: 'Inarekebishwa',
  retired: 'Imestaafu',
  dryDock: 'Ku Dry Dock',
  scheduled: 'Imepangwa',
  boarding: 'Wapandaji',
  departed: 'Imeondoka',
  bookedSeats: 'Yaliyotolewa',
  totalSeats: 'Viti Vyote',
  seatNumbers: 'Viti',
  classBooked: 'Daraja',
  bookedAt: 'Imetolewa',
  revenueTrend: 'Mwelekeo wa Mapato',
  dailyRevenue: 'Mapato ya Kila Siku',
  last14Days: 'Siku 14 zilizopita',
  backToSite: 'Rudi kwenye Tovuti',
  mgmtOverview: 'Muhtasari wa Shughuli',
  totalVehicles: 'Magari Yote',
  totalVessels: 'Vombo Vyote',
  activeVehicles: 'Magari Yanayofanya Kazi',
  inMaintenance: 'Yanarekebishwa',
  occupancyRate: 'Kiwango cha Ujazo',
  avgFare: 'Nafasi Wastani',
  confirmAction: 'Thibitisha',
  cancelBooking: 'Katisha Mahudhurio',
  refundBooking: 'Rudisha Pesa',
  viewDetails: 'Tazama Maelezo',
  searchBookings: 'Tafuta mahudhurio...',
  allStatuses: 'Hali Zote',
  noVehicles: 'Hakuna magari.',
  noVessels: 'Hakuna vombo vilivyosajiliwa.',
  operations: 'Shughuli',
  savedTrips: 'Zilizohifadhiwa',
  paymentMethods: 'Njia za Malipo',
  promoCodes: 'Kodi za Punguzo',
  goodMorning: 'Habari ya asubuhi',
  goodAfternoon: 'Habari ya mchana',
  goodEvening: 'Habari ya jioni',
};

const fr: Partial<TranslationMap> = {
  dashboard: 'Tableau de bord',
  overview: 'Vue d’ensemble',
  profile: 'Profil',
  allBookings: 'Toutes les réservations',
  busBookings: 'Bus',
  ferryBookings: 'Ferry',
  flightBookings: 'Vols',
  trainBookings: 'Train',
  stayBookings: 'Hébergements',
  experienceBookings: 'Activités',
  settings: 'Paramètres',
  signOut: 'Se déconnecter',
  welcomeBack: 'Ravi de vous revoir',
  upcomingTrips: 'Voyages à venir',
  completedTrips: 'Terminés',
  totalSpent: 'Dépenses totales',
  travelModes: 'Modes de voyage',
  tripHistory: 'Historique des voyages',
  nextTrip: 'Prochain voyage',
  noTripsCategory: 'Aucun voyage dans cette catégorie.',
  bookNextTrip: 'Réserver votre prochain voyage',
  all: 'Tout',
  upcoming: 'À venir',
  completed: 'Terminés',
  cancelled: 'Annulés',
  trip: 'voyage',
  trips: 'voyages',
  passenger: 'passager',
  passengers: 'passagers',
  ref: 'Réf.',
  daysAway: 'jours restants',
  dayAway: 'jour restant',
  today: 'Aujourd’hui',
  name: 'Nom',
  email: 'E-mail',
  signInMethod: 'Méthode de connexion',
  emailPassword: 'E-mail et mot de passe',
  google: 'Google',
  apple: 'Apple',
  quickActions: 'Actions rapides',
  manageBooking: 'Gérer une réservation',
  searchNewTrips: 'Rechercher des voyages',
  bus: 'Bus',
  ferry: 'Ferry',
  flights: 'Vols',
  train: 'Train',
  stays: 'Hébergements',
  experiences: 'Activités',
  bookings: 'Réservations',
  recentBookings: 'Réservations récentes',
  viewAll: 'Tout voir',
  language: 'Langue',
  english: 'Anglais',
  swahili: 'Swahili',
  french: 'Français',
  loadingAccount: 'Chargement du compte…',
};

const TRANSLATIONS: Partial<Record<Language, Partial<TranslationMap>>> = { en, sw, fr };

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  tp: (key: PublicTranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function loadLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'sw' || stored === 'fr') return stored;
  } catch (error) {
    console.warn('Unable to read the saved Travelar language preference.', error);
  }
  return 'en';
}

function saveLang(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.warn('Unable to save the Travelar language preference.', error);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const userSelectedLanguage = useRef(false);

  useEffect(() => {
    if (!userSelectedLanguage.current) {
      setLangState(loadLang());
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    userSelectedLanguage.current = true;
    saveLang(newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return TRANSLATIONS[lang]?.[key] ?? en[key];
  }, [lang]);
  const tp = useCallback((key: PublicTranslationKey) => {
    const entry = PUBLIC_TRANSLATIONS[key];
    return entry?.[lang] ?? entry?.en ?? key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tp }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { TranslationKey };
