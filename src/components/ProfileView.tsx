import React, { useState } from 'react';
import { 
  UserProfile, 
  TownLocation, 
  RelationshipIntention,
  ProfileVideo
} from '../types';
import { storage } from '../utils/storage';
import { COUNTRIES, getCountryByName } from '../utils/countries';
import { getStoredLanguage, setStoredLanguage, SupportedLanguage } from '../utils/i18n';
import { AudioPlayer } from './AudioPlayer';
import { MediaGallery } from './MediaGallery';
import { 
  User, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Crown, 
  Share2, 
  Users, 
  Edit3, 
  Copy, 
  Check, 
  LogOut,
  Calendar,
  Heart,
  Wallet,
  ChevronRight,
  Smartphone,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Bell,
  Clock,
  ExternalLink,
  AlertCircle,
  Camera,
  Video as VideoIcon,
  Languages,
  Globe
} from 'lucide-react';
import { notificationService, NotificationSettings } from '../utils/notificationService';

interface ProfileViewProps {
  currentUser: UserProfile;
  onRefreshUser: () => void;
  onLogout: () => void;
  onNavigateToWallet: () => void;
  onNavigateToAdmin?: () => void;
  onOpenReferralPromo?: () => void;
}

const CAMEROON_TOWNS: TownLocation[] = [
  'Bamenda',
  'Douala',
  'Yaoundé',
  'Buea',
  'Limbe',
  'Bafoussam',
  'Garoua',
  'Kumba'
];

