import React, { useState } from 'react';
import { 
  TownLocation, 
  RelationshipIntention, 
  UserProfile 
} from '../types';
import { AudioRecorder } from './AudioRecorder';
import { RecordedAudioData } from '../utils/audio';
import { storage } from '../utils/storage';
import { COUNTRIES, getCountryByName, CountryData } from '../utils/countries';
import { getStoredLanguage, setStoredLanguage, SupportedLanguage } from '../utils/i18n';
import { 
  User, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Lock, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Crown, 
  Globe, 
  Languages,
  Eye,
  EyeOff,
  Mail
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (user: UserProfile) => void;
}

interface IntentionOption {
  value: RelationshipIntention;
  icon: string;
  labelEn: string;
  labelFr: string;
  descEn: string;
  descFr: string;
}

const RELATIONSHIP_INTENTIONS_LIST: IntentionOption[] = [
  {
    value: 'Relationship',
    icon: '❤️',
    labelEn: 'Relationship',
    labelFr: 'Relation',
    descEn: 'Committed love & deep bond',
    descFr: 'Amour sincère & durable'
  },
  {
    value: 'Marriage',
    icon: '💍',
    labelEn: 'Marriage',
    labelFr: 'Mariage',
    descEn: 'Intentional future together',
    descFr: 'Projet de vie & mariage'
  },
  {
    value: 'Friendship',
    icon: '🤝',
    labelEn: 'Friendship',
    labelFr: 'Amitié',
    descEn: 'Authentic & trusted friends',
    descFr: 'Vrais amis & confiance'
  },
  {
    value: 'Casual social connection',
    icon: '☕',
    labelEn: 'Casual Connection',
    labelFr: 'Sorties & Détente',
    descEn: 'Hangouts & good company',
    descFr: 'Sorties, cafés & détente'
  },
  {
    value: 'Networking',
    icon: '💼',
    labelEn: 'Networking',
    labelFr: 'Réseautage',
    descEn: 'Career & creative contacts',
    descFr: 'Opportunités & projets'
  },
  {
    value: 'Just meeting people',
    icon: '✨',
    labelEn: 'Just Meeting People',
    labelFr: 'Faire des rencontres',
    descEn: 'Spontaneous conversations',
    descFr: 'Échanges sans prise de tête'
  }
];

const INTEREST_OPTIONS = [
  'Music', 'Acoustic', 'Technology', 'Startups', 'Travel', 
  'Foodie', 'Art', 'Fashion', 'Fitness', 'Hiking', 
  'Photography', 'Gaming', 'Books', 'Coffee', 'Basketball'
];

