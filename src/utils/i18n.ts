export type SupportedLanguage = 'en' | 'fr';

const STORAGE_LANG_KEY = 'judmispark_lang_preference';

export const translations = {
  en: {
    // Header & Brand
    tagline: 'Voice-Verified Social & Dating Platform',
    signIn: 'Sign In',
    createAccount: 'Create Account',
    join: 'Join',
    features: 'Features',
    howItWorks: 'How It Works',
    safety: 'Safety & Verification',
    cities: 'Cities',

    // Hero
    heroBadge: "Cameroon & Global Voice-Verified Social & Dating",
    heroTitle1: "Real People. Real Voices.",
    heroTitle2: "Zero Catfish.",
    heroSubtitle: "Connect authentically across Cameroon and worldwide. Hear their real voice before matching, post 24-hour spontaneous LinkUps, join safe talk rooms, and earn Spark rewards.",
    createAccountBtn: "Create Your Account",
    alreadyMember: "Already a member? Sign In",
    mandatoryVoice: "Mandatory Voice Verification",
    spontaneous24h: "Spontaneous 24h LinkUps",
    antiCatfish: "100% Anti-Catfish Safety",
    momoReady: "MTN & Orange Money Ready",

    // Core Features
    builtForRealLife: "Built for Real Life",
    featuresTitle: "Everything You Need to Connect Confidently",
    featuresDesc: "JudmiSpark combines genuine identity verification with spontaneous Cameroon & international social culture.",
    voiceFirstTitle: "Voice-First Matching",
    voiceFirstDesc: "Photos can deceive, but voices are authentic. Every member records a permanent voice intro, ensuring you hear real accents, warmth, and personality before meeting.",
    linkupsTitle: "Spontaneous 24h LinkUps",
    linkupsDesc: "No more weeks of endless small talk. Post a prompt to grab coffee, drinks, street food, or watch a match today. Posts automatically expire after 24 hours.",
    talkTitle: "Safe Community Talk",
    talkDesc: "A judgment-free space to seek relationship advice, express feelings of loneliness or depression, and get thoughtful replies from the community, with full anonymous posting support.",
    eventsTitle: "VIP Gatherings & Events",
    eventsDesc: "Discover rooftop parties, speed-dating mixers, campus networking, and acoustic concerts happening right in your city. RSVP and chat with attendees in advance.",
    walletTitle: "Spark Wallet & MoMo Cashout",
    walletDesc: "Send virtual Sparks to show genuine interest or tip advice contributors. Sparks can be withdrawn directly to your MTN Mobile Money, Orange Money, or local account.",
    protectedChatTitle: "Protected Communication",
    protectedChatDesc: "New matches must exchange voice notes to unlock unlimited chatting, keeping scammers, romance fraudsters, and automated bots completely off the platform.",

    // How it works
    howItWorksBadge: "Simple & Transparent",
    howItWorksTitle: "How JudmiSpark Works",
    howItWorksDesc: "Get started in three easy steps and start connecting within minutes.",
    step1Title: "Record Your Voice",
    step1Desc: "Sign up with your phone number and record a brief 5-second voice introduction. This verifies you are a real person.",
    step2Title: "Discover & Match",
    step2Desc: "Browse verified profiles in your city, reply to spontaneous 24-hour LinkUps, or participate in safe community discussion rooms.",
    step3Title: "Connect in Real Life",
    step3Desc: "Exchange voice messages to unlock private chats, schedule a safe public meetup, attend VIP events, and build lasting relationships.",

    // Safety
    safetyBadge: "Safety & Trust Pledge",
    safetyTitle: "Zero Tolerance for Catfishing, Scams & Harassment",
    safetyDesc: "We believe online dating should be transparent, respectful, and safe. That's why every account must undergo permanent voice note verification. Our platform features built-in voice identity reports, one-tap blocking, and 24/7 moderation.",
    voiceReports: "Voice Identity Reports",
    voiceReportsDesc: "Easily report users whose chat voice does not match their verified registration recording.",
    oneTapBlock: "One-Tap Block",
    oneTapBlockDesc: "Block any contact instantly. Blocked users will never see your profile or posts again.",
    anonymousPosting: "Anonymous Posting",
    anonymousPostingDesc: "Share sensitive personal questions or mental health struggles without exposing your identity.",

    // Cities
    citiesBadge: "Local Hubs",
    citiesTitle: "Serving Cameroon & Worldwide Hubs",
    citiesDesc: "Connecting singles, professionals & friends across Cameroon, Africa, and internationally.",

    // Bottom CTA
    ctaTitle: "Ready to Find Your Genuine Spark?",
    ctaDesc: "Join thousands of verified members today. Registration is free, safe, and takes less than 2 minutes.",

    // Sign In Modal
    signInTitle: "Sign In",
    signInSubtitle: "Access your JudmiSpark account",
    phoneLabel: "Mobile Phone Number",
    pinLabel: "Security PIN / Password",
    noAccount: "Don't have an account? Create one",
    accountNotFound: "No account found with this phone number. Please check the number or create an account.",

    // Profile & Settings
    language: "Language",
    nationality: "Nationality",
    townCity: "Town / City",
    country: "Country",
    editProfile: "Edit Profile",
    logOut: "Log Out",
    sparksBalance: "Sparks Balance",
    depositMoMo: "Deposit via Mobile Money",
    withdrawMoMo: "Withdraw MoMo",
    premiumVip: "Premium VIP",
    referralProgram: "Referral Program",
    switchLanguage: "Change Language",
    saveChanges: "Save Changes",
    cancel: "Cancel"
  },
  fr: {
    // Header & Brand
    tagline: 'Réseau Social et Rencontres Vérifiés par la Voix',
    signIn: 'Connexion',
    createAccount: 'Créer un compte',
    join: 'Rejoindre',
    features: 'Fonctionnalités',
    howItWorks: 'Comment ça marche',
    safety: 'Sécurité & Vérification',
    cities: 'Villes',

    // Hero
    heroBadge: "Cameroun & Monde : Rencontres Vérifiées par la Voix",
    heroTitle1: "De Vraies Personnes. De Vraies Voix.",
    heroTitle2: "Zéro Faux Profil.",
    heroSubtitle: "Connectez-vous authentiquement au Cameroun et partout dans le monde. Écoutez leur vraie voix avant de matcher, publiez des LinkUps spontanés de 24h, rejoignez des salons d'écoute bienveillants et gagnez des récompenses Spark.",
    createAccountBtn: "Créer votre compte gratuit",
    alreadyMember: "Déjà membre ? Se connecter",
    mandatoryVoice: "Vérification Vocale Obligatoire",
    spontaneous24h: "LinkUps Spontanés 24h",
    antiCatfish: "100% Anti-Usurpation d'Identité",
    momoReady: "Compatible MTN MoMo & Orange Money",

    // Core Features
    builtForRealLife: "Pensé pour la Vraie Vie",
    featuresTitle: "Tout ce qu'il vous faut pour échanger en confiance",
    featuresDesc: "JudmiSpark combine une vérification stricte de l'identité avec la convivialité des rencontres locales et internationales.",
    voiceFirstTitle: "Rencontres par la Voix",
    voiceFirstDesc: "Les photos peuvent tromper, mais la voix est authentique. Chaque membre enregistre un message vocal d'introduction pour découvrir les vrais accents et émotions avant de se voir.",
    linkupsTitle: "LinkUps Spontanés 24h",
    linkupsDesc: "Fini les semaines de bavardages inutiles. Proposez une sortie pour un café, un verre, un resto ou un match aujourd'hui. L'annonce disparaît automatiquement après 24 heures.",
    talkTitle: "Espace d'Écoute & Conseils",
    talkDesc: "Un espace sans jugement pour demander des conseils relationnels, parler de solitude ou de baisse de moral en tout anonymat avec la communauté.",
    eventsTitle: "Soirées & Événements VIP",
    eventsDesc: "Découvrez des soirées sur les toits, des speed-datings, des rencontres étudiantes et des concerts acoustiques dans votre ville. Réservez et échangez avec les participants.",
    walletTitle: "Portefeuille Spark & Retraits MoMo",
    walletDesc: "Envoyez des Sparks virtuels pour marquer votre intérêt ou remercier un membre. Les Sparks sont retirables directement sur votre compte MTN Mobile Money ou Orange Money.",
    protectedChatTitle: "Communication Sécurisée",
    protectedChatDesc: "Les nouveaux contacts doivent échanger des notes vocales pour débloquer la messagerie illimitée, protégeant ainsi la communauté contre les arnaqueurs et les faux comptes.",

    // How it works
    howItWorksBadge: "Simple & Transparent",
    howItWorksTitle: "Comment Fonctionne JudmiSpark",
    howItWorksDesc: "Démarrez en trois étapes simples et commencez à échanger en quelques minutes.",
    step1Title: "Enregistrez votre Voix",
    step1Desc: "Inscrivez-vous avec votre numéro et enregistrez une courte présentation vocale de 5 secondes prouvant que vous êtes bien une vraie personne.",
    step2Title: "Découvrez & Matchez",
    step2Desc: "Parcourez les profils vérifiés de votre ville, répondez aux LinkUps 24h ou participez aux échanges dans les salons thématiques.",
    step3Title: "Rencontrez-vous en Vrai",
    step3Desc: "Échangez des messages vocaux pour débloquer le chat, organisez une rencontre en toute sécurité et participez aux événements VIP.",

    // Safety
    safetyBadge: "Garantie de Sécurité & Confiance",
    safetyTitle: "Tolérance Zéro pour les Faux Profils et le Harcèlement",
    safetyDesc: "Les rencontres doivent être transparentes, respectueuses et sécurisées. Chaque compte passe une vérification vocale obligatoire. Notre plateforme intègre des signalements d'identité vocale, le blocage en un clic et une modération 24h/24.",
    voiceReports: "Signalements d'Identité Vocale",
    voiceReportsDesc: "Signalez facilement un utilisateur dont la voix en conversation ne correspond pas à son enregistrement vocal certifié.",
    oneTapBlock: "Blocage en Un Clic",
    oneTapBlockDesc: "Bloquez un contact instantanément. Il ne pourra plus jamais voir votre profil ni vos publications.",
    anonymousPosting: "Publication Anonyme",
    anonymousPostingDesc: "Partagez vos questions intimes ou vos doutes personnels en tout anonymat.",

    // Cities
    citiesBadge: "Pôles Urbains",
    citiesTitle: "Disponible au Cameroun et à l'International",
    citiesDesc: "Rapprocher célibataires, étudiants et professionnels au Cameroun, en Afrique et dans la diaspora.",

    // Bottom CTA
    ctaTitle: "Prêt(e) à trouver votre véritable étincelle ?",
    ctaDesc: "Rejoignez des milliers de membres vérifiés dès aujourd'hui. L'inscription est gratuite, sécurisée et prend moins de 2 minutes.",

    // Sign In Modal
    signInTitle: "Connexion",
    signInSubtitle: "Accédez à votre compte JudmiSpark",
    phoneLabel: "Numéro de Téléphone Mobile",
    pinLabel: "Code PIN / Mot de Passe",
    noAccount: "Pas encore de compte ? En créer un",
    accountNotFound: "Aucun compte trouvé avec ce numéro. Veuillez vérifier le numéro ou créer un compte.",

    // Profile & Settings
    language: "Langue",
    nationality: "Nationalité",
    townCity: "Ville / Localité",
    country: "Pays",
    editProfile: "Modifier le profil",
    logOut: "Se déconnecter",
    sparksBalance: "Solde de Sparks",
    depositMoMo: "Déposer via Mobile Money",
    withdrawMoMo: "Retirer MoMo",
    premiumVip: "VIP Premium",
    referralProgram: "Programme de Parrainage",
    switchLanguage: "Changer de Langue",
    saveChanges: "Enregistrer les modifications",
    cancel: "Annuler"
  }
};

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(STORAGE_LANG_KEY);
  if (saved === 'fr' || saved === 'en') return saved;
  return 'en';
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_LANG_KEY, lang);
  window.dispatchEvent(new CustomEvent('judmispark_language_changed', { detail: lang }));
}

export function useTranslation(lang?: SupportedLanguage) {
  const currentLang = lang || getStoredLanguage();
  return {
    lang: currentLang,
    t: translations[currentLang],
    setLanguage: setStoredLanguage
  };
}