const RELATIONSHIP_INTENTIONS: RelationshipIntention[] = [
  'Relationship',
  'Marriage',
  'Friendship',
  'Casual social connection',
  'Networking',
  'Just meeting people'
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onRefreshUser,
  onLogout,
  onNavigateToWallet,
  onNavigateToAdmin,
  onOpenReferralPromo
}) => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    return currentUser.preferredLanguage || getStoredLanguage();
  });
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: currentUser.displayName,
    nationality: currentUser.nationality || 'Cameroon',
    town: currentUser.town,
    customTown: '',
    neighborhood: currentUser.neighborhood || '',
    bio: currentUser.bio,
    relationshipIntention: currentUser.relationshipIntention,
    relationshipIntentions: (currentUser.relationshipIntentions && currentUser.relationshipIntentions.length > 0)
      ? currentUser.relationshipIntentions
      : (typeof currentUser.relationshipIntention === 'string' 
          ? (currentUser.relationshipIntention.includes(' & ') ? currentUser.relationshipIntention.split(' & ') : [currentUser.relationshipIntention])
          : [currentUser.relationshipIntention]) as RelationshipIntention[]
  });

  const handleIntentionToggle = (intent: RelationshipIntention) => {
    const current = editForm.relationshipIntentions;
    if (current.includes(intent)) {
      if (current.length > 1) {
        setEditForm({
          ...editForm,
          relationshipIntentions: current.filter(i => i !== intent)
        });
      }
    } else {
      if (current.length < 2) {
        setEditForm({
          ...editForm,
          relationshipIntentions: [...current, intent]
        });
      } else {
        setEditForm({
          ...editForm,
          relationshipIntentions: [current[0], intent]
        });
      }
    }
  };

  const selectedCountry = getCountryByName(currentUser.nationality || 'Cameroon');
  const editCountry = getCountryByName(editForm.nationality);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    setStoredLanguage(lang);
    const updated: UserProfile = {
      ...currentUser,
      preferredLanguage: lang
    };
    storage.updateUser(updated);
    onRefreshUser();
  };

  const referrals = storage.getUserReferrals(currentUser.id);
  const balance = storage.calculateUserBalance(currentUser.id);

  // Notification states
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [isIframe, setIsIframe] = useState(false);

  React.useEffect(() => {
    setNotifPermission(notificationService.getPermission());
    setIsIframe(notificationService.isInsideIframe());
  }, []);

  const handleRequestNotifPermission = async () => {
    const res = await notificationService.requestPermission();
    setNotifPermission(res);
  };

  const handleTriggerTestNotif = () => {
    setTestCountdown(5);
    notificationService.scheduleTestNotification(5);

    const interval = setInterval(() => {
      setTestCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleToggleNotifSetting = (key: keyof NotificationSettings) => {
    const updated = notificationService.saveSettings({ [key]: !notifSettings[key] });
    setNotifSettings(updated);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://judmispark.com/join?ref=${currentUser.referralCode}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTown = editForm.town === 'custom' ? (editForm.customTown.trim() || editCountry.towns[0] || 'Bamenda') : editForm.town;
    const finalIntentions = editForm.relationshipIntentions.length > 0 
      ? editForm.relationshipIntentions 
      : (['Relationship'] as RelationshipIntention[]);
    const updated = {
      ...currentUser,
      displayName: editForm.displayName.trim() || currentUser.displayName,
      nationality: editForm.nationality,
      countryCode: editCountry.code,
      currency: editCountry.currency,
      town: finalTown,
      neighborhood: editForm.neighborhood.trim() || undefined,
      bio: editForm.bio.trim() || currentUser.bio,
      relationshipIntention: finalIntentions.join(' & '),
      relationshipIntentions: finalIntentions
    };

    storage.updateUser(updated);
    setIsEditing(false);
    onRefreshUser();
  };

  const handleUpdateMedia = (newPhotos: string[], newVideos: ProfileVideo[], newProfilePic?: string) => {
    const updated: UserProfile = {
      ...currentUser,
      photos: newPhotos,
      videos: newVideos,
      profilePicture: newProfilePic !== undefined ? newProfilePic : (currentUser.profilePicture || newPhotos[0] || '')
    };

    storage.updateUser(updated);
    onRefreshUser();
  };

  const handleUpgradePremium = () => {
    if (balance < 10) {
      alert(currentLang === 'fr' 
        ? 'Vous avez besoin d\'au moins 10 Sparks (5 000 FCFA) pour activer 1 mois de JudmiSpark Premium VIP.' 
        : 'You need at least 10 Sparks (5,000 CFA) in your wallet to activate 1 month of JudmiSpark Premium. Please deposit via Mobile Money first.');
      return;
    }

    // Debit 10 sparks for JudmiSpark Premium
    storage.addTransaction({
      id: `tx_prem_${Date.now()}`,
      walletId: currentUser.walletId,
      userId: currentUser.id,
      transactionType: 'ADMIN_ADJUSTMENT',
      sparks: -10,
      cfaAmount: 5000,
      reference: `PREMIUM-${Date.now()}`,
      provider: 'INTERNAL',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      note: '1-Month JudmiSpark Premium Subscription'
    });

    const updated = { ...currentUser, isPremium: true };
    storage.updateUser(updated);
    onRefreshUser();
    alert(currentLang === 'fr' 
      ? 'Félicitations ! JudmiSpark Premium VIP est maintenant activé sur votre compte.' 
      : 'Congratulations! JudmiSpark Premium is now active on your account.');
  };

  return (
    <div id="profile-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-28">
      {/* Top Header Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition cursor-pointer"
            title={currentLang === 'fr' ? 'Modifier le profil' : 'Edit Profile'}
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            title={currentLang === 'fr' ? 'Se déconnecter' : 'Log Out'}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-700 text-xs transition cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Profile Avatar */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <img 
            src={currentUser.profilePicture} 
            alt={currentUser.displayName} 
            className="w-full h-full rounded-3xl object-cover border-2 border-rose-500 shadow-xl"
          />
          {currentUser.isPremium ? (
            <div title="JudmiSpark Premium VIP" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg border-2 border-neutral-900">
              <Crown size={14} className="fill-current" />
            </div>
          ) : (
            <div title="Voice Verified User" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-neutral-900 text-xs font-bold">
              ✓
            </div>
          )}
        </div>

        <h2 className="text-xl font-extrabold text-white flex items-center justify-center gap-1.5">
          <span>{currentUser.displayName}, {currentUser.age}</span>
          {currentUser.isVerified && (
            <ShieldCheck size={18} className="text-emerald-400" />
          )}
        </h2>

        {/* Location & Nationality with Flag */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium mt-1">
          <MapPin size={13} />
          <span>{currentUser.town}</span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-300 font-semibold">{selectedCountry.flag} {currentUser.nationality || 'Cameroon'}</span>
          {currentUser.neighborhood && (
            <span className="text-neutral-400">• {currentUser.neighborhood}</span>
          )}
        </div>

        {currentUser.email && (
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            {currentUser.email}
          </div>
        )}

        <div className="inline-block mt-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-semibold px-3 py-0.5 rounded-full">
          {currentLang === 'fr' ? 'Intention : ' : 'Intent: '} {currentUser.relationshipIntention}
        </div>

        {/* Media Counters Badge */}
        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-neutral-400">
          <span className="flex items-center gap-1 bg-neutral-950/80 px-2.5 py-0.5 rounded-full border border-neutral-800">
            <Camera size={12} className="text-rose-400" />
            <span className="text-white font-bold">{(currentUser.photos || []).length}/7</span> Photos
          </span>
          <span className="flex items-center gap-1 bg-neutral-950/80 px-2.5 py-0.5 rounded-full border border-neutral-800">
            <VideoIcon size={12} className="text-rose-400" />
            <span className="text-white font-bold">{(currentUser.videos || []).length}/2</span> Videos (≤1m)
          </span>
        </div>

        <p className="text-xs text-neutral-300 max-w-sm mx-auto mt-3 leading-relaxed">
          {currentUser.bio}
        </p>

        {/* Interests */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {currentUser.interests.map(i => (
            <span key={i} className="text-[10px] font-medium bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full border border-neutral-700/60">
              {i}
            </span>
          ))}
        </div>
      </div>

      {/* LANGUAGE SWITCHER CARD (English <-> French) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Languages size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {currentLang === 'fr' ? 'Langue de l\'application' : 'App Language'}
            </div>
            <div className="text-[10px] text-neutral-400">
              {currentLang === 'fr' ? 'Français activé' : 'English active'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentLang === 'en'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('fr')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentLang === 'fr'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>🇫🇷</span>
            <span>Français</span>
          </button>
        </div>
      </div>

      {/* MEDIA GALLERY SECTION (UP TO 7 PHOTOS & 2 VIDEOS ≤ 1 MIN) */}
      <MediaGallery
        user={currentUser}
        isEditable={true}
        onUpdateMedia={handleUpdateMedia}
      />

      {/* ADMINISTRATOR DASHBOARD ACCESS (For Admin account / gabyjay16@gmail.com) */}
      {(currentUser.role === 'admin' || currentUser.email === 'gabyjay16@gmail.com') && (
        <div className="bg-gradient-to-br from-neutral-900 via-rose-950/40 to-neutral-900 border border-rose-500/40 rounded-3xl p-5 shadow-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-black shadow-lg shadow-rose-600/30">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">Admin Control Center</h3>
                  <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 font-mono mt-0.5">
                  {currentUser.email || 'gabyjay16@gmail.com'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition active:scale-95 whitespace-nowrap"
            >
              <span>Go to Admin</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <p className="text-[11px] text-neutral-400">
            Full platform administration: oversee user accounts, ban/unban moderation, voice report reviews, ad campaigns, and platform audit logs.
          </p>
        </div>
      )}

      {/* EDIT PROFILE MODAL / FORM */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-white">Edit Profile Details</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-neutral-400 text-xs"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {currentLang === 'fr' ? 'Pseudo public' : 'Display Name'}
            </label>
            <input
              type="text"
              value={editForm.displayName}
              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Nationality in Edit Form */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {currentLang === 'fr' ? 'Nationalité / Pays' : 'Nationality / Country'}
            </label>
            <div className="relative">
              <select
                value={editForm.nationality}
                onChange={(e) => {
                  const newCountry = getCountryByName(e.target.value);
                  setEditForm({
                    ...editForm,
                    nationality: newCountry.name,
                    town: newCountry.towns[0] || 'Bamenda',
                    customTown: ''
                  });
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 pr-8 text-xs text-white focus:outline-none focus:border-rose-500 appearance-none cursor-pointer"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-2.5 text-xs text-neutral-500 pointer-events-none">▼</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {currentLang === 'fr' ? 'Ville / Localité' : 'Town / City'}
              </label>
              <select
                value={editForm.town}
                onChange={(e) => setEditForm({ ...editForm, town: e.target.value as TownLocation })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {editCountry.towns.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="custom">✏️ {currentLang === 'fr' ? 'Autre ville' : 'Other City'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {currentLang === 'fr' ? 'Quartier' : 'Neighborhood'}
              </label>
              <input
                type="text"
                value={editForm.neighborhood}
                onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                placeholder="e.g. Commercial Ave"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {editForm.town === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {currentLang === 'fr' ? 'Nom de votre ville' : 'Custom Town Name'}
              </label>
              <input
                type="text"
                value={editForm.customTown}
                onChange={(e) => setEditForm({ ...editForm, customTown: e.target.value })}
                placeholder="e.g. Garoua-Boulaï, Kribi, etc."
                className="w-full bg-neutral-950 border border-rose-500/50 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                {currentLang === 'fr' ? 'Intentions relationnelles' : 'Relationship Intentions'}
              </label>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                {currentLang === 'fr' 
                  ? `Jusqu'à 2 (${editForm.relationshipIntentions.length}/2)` 
                  : `Up to 2 (${editForm.relationshipIntentions.length}/2)`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'Relationship', icon: '❤️', labelEn: 'Relationship', labelFr: 'Relation' },
                { value: 'Marriage', icon: '💍', labelEn: 'Marriage', labelFr: 'Mariage' },
                { value: 'Friendship', icon: '🤝', labelEn: 'Friendship', labelFr: 'Amitié' },
                { value: 'Casual social connection', icon: '☕', labelEn: 'Casual Hangout', labelFr: 'Sorties & Détente' },
                { value: 'Networking', icon: '💼', labelEn: 'Networking', labelFr: 'Réseautage' },
                { value: 'Just meeting people', icon: '✨', labelEn: 'Meeting People', labelFr: 'Rencontres' }
              ].map(opt => {
                const isSelected = editForm.relationshipIntentions.includes(opt.value as RelationshipIntention);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleIntentionToggle(opt.value as RelationshipIntention)}
                    className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 text-white font-bold ring-1 ring-rose-500/30'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{opt.icon}</span>
                      <span className="truncate">{currentLang === 'fr' ? opt.labelFr : opt.labelEn}</span>
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 border ${
                      isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-neutral-700'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer hover:bg-rose-600 transition"
          >
            {currentLang === 'fr' ? 'Enregistrer les modifications' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {/* SPARK WALLET CARD (Fitted directly into Profile) */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Wallet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">Spark Wallet</h3>
                <span className="text-[10px] font-black bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  1 SPK = 500 CFA
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                ID: {currentUser.walletId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToWallet}
            className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <span>Go to Wallet</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Balance Display */}
        <div className="bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
              Available Balance
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-amber-400 tracking-tight">
                {balance}
              </span>
              <span className="text-xs font-bold text-neutral-300">SPARKS</span>
            </div>
            <span className="text-xs text-neutral-400 font-semibold mt-0.5 block">
              ≈ {(balance * 500).toLocaleString()} CFA
            </span>
          </div>

          <button
            type="button"
            onClick={onNavigateToWallet}
            className="py-2 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow"
          >
            <Zap size={14} className="text-amber-400 fill-amber-400" />
            <span>Manage Funds</span>
          </button>
        </div>

        {/* Quick shortcuts */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onNavigateToWallet}
            className="py-2 px-2 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition"
          >
            <Smartphone size={13} className="text-amber-400" />
            <span>Deposit</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToWallet}
            className="py-2 px-2 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition"
          >
            <ArrowUpRight size={13} className="text-emerald-400" />
            <span>Transfer</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToWallet}
            className="py-2 px-2 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition"
          >
            <Zap size={13} className="text-rose-400" />
            <span>Cashout</span>
          </button>
        </div>
      </div>
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              ⚡
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Permanent Voice Identity</h3>
              <p className="text-[11px] text-neutral-400">Created during registration</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-500/20">
            <Lock size={11} />
            <span>Permanent Record</span>
          </div>
        </div>

        <AudioPlayer
          audioUrl={currentUser.registrationVoiceUrl}
          duration={currentUser.registrationVoiceDuration || 4}
          userName={currentUser.displayName}
          isRegistrationVoice={true}
          seed={currentUser.id}
        />

        <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-950/70 p-3 rounded-2xl border border-neutral-800">
          <strong>Security Policy:</strong> To protect users against impersonation, catfishing, and account resale, your registration voice recording is permanently bound to this account. It cannot be altered, replaced, or deleted.
        </p>
      </div>

      {/* JUDMISPARK PREMIUM UPGRADE */}
      <div className="bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Crown size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300">JudmiSpark Premium</h3>
              <p className="text-[11px] text-neutral-400">10 Sparks / Month (5,000 CFA)</p>
            </div>
          </div>

          {currentUser.isPremium ? (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              Active VIP
            </span>
          ) : (
            <button
              type="button"
              onClick={handleUpgradePremium}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-extrabold text-xs shadow-md transition"
            >
              Upgrade
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-neutral-300">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">✓</span> Unlimited Discover Swipes
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">✓</span> See Who Liked You
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">✓</span> Golden VIP Profile Badge
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">✓</span> Priority Match Visibility
          </div>
        </div>
      </div>

      {/* OUT-OF-APP & BACKGROUND NOTIFICATIONS SETTINGS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Out-of-App & Background Notifications</h3>
              <p className="text-[11px] text-neutral-400">Lock screen alerts & system banners</p>
            </div>
          </div>

          {notifPermission === 'granted' ? (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>OS Alerts Active</span>
            </span>
          ) : notifPermission === 'denied' ? (
            <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle size={12} />
              <span>Blocked</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Permission Needed
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          Users can receive notifications <strong>even when outside of the app</strong> (when browsing other websites, when the tab is minimized, or on the phone screen).
        </p>

        {/* Action button */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {notifPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestNotifPermission}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-extrabold shadow-md transition flex items-center gap-2"
            >
              <Bell size={14} />
              <span>Enable Out-of-App Notifications</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTriggerTestNotif}
              disabled={testCountdown !== null}
              className="py-2 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Clock size={14} className="text-amber-400" />
              <span>
                {testCountdown !== null 
                  ? `Switch tabs! Alert arrives in ${testCountdown}s...` 
                  : 'Test Out-of-App Alert (5s Delay)'}
              </span>
            </button>
          )}

          {isIframe && (
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>Open in New Tab</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Toggles */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white block">Master Alerts Toggle</span>
              <span className="text-[10px] text-neutral-400">Allow system to dispatch alerts</span>
            </div>
            <input
              type="checkbox"
              checked={notifSettings.enabled}
              onChange={() => handleToggleNotifSetting('enabled')}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </label>

          <div className="border-t border-neutral-800/80 pt-2 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-neutral-300">Alert on new mutual match</span>
              <input
                type="checkbox"
                checked={notifSettings.notifyOnMatches}
                onChange={() => handleToggleNotifSetting('notifyOnMatches')}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-neutral-300">Alert on new voice messages</span>
              <input
                type="checkbox"
                checked={notifSettings.notifyOnMessages}
                onChange={() => handleToggleNotifSetting('notifyOnMessages')}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-neutral-300">Alert on Spark gifts received</span>
              <input
                type="checkbox"
                checked={notifSettings.notifyOnGifts}
                onChange={() => handleToggleNotifSetting('notifyOnGifts')}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs text-neutral-300 block">Out-of-App Simulation</span>
                <span className="text-[10px] text-neutral-500">Sends match/voice alerts after minimizing the app</span>
              </div>
              <input
                type="checkbox"
                checked={notifSettings.backgroundSimulation}
                onChange={() => handleToggleNotifSetting('backgroundSimulation')}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="bg-neutral-950/70 border border-neutral-800/70 rounded-2xl p-3 text-[11px] text-neutral-400 space-y-1">
          <p className="font-semibold text-neutral-300">How Out-of-App Notifications Work:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-neutral-400">
            <li><strong>Service Worker (`/sw.js`):</strong> Registered to deliver system-level Web Push notifications even if the tab is inactive.</li>
            <li><strong>Desktop & Android:</strong> Receive immediate native OS banner & lock screen notifications.</li>
            <li><strong>iOS (iPhone/iPad):</strong> Tap browser Share &gt; "Add to Home Screen" to enable full native Web Push on iOS 16.4+.</li>
          </ul>
        </div>
      </div>

      {/* REFERRAL SYSTEM */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-bold">
              <Crown size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Unlock Free Premium via Referrals</h3>
              <p className="text-[11px] text-amber-400 font-semibold">Get Premium VIP when a friend registers with your link</p>
            </div>
          </div>

          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            {referrals.filter(r => r.status === 'activated').length} Activated
          </span>
        </div>

        <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Your Invite Link / Code</span>
            <span className="text-sm font-mono font-extrabold text-white tracking-wider">
              {currentUser.referralCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyReferral}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1 shadow-md shadow-amber-500/20 transition"
          >
            {copiedCode ? <Check size={13} className="text-neutral-950" /> : <Copy size={13} />}
            <span>{copiedCode ? 'Copied Link' : 'Copy Invite Link'}</span>
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-[11px] text-neutral-300 space-y-2">
          <div className="flex items-center justify-between font-semibold text-amber-300">
            <span>VIP Reward Status:</span>
            <span>{currentUser.isPremium ? '👑 Active Premium VIP' : 'Invite 1 Friend to Unlock'}</span>
          </div>
          <p className="text-[10px] text-neutral-400">
            When another user uses your referral code/link and completes their voice verification, your account automatically unlocks unlimited Discover swipes, priority matches, and golden VIP status.
          </p>
          {onOpenReferralPromo && (
            <button
              type="button"
              onClick={onOpenReferralPromo}
              className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer mt-1"
            >
              <Crown size={14} className="text-amber-400" />
              <span>View All Premium Services Included</span>
            </button>
          )}
        </div>
      </div>

      {/* ADMIN & WALLET APPROVER DASHBOARD (Visible to Admin or Authorized Approvers) */}
      {(currentUser.role === 'admin' || currentUser.email === 'gabyjay16@gmail.com' || currentUser.canApproveWallets) && onNavigateToAdmin && (
        <div className="bg-gradient-to-r from-neutral-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shrink-0">
                <ShieldAlert size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">
                    {currentUser.role === 'admin' ? 'Admin & Management Hub' : 'Wallet Approver Console'}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {currentUser.role === 'admin' ? 'Super Admin' : 'Approver'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Manage MoMo payment info, review top-up screenshots, approve withdrawals & permissions.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToAdmin}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <ShieldAlert size={15} />
            <span>Open Admin Dashboard & Payment Approvals</span>
          </button>
        </div>
      )}

      {/* ACCOUNT & PERMANENT SESSION */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {currentLang === 'fr' ? 'Sécurité & Session Permanente' : 'Account & Permanent Session'}
            </h3>
            <p className="text-[11px] text-neutral-400">
              {currentLang === 'fr' 
                ? 'Votre session reste active en permanence. Vous ne serez déconnecté qu’en cliquant sur le bouton ci-dessous.' 
                : 'Your session stays logged in permanently. You will never be logged out unless you click the button below.'}
            </p>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-rose-500/10 border border-neutral-800 hover:border-rose-500/50 text-neutral-300 hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>{currentLang === 'fr' ? 'Se déconnecter de ce compte' : 'Log Out of this Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