const DEFAULT_AVATARS: Record<string, string> = {
  female: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  male: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'non-binary': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80'
};

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered
}) => {
  const [lang, setLang] = useState<SupportedLanguage>(getStoredLanguage());
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    pin: '',
    confirmPin: '',
    referralCode: '',
    dateOfBirth: '2000-01-01',
    gender: 'female' as 'male' | 'female' | 'non-binary' | 'other',
    genderPreference: 'everyone' as 'everyone' | 'women' | 'men',
    nationality: 'Cameroon',
    town: 'Bamenda' as TownLocation,
    customTown: '',
    neighborhood: '',
    bio: '',
    interests: ['Music', 'Travel'] as string[],
    relationshipIntentions: [] as RelationshipIntention[]
  });

  const [recordedVoice, setRecordedVoice] = useState<RecordedAudioData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCountry: CountryData = getCountryByName(formData.nationality);
  const isCameroon = currentCountry.code === 'CM';

  const toggleLang = () => {
    const nextLang: SupportedLanguage = lang === 'en' ? 'fr' : 'en';
    setLang(nextLang);
    setStoredLanguage(nextLang);
  };

  const handleCountryChange = (countryName: string) => {
    const country = getCountryByName(countryName);
    const defaultTown = country.towns[0] || 'Bamenda';
    setFormData({
      ...formData,
      nationality: country.name,
      town: defaultTown,
      customTown: '',
      phoneNumber: formData.phoneNumber.startsWith('+') ? formData.phoneNumber : country.dialCode + ' '
    });
  };

  const calculateAge = (dob: string): number => {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const handleInterestToggle = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      if (formData.interests.length < 6) {
        setFormData({
          ...formData,
          interests: [...formData.interests, interest]
        });
      }
    }
  };

  const handleIntentionToggle = (intent: RelationshipIntention) => {
    const current = formData.relationshipIntentions;
    if (current.includes(intent)) {
      // User can uncheck any checked intention
      setFormData({
        ...formData,
        relationshipIntentions: current.filter(i => i !== intent)
      });
    } else {
      if (current.length < 2) {
        setFormData({
          ...formData,
          relationshipIntentions: [...current, intent]
        });
      } else {
        // If 2 already selected, replace the 2nd one
        setFormData({
          ...formData,
          relationshipIntentions: [current[0], intent]
        });
      }
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.displayName.trim()) {
      setError(lang === 'fr' ? 'Veuillez renseigner votre nom complet et pseudo' : 'Please fill in your full name and display name');
      return;
    }
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(lang === 'fr' ? 'Veuillez entrer une adresse email valide' : 'Please enter a valid email address');
      return;
    }
    const existingUsers = storage.getUsers();
    if (existingUsers.some(u => (u.email || '').trim().toLowerCase() === cleanEmail)) {
      setError(lang === 'fr' ? 'Un compte existe déjà avec cette adresse email' : 'An account with this email already exists');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError(lang === 'fr' ? 'Veuillez entrer votre numéro de téléphone mobile' : 'Please enter your mobile phone number');
      return;
    }
    if (formData.pin.trim().length !== 6) {
      setError(lang === 'fr' ? 'Le mot de passe doit comporter exactement 6 caractères' : 'Password must be exactly 6 characters');
      return;
    }
    if (!formData.confirmPin || formData.confirmPin.trim() === '') {
      setError(lang === 'fr' ? 'Veuillez retaper votre mot de passe pour le confirmer' : 'Please retype your password to confirm');
      return;
    }
    if (formData.pin.trim() !== formData.confirmPin.trim()) {
      setError(lang === 'fr' ? 'Les deux mots de passe ne correspondent pas. Veuillez vérifier.' : 'Passwords do not match. Please verify both entries.');
      return;
    }
    if (formData.town === 'custom' && !formData.customTown.trim()) {
      setError(lang === 'fr' ? 'Veuillez entrer le nom de votre ville' : 'Please enter your town/city name');
      return;
    }
    if (formData.relationshipIntentions.length === 0) {
      setError(lang === 'fr' ? 'Veuillez cocher au moins une intention relationnelle (jusqu’à 2)' : 'Please select at least one relationship intention (up to 2)');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleVoiceCompleted = (voiceData: RecordedAudioData) => {
    setRecordedVoice(voiceData);
  };

  const handleFinalSubmit = () => {
    if (!recordedVoice) {
      setError(lang === 'fr' ? "Un enregistrement vocal de présentation est obligatoire pour valider votre compte." : 'A permanent registration voice recording is required before completing registration.');
      return;
    }

    const age = calculateAge(formData.dateOfBirth);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const newUserId = `usr_${Date.now()}`;
    const cleanDisplayName = formData.displayName.replace(/\s+/g, '').toUpperCase();
    const finalTown = formData.town === 'custom' ? formData.customTown.trim() : formData.town;

    const defaultPic = DEFAULT_AVATARS[formData.gender] || DEFAULT_AVATARS.female;
    const finalIntentions = formData.relationshipIntentions.length > 0 
      ? formData.relationshipIntentions 
      : (['Relationship'] as RelationshipIntention[]);
    const finalIntentionString = finalIntentions.join(' & ');

    const newUser: UserProfile = {
      id: newUserId,
      fullName: formData.fullName,
      displayName: formData.displayName,
      email: formData.email.trim().toLowerCase(),
      phoneNumber: formData.phoneNumber,
      pin: formData.pin.trim(),
      password: formData.pin.trim(),
      role: 'user',
      dateOfBirth: formData.dateOfBirth,
      age: age || 22,
      gender: formData.gender,
      genderPreference: formData.genderPreference,
      nationality: formData.nationality,
      countryCode: currentCountry.code,
      currency: currentCountry.currency,
      preferredLanguage: lang,
      town: finalTown,
      neighborhood: formData.neighborhood || undefined,
      profilePicture: defaultPic,
      photos: [defaultPic],
      bio: formData.bio || (lang === 'fr' ? 'Nouveau membre sur JudmiSpark ! Ravis de faire des connaissances.' : 'New member on JudmiSpark! Looking to connect.'),
      interests: formData.interests.length > 0 ? formData.interests : ['Music', 'Travel'],
      relationshipIntention: finalIntentionString,
      relationshipIntentions: finalIntentions,
      isVerified: true,
      status: 'active',
      registrationVoiceUrl: recordedVoice.blobUrl,
      registrationVoiceDuration: recordedVoice.duration,
      registrationVoiceDate: new Date().toISOString(),
      isPremium: false,
      referralCode: `${cleanDisplayName}${Math.floor(10 + Math.random() * 89)}`,
      walletId: `SPK-${randomSuffix}`,
      createdAt: new Date().toISOString()
    };

    // Save user to storage
    storage.setCurrentUser(newUser);

    // Process referral if a referral code was provided
    if (formData.referralCode && formData.referralCode.trim()) {
      const refResult = storage.processReferralRegistration(
        newUser.id,
        newUser.displayName,
        formData.referralCode.trim()
      );
      if (refResult.referrerFound) {
        storage.addNotification({
          id: `notif_ref_applied_${Date.now()}`,
          userId: newUser.id,
          title: lang === 'fr' ? 'Code de parrainage activé ✨' : 'Referral Link Verified ✨',
          message: lang === 'fr' 
            ? `Vous vous êtes inscrit avec le lien de parrainage de ${refResult.referrerName || 'un ami'} ! Il a reçu son statut VIP Premium.` 
            : `You registered using ${refResult.referrerName || 'a friend'}'s referral link! They received automatic JudmiSpark Premium VIP access.`,
          type: 'system',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Give welcome notification
    storage.addNotification({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      title: lang === 'fr' ? 'Bienvenue sur JudmiSpark ! ✨' : 'Welcome to JudmiSpark! ✨',
      message: lang === 'fr' 
        ? `Votre identité vocale permanente est enregistrée. Découvrez les profils à ${newUser.town} (${currentCountry.flag} ${newUser.nationality || 'Cameroun'}) !`
        : `Your permanent voice identity has been registered. Discover people in ${newUser.town} (${currentCountry.flag} ${newUser.nationality || 'Cameroon'})!`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    onRegistered(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto py-4 sm:py-8 px-3 sm:px-4 flex justify-center items-start">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header & Language Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {lang === 'fr' ? 'Rejoindre JudmiSpark' : 'Join JudmiSpark'}
              </h2>
              <p className="text-[10px] text-neutral-400">
                {lang === 'fr' ? 'Vérification vocale anti-usurpation' : 'Voice-Verified Anti-Catfish Community'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="py-1 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Switch language / Changer de langue"
            >
              <Languages size={13} className="text-rose-400" />
              <span>{lang === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-1">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 1 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {step === 1 ? '1' : '✓'}
            </span>
            <span className={step === 1 ? 'text-white' : 'text-neutral-400'}>
              {lang === 'fr' ? 'Profil & Localité' : 'Profile & Location'}
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-neutral-800" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 2 ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}>
              2
            </span>
            <span className={step === 2 ? 'text-white' : 'text-neutral-400'}>
              {lang === 'fr' ? 'Empreinte Vocale' : 'Voice Identity'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: Details */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-3.5">
            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Nom Complet' : 'Full Name'}
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Sarah Nfor"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Pseudo public' : 'Display Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. Sarah"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* NATIONALITY SELECTION */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-300">
                  {lang === 'fr' ? 'Nationalité / Pays d’origine' : 'Nationality / Country'}
                </label>
                <span className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                  <Globe size={11} />
                  <span>{currentCountry.currency}</span>
                </span>
              </div>
              <div className="relative">
                <select
                  value={formData.nationality}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-rose-500 appearance-none cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name} ({c.dialCode}) - {c.currency}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-3 text-xs text-neutral-500 pointer-events-none">▼</span>
              </div>
              {!isCameroon && (
                <p className="text-[10px] text-neutral-400 mt-1">
                  {lang === 'fr'
                    ? `🌍 Devise configurée : ${currentCountry.currency}. Code téléphonique : ${currentCountry.dialCode}`
                    : `🌍 Currency configured: ${currentCountry.currency}. Dial code: ${currentCountry.dialCode}`}
                </p>
              )}
            </div>

            {/* Email Address (Used for login) & Mobile Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Adresse Email (Connexion)' : 'Email Address (Login)'}
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. user@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Numéro Mobile (MoMo)' : 'Mobile Phone (MoMo)'}
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder={`e.g. ${currentCountry.dialCode} 671...`}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Password & Retype Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Mot de passe (6 caractères)' : 'Password (6 characters)'}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={6}
                    minLength={6}
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="e.g. 123456"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-9 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Retaper le mot de passe' : 'Retype Password'}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    maxLength={6}
                    minLength={6}
                    required
                    value={formData.confirmPin}
                    onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
                    placeholder="e.g. 123456"
                    className={`w-full bg-neutral-950 border rounded-xl py-2.5 pl-9 pr-9 text-xs text-white placeholder-neutral-500 focus:outline-none ${
                      formData.confirmPin && formData.pin !== formData.confirmPin
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : formData.confirmPin && formData.pin === formData.confirmPin
                        ? 'border-emerald-500/80 focus:border-emerald-500'
                        : 'border-neutral-800 focus:border-rose-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {formData.confirmPin && formData.pin !== formData.confirmPin && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {lang === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match'}
                  </p>
                )}
                {formData.confirmPin && formData.pin === formData.confirmPin && formData.pin.length === 6 && (
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>{lang === 'fr' ? 'Mots de passe identiques' : 'Passwords match'}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Location & DOB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Ville / Localité' : 'Town / City'}
                </label>
                <select
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value as TownLocation })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {currentCountry.towns.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="custom">✏️ {lang === 'fr' ? 'Autre ville...' : 'Other City...'}</option>
                </select>

                {formData.town === 'custom' && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      required
                      placeholder={lang === 'fr' ? 'Entrez votre ville' : 'Enter your town/city name'}
                      value={formData.customTown}
                      onChange={(e) => setFormData({ ...formData, customTown: e.target.value })}
                      className="w-full bg-neutral-950 border border-rose-500/50 rounded-xl py-2 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Date de Naissance' : 'Date of Birth'}
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Gender & Preference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Genre' : 'Gender'}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="female">{lang === 'fr' ? 'Femme' : 'Woman'}</option>
                  <option value="male">{lang === 'fr' ? 'Homme' : 'Man'}</option>
                  <option value="non-binary">{lang === 'fr' ? 'Non-binaire' : 'Non-binary'}</option>
                  <option value="other">{lang === 'fr' ? 'Autre' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'fr' ? 'Je cherche' : 'Looking For'}
                </label>
                <select
                  value={formData.genderPreference}
                  onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value as any })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="everyone">{lang === 'fr' ? 'Tout le monde' : 'Everyone'}</option>
                  <option value="men">{lang === 'fr' ? 'Des Hommes' : 'Men'}</option>
                  <option value="women">{lang === 'fr' ? 'Des Femmes' : 'Women'}</option>
                </select>
              </div>
            </div>

            {/* RELATIONSHIP INTENTIONS (CHOOSE UP TO TWO) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  {lang === 'fr' ? 'Intentions Relationnelles' : 'Relationship Intentions'}
                </label>
                <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  {lang === 'fr' 
                    ? `Choisissez jusqu'à 2 (${formData.relationshipIntentions.length}/2)` 
                    : `Choose up to 2 (${formData.relationshipIntentions.length}/2)`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RELATIONSHIP_INTENTIONS_LIST.map((item) => {
                  const isSelected = formData.relationshipIntentions.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleIntentionToggle(item.value)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/40'
                          : 'bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {lang === 'fr' ? item.labelFr : item.labelEn}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {lang === 'fr' ? item.descFr : item.descEn}
                          </p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${
                        isSelected 
                          ? 'bg-rose-500 border-rose-500 text-white font-bold' 
                          : 'border-neutral-700'
                      }`}>
                        {isSelected && '✓'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Crown size={14} />
                <span>{lang === 'fr' ? 'Lien de parrainage (Optionnel)' : 'Friend Referral Code (Optional)'}</span>
              </div>
              <input
                type="text"
                placeholder="e.g. BRANDON92"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                className="w-full bg-neutral-950 border border-amber-500/30 rounded-xl p-2 text-xs font-mono font-bold text-white uppercase placeholder-neutral-600 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-neutral-400">
                {lang === 'fr' 
                  ? 'Si un ami vous a invité, entrez son code pour lui débloquer le VIP Premium gratuitement !'
                  : 'Entering a friend\'s code gives them automatic Free JudmiSpark Premium VIP!'}
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{lang === 'fr' ? 'Continuer vers l\'enregistrement vocal' : 'Continue to Voice Recording'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* STEP 2: Mandatory Voice Intro Recording */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <Sparkles size={16} />
                <span>{lang === 'fr' ? 'Vérification Vocale Permanente Obligatoire' : 'Permanent Voice Note Verification'}</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {lang === 'fr'
                  ? `Pour garantir une communauté 100% sans usurpation d'identité en ${currentCountry.name}, chaque profil doit enregistrer une note vocale d'introduction de 5 à 15 secondes. Cela prouve que vous êtes bien la personne sur vos photos.`
                  : `To eliminate romance scams and fake profiles in ${currentCountry.name}, every member must record a 5-15 second voice greeting. This is permanently attached to your profile to prove authenticity.`}
              </p>
              <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 italic">
                "{lang === 'fr' 
                  ? `Bonjour, je suis ${formData.displayName || 'votre nom'} à ${formData.town === 'custom' ? formData.customTown : formData.town} (${currentCountry.name}). Ravis de vous rencontrer sur JudmiSpark !`
                  : `Hey, I'm ${formData.displayName || 'your name'} in ${formData.town === 'custom' ? formData.customTown : formData.town} (${currentCountry.name}). Excited to meet real people on JudmiSpark!`}"
              </div>
            </div>

            {/* Audio Recorder Component */}
            <AudioRecorder
              isRegistration={true}
              userName={formData.displayName}
              onRecordingComplete={handleVoiceCompleted}
            />

            {recordedVoice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={16} />
                <span>
                  {lang === 'fr' 
                    ? `Voix enregistrée (${recordedVoice.duration}s). Prêt à finaliser votre compte !`
                    : `Voice recorded (${recordedVoice.duration}s). Ready to activate your account!`}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>{lang === 'fr' ? 'Retour' : 'Back'}</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!recordedVoice}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  recordedVoice 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/25' 
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <span>{lang === 'fr' ? 'Activer Mon Compte Vérifié' : 'Complete & Activate Account'}</span>
                <CheckCircle2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
