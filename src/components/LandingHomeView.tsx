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
  Mail,
  Compass,
  Edit3
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

  return (
    <div className="min-h-screen bg-[#FAF4F0] text-[#2D151E] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#FF4A70] selection:text-white">
      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#FAF4F0]/90 backdrop-blur-md border-b border-[#F0E2DA] w-full">
        <div className="max-w-md sm:max-w-xl md:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand Logo with Coral 'J' circle as in screenshot */}
          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] flex items-center justify-center text-white font-black text-sm shadow-md shadow-rose-500/20 shrink-0">
              J
            </div>
            <span className="text-lg font-black tracking-tight text-[#2D151E] block">
              JudmiSpark
            </span>
          </div>

          {/* Action Buttons & Language Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switch Button */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="py-1 px-2.5 rounded-full bg-[#F2E7DF] hover:bg-[#EBDED6] text-[#2D151E] text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-[#E5D7CE]"
              title={lang === 'en' ? 'Passer en Français' : 'Switch to English'}
            >
              <span className={lang === 'en' ? 'text-[#FF4A70]' : 'text-[#8A767E]'}>EN</span>
              <span className="text-[#8A767E] text-[10px]">/</span>
              <span className={lang === 'fr' ? 'text-[#FF4A70]' : 'text-[#8A767E]'}>FR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginError(null);
                setIsLoginModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-full bg-white hover:bg-[#F8EFE9] text-[#2D151E] text-xs font-bold border border-[#EADBD2] shadow-xs transition cursor-pointer shrink-0"
            >
              {t.signIn}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION - EXACT MATCH TO Screenshot_20260923-123501.jpg */}
      <main className="flex-1 max-w-md sm:max-w-lg mx-auto w-full px-5 pt-8 pb-16 flex flex-col justify-between space-y-8">
        <div className="space-y-6">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl font-black text-[#2D151E] tracking-tight leading-[1.08]">
            Hear people <br />
            before you <br />
            <span className="text-[#FF4A70]">meet them.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#7A666F] text-sm sm:text-base leading-relaxed">
            Every JudmiSpark account carries a permanent voice introduction. No silent strangers — a real voice, a real town, real people near you.
          </p>

          {/* FEATURE CARD: "EVERY PROFILE HAS ONE" */}
          <div className="bg-white/95 rounded-[28px] border border-[#F2E5DD] p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/25">
              <Mic size={20} className="stroke-[2.5]" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold tracking-widest text-[#937F87] uppercase block mb-1.5">
                EVERY PROFILE HAS ONE
              </span>
              
              {/* Graphic Waveform Equalizer */}
              <div className="flex items-end gap-1 h-6">
                {[8, 14, 22, 10, 18, 6, 12, 24, 16, 8, 12, 20, 14, 6, 10].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1 bg-[#FF4A70] rounded-full transition-all duration-300"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* BULLET FEATURES LIST */}
          <ul className="space-y-3.5 pt-2 text-[#7A666F] text-sm font-medium">
            <li className="flex items-center gap-3">
              <span className="text-base text-[#937F87]">⦿</span>
              <span className="text-[#2D151E] font-semibold">Discover people in your town</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-base">⚡</span>
              <span className="text-[#2D151E] font-semibold">Link Up with anyone free today</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-base">✎</span>
              <span className="text-[#2D151E] font-semibold">Talk when you need someone to listen</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-base">⊞</span>
              <span className="text-[#2D151E] font-semibold">Real events, real rooms, real faces</span>
            </li>
          </ul>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="space-y-3 pt-6">
          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-base shadow-lg shadow-rose-500/25 transition cursor-pointer text-center"
          >
            Create your account
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginError(null);
              setIsLoginModalOpen(true);
            }}
            className="w-full py-4 px-6 rounded-full bg-white hover:bg-[#F8EFEA] text-[#2D151E] font-extrabold text-base border border-[#F0DFD7] shadow-sm transition cursor-pointer text-center"
          >
            I already have an account
          </button>
        </div>
      </main>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF4F0] border border-[#EBDED6] rounded-[28px] max-w-sm w-full p-6 space-y-5 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE3DB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] text-white flex items-center justify-center font-bold text-sm">
                  J
                </div>
                <h3 className="text-base font-extrabold text-[#2D151E]">
                  {t.signInTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F2E7DF] text-[#7A666F] hover:text-[#2D151E] flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A767E] mb-1.5">
                  {lang === 'fr' ? 'Adresse Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. gabyjay16@gmail.com"
                    className="w-full bg-white border border-[#E5D7CE] rounded-2xl py-3 px-4 text-xs font-medium text-[#2D151E] placeholder:text-[#A8969E] focus:outline-none focus:border-[#FF4A70]"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A767E]">
                    <Mail size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A767E] mb-1.5">
                  {lang === 'fr' ? 'Mot de passe' : 'Password'} (6 {lang === 'fr' ? 'caractères' : 'characters'})
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={20}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-white border border-[#E5D7CE] rounded-2xl py-3 px-4 text-xs font-medium text-[#2D151E] placeholder:text-[#A8969E] focus:outline-none focus:border-[#FF4A70]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A767E] hover:text-[#2D151E] cursor-pointer"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-sm shadow-md shadow-rose-500/25 transition cursor-pointer hover:opacity-95"
              >
                {t.signIn}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  onOpenRegister();
                }}
                className="text-xs font-bold text-[#FF4A70] hover:underline cursor-pointer"
              >
                {t.noAccount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
