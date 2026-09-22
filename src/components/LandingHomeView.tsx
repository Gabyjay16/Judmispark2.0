import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Mic, 
  Zap, 
  HeartHandshake, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  Users, 
  MessageCircle, 
  HelpCircle, 
  ChevronRight,
  Languages,
  Globe,
  Mail
} from 'lucide-react';
import { UserProfile, TownLocation } from '../types';
import { storage } from '../utils/storage';
import { 
  getStoredLanguage, 
  setStoredLanguage, 
  SupportedLanguage, 
  translations 
} from '../utils/i18n';

interface LandingHomeViewProps {
  onOpenRegister: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

const CAMEROON_TOWNS = [
  { name: 'Bamenda', subtitle: 'Acoustic vibes, Up Station & scenic hills', icon: '⛰️' },
  { name: 'Douala', subtitle: 'Bonapriso lounges & coastal energy', icon: '🏙️' },
  { name: 'Yaoundé', subtitle: 'Bastos cafes, art & vibrant culture', icon: '☕' },
  { name: 'Buea', subtitle: 'Silicon Mountain tech & Mount Cameroon', icon: '🌋' },
  { name: 'Limbe', subtitle: 'Down Beach sunsets & seaside chill', icon: '🌊' },
  { name: 'Bafoussam', subtitle: 'Cultural heritage & scenic views', icon: '🌄' },
  { name: 'Garoua', subtitle: 'Warm hospitality & northern charm', icon: '☀️' },
  { name: 'Kumba', subtitle: 'Friendly gatherings & bustling city', icon: '🌴' }
];

const GLOBAL_HUBS = [
  { name: 'Lagos', country: 'Nigeria 🇳🇬', icon: '🌆' },
  { name: 'Abidjan', country: "Côte d'Ivoire 🇨🇮", icon: '🌴' },
  { name: 'Dakar', country: 'Sénégal 🇸🇳', icon: '🌊' },
  { name: 'Paris', country: 'France 🇫🇷', icon: '🗼' },
  { name: 'London', country: 'UK 🇬🇧', icon: '🎡' },
  { name: 'New York', country: 'USA 🇺🇸', icon: '🗽' },
  { name: 'Montreal', country: 'Canada 🇨🇦', icon: '🍁' },
  { name: 'Johannesburg', country: 'South Africa 🇿🇦', icon: '🦁' }
];

export const LandingHomeView: React.FC<LandingHomeViewProps> = ({
  onOpenRegister,
  onLoginSuccess
}) => {
  const [lang, setLang] = useState<SupportedLanguage>(getStoredLanguage());
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail) setLang(e.detail);
    };
    window.addEventListener('judmispark_language_changed', handleLangChange);
    return () => window.removeEventListener('judmispark_language_changed', handleLangChange);
  }, []);

  const t = translations[lang];

  const toggleLanguage = () => {
    const nextLang: SupportedLanguage = lang === 'en' ? 'fr' : 'en';
    setLang(nextLang);
    setStoredLanguage(nextLang);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setLoginError(lang === 'fr' ? 'Veuillez entrer votre adresse email' : 'Please enter your email address');
      return;
    }
    if (!pinInput.trim()) {
      setLoginError(lang === 'fr' ? 'Veuillez entrer votre mot de passe (6 caractères)' : 'Please enter your 6-character password');
      return;
    }

    const res = storage.loginUserWithEmail(emailInput, pinInput);
    if (res.success && res.user) {
      setLoginError(null);
      setIsLoginModalOpen(false);
      onLoginSuccess(res.user);
    } else {
      setLoginError(res.message || (lang === 'fr' ? 'Email ou mot de passe incorrect.' : 'Incorrect email or password.'));
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-rose-500 selection:text-white">
      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-850 w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 cursor-pointer select-none">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-lg shadow-rose-500/30 shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-black tracking-tight text-white block truncate">
                Judmi<span className="text-rose-500">Spark</span>
              </span>
              <span className="hidden sm:block text-[11px] text-neutral-400 -mt-0.5 font-medium truncate">
                {t.tagline}
              </span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
            <button 
              type="button" 
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition cursor-pointer"
            >
              {t.features}
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition cursor-pointer"
            >
              {t.howItWorks}
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('safety')}
              className="hover:text-white transition cursor-pointer"
            >
              {t.safety}
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('cities')}
              className="hover:text-white transition cursor-pointer"
            >
              {t.cities}
            </button>
          </nav>

          {/* Action Buttons & Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Switch Button */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="py-1.5 px-2 sm:px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-bold border border-neutral-750 transition cursor-pointer flex items-center gap-1"
              title={lang === 'en' ? 'Passer en Français' : 'Switch to English'}
            >
              <Languages size={13} className="text-rose-400" />
              <span>{lang === 'en' ? 'FR 🇫🇷' : 'EN 🇬🇧'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginError(null);
                setIsLoginModalOpen(true);
              }}
              className="py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-bold border border-neutral-750 transition cursor-pointer shrink-0"
            >
              {t.signIn}
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="py-1.5 sm:py-2 px-3 sm:px-4.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-extrabold shadow-lg shadow-rose-500/25 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span className="sm:inline hidden">{t.createAccount}</span>
              <span className="sm:hidden">{t.join}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 bg-gradient-to-b from-neutral-900/60 via-neutral-950 to-neutral-950 border-b border-neutral-850">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold shadow-sm">
            <Sparkles size={14} />
            <span>{t.heroBadge}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            {t.heroTitle1} <br />
            <span className="bg-gradient-to-r from-rose-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              {t.heroTitle2}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-300 text-xs sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-xl shadow-rose-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t.createAccountBtn}</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginError(null);
                setIsLoginModalOpen(true);
              }}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-750 font-bold text-sm transition cursor-pointer"
            >
              {t.alreadyMember}
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-rose-400 font-bold text-xs flex items-center gap-1.5">
                <Mic size={14} />
                <span>{lang === 'fr' ? 'Audio Certifié' : 'Voice-First'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">{t.mandatoryVoice}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-pink-400 font-bold text-xs flex items-center gap-1.5">
                <Zap size={14} />
                <span>{lang === 'fr' ? 'Spontané' : 'Real-Time'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">{t.spontaneous24h}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>{lang === 'fr' ? '100% Sûr' : 'Zero Fake'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">{t.antiCatfish}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <Wallet size={14} />
                <span>{lang === 'fr' ? 'MoMo & Sparks' : 'Spark Wallet'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">{t.momoReady}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-20 px-4 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-rose-400 font-bold text-xs uppercase tracking-wider">{t.builtForRealLife}</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t.featuresTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            {t.featuresDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 1: Voice-First Matching */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xl">
              <Mic size={24} />
            </div>
            <h3 className="text-base font-bold text-white">{t.voiceFirstTitle}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.voiceFirstDesc}
            </p>
          </div>

          {/* Feature 2: Spontaneous LinkUps */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-xl">
              <Zap size={24} />
            </div>
            <h3 className="text-base font-bold text-white">{t.linkupsTitle}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.linkupsDesc}
            </p>
          </div>

          {/* Feature 3: Safe Community Talk */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xl">
              <HeartHandshake size={24} />
            </div>
            <h3 className="text-base font-bold text-white">{t.talkTitle}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.talkDesc}
            </p>
          </div>

          {/* Feature 4: VIP Local Events */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl">
              <Calendar size={24} />
            </div>
            <h3 className="text-base font-bold text-white">{t.eventsTitle}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.eventsDesc}
            </p>
          </div>

          {/* Feature 5: Spark Wallet & Mobile Money */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl">
              <Wallet size={24} />
            </div>
            <h3 className="text-base font-bold text-white">{t.walletTitle}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.walletDesc}
            </p>
          </div>

          {/* Feature 6: Voice-Secured Chat */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-white">{t.protectedChatTitle}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.protectedChatDesc}
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-4 bg-neutral-900/40 border-y border-neutral-850">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-rose-400 font-bold text-xs uppercase tracking-wider">{t.howItWorksBadge}</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {t.howItWorksTitle}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {t.howItWorksDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3 relative">
              <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white font-black flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <h3 className="text-base font-bold text-white">{t.step1Title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.step1Desc}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3 relative">
              <div className="w-9 h-9 rounded-2xl bg-pink-500 text-white font-black flex items-center justify-center text-sm shadow-md">
                2
              </div>
              <h3 className="text-base font-bold text-white">{t.step2Title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.step2Desc}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3 relative">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-sm shadow-md">
                3
              </div>
              <h3 className="text-base font-bold text-white">{t.step3Title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY & ANTI-CATFISH PLEDGE */}
      <section id="safety" className="py-20 px-4 max-w-5xl mx-auto w-full space-y-10">
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-rose-950/30 border border-rose-500/30 rounded-3xl p-8 sm:p-12 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-3">
            <span className="text-rose-400 font-bold text-xs uppercase tracking-wider">{t.safetyBadge}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t.safetyTitle}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {t.safetyDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{t.voiceReports}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t.voiceReportsDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{t.oneTapBlock}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t.oneTapBlockDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{t.anonymousPosting}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t.anonymousPostingDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CITIES & INTERNATIONAL HUBS */}
      <section id="cities" className="py-20 px-4 bg-neutral-900/30 border-t border-neutral-850">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-rose-400 font-bold text-xs uppercase tracking-wider">{t.citiesBadge}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{t.citiesTitle}</h2>
            </div>
            <p className="text-xs text-neutral-400">{t.citiesDesc}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
              <span>🇨🇲</span>
              <span>{lang === 'fr' ? 'Villes au Cameroun' : 'Cameroon Cities'}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CAMEROON_TOWNS.map(town => (
                <div 
                  key={town.name}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="text-2xl mb-1">{town.icon}</div>
                  <h4 className="text-sm font-bold text-white">{town.name}</h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{town.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
              <Globe size={14} />
              <span>{lang === 'fr' ? 'Pôles Internationaux & Diaspora' : 'Global Hubs & International Members'}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GLOBAL_HUBS.map(hub => (
                <div 
                  key={hub.name}
                  className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 transition flex items-center gap-2.5"
                >
                  <div className="text-xl shrink-0">{hub.icon}</div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{hub.name}</h4>
                    <p className="text-[10px] text-neutral-400 truncate">{hub.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-20 px-4 max-w-4xl mx-auto w-full text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-white">
          {t.ctaTitle}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed">
          {t.ctaDesc}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-xl shadow-rose-500/25 transition cursor-pointer"
          >
            {t.createAccountBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginError(null);
              setIsLoginModalOpen(true);
            }}
            className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-750 font-bold text-sm transition cursor-pointer"
          >
            {t.signIn}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-neutral-950 border-t border-neutral-900 py-10 px-4 text-xs text-neutral-500 space-y-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-300 font-bold">
            <span className="text-base text-rose-500">⚡</span>
            <span className="text-white text-sm">JudmiSpark</span>
            <span>•</span>
            <span className="text-neutral-400 font-normal">judmispark.com</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-neutral-400 text-xs">
            <button
              type="button"
              onClick={toggleLanguage}
              className="text-rose-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Languages size={13} />
              <span>{lang === 'en' ? 'Passer en Français (FR)' : 'Switch to English (EN)'}</span>
            </button>
            <span className="text-neutral-600">|</span>
            <button type="button" onClick={() => scrollToSection('safety')} className="hover:text-white transition cursor-pointer">
              {t.safety}
            </button>
            <button type="button" onClick={() => scrollToSection('features')} className="hover:text-white transition cursor-pointer">
              {t.features}
            </button>
            <button type="button" onClick={() => scrollToSection('cities')} className="hover:text-white transition cursor-pointer">
              {t.cities}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center border-t border-neutral-900/80 pt-6">
          <p className="text-[11px] text-neutral-600">
            © 2026 JudmiSpark. {lang === 'fr' ? 'Tous droits réservés. Réseau social et rencontres certifiés par la voix au Cameroun et dans le monde.' : 'All rights reserved. Voice-verified social & dating community in Cameroon and worldwide.'}
          </p>
        </div>
      </footer>

      {/* PRODUCTION SIGN IN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Phone size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t.signInTitle}</h3>
                  <p className="text-[11px] text-neutral-400">{t.signInSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginError(null);
                }}
                className="text-neutral-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                  {lang === 'fr' ? 'Adresse Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="email"
                    placeholder="e.g. gabyjay16@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                  {lang === 'fr' ? 'Mot de passe (6 caractères)' : 'Password (6 characters)'}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    placeholder={lang === 'fr' ? 'Mot de passe (6 caractères)' : 'Enter 6-character password'}
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Quick Fill Demo Login */}
              <div className="pt-1">
                <p className="text-[10px] text-neutral-500 mb-1.5 font-medium">
                  {lang === 'fr' ? 'Comptes de démonstration rapide :' : 'Quick Demo Accounts:'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('gabyjay16@gmail.com');
                      setPinInput('123456');
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                  >
                    👑 gabyjay16@gmail.com (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('sarah.bda@gmail.com');
                      setPinInput('123456');
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer"
                  >
                    👤 sarah.bda@gmail.com
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition cursor-pointer"
                >
                  {t.signIn}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    onOpenRegister();
                  }}
                  className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium text-xs transition cursor-pointer"
                >
                  {t.noAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
