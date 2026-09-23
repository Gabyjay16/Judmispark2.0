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
  Globe,
  Settings
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
  const [showMediaSection, setShowMediaSection] = useState(true);
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
  const canApprove = storage.canUserApproveWallets(currentUser);

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

  return (
    <div id="profile-page-view" className="max-w-md mx-auto w-full px-4 py-4 space-y-3.5 pb-28 text-[#2D151E]">
      
      {/* 1. TOP PROMO BANNER (EXACT TO Screenshot_20260923-123603.jpg) */}
      <div 
        onClick={onOpenReferralPromo}
        className="bg-[#F2E7DF] border border-[#E9DDD5] rounded-[24px] p-4 text-center cursor-pointer hover:bg-[#EBDED6] transition shadow-2xs"
      >
        <span className="text-[10px] font-bold tracking-widest uppercase text-[#8A767E] block mb-1">
          PROFILE VIEWS THIS WEEK
        </span>
        <div className="text-xs sm:text-sm font-bold text-[#2D151E] flex items-center justify-center gap-1.5">
          <span>✦</span>
          <span>Premium perk — invite a friend to see this</span>
        </div>
      </div>

      {/* 2. USER DETAILS PILL ROWS (EXACT TO Screenshot_20260923-123603.jpg) */}
      <div className="space-y-2.5">
        {/* ROW 1: FULL NAME */}
        <div className="bg-[#F2E7DF] border border-[#E9DDD5] rounded-[22px] px-5 py-3.5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#8A767E]">
            FULL NAME
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#2D151E]">
            {currentUser.fullName || currentUser.displayName}
          </span>
        </div>

        {/* ROW 2: PHONE */}
        <div className="bg-[#F2E7DF] border border-[#E9DDD5] rounded-[22px] px-5 py-3.5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#8A767E]">
            PHONE
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#2D151E] font-mono">
            {currentUser.phoneNumber.replace('+237', '').trim() || currentUser.phoneNumber}
          </span>
        </div>

        {/* ROW 3: I WANT TO MEET */}
        <div className="bg-[#F2E7DF] border border-[#E9DDD5] rounded-[22px] px-5 py-3.5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#8A767E]">
            I WANT TO MEET
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#2D151E] capitalize">
            {currentUser.genderPreference === 'everyone' ? 'Everyone' : currentUser.genderPreference}
          </span>
        </div>

        {/* ROW 4: EMAIL */}
        <div className="bg-[#F2E7DF] border border-[#E9DDD5] rounded-[22px] px-5 py-3.5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#8A767E]">
            EMAIL
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#2D151E] font-mono truncate max-w-[200px]">
            {currentUser.email || 'gabyjay16@gmail.com'}
          </span>
        </div>

        {/* ROW 5: LANGUAGE / LANGUE PILL SWITCH */}
        <div className="bg-[#F2E7DF] border border-[#E9DDD5] rounded-[22px] px-5 py-3 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#8A767E]">
            LANGUAGE / LANGUE
          </span>
          
          <div className="bg-white/80 border border-[#E5D7CE] rounded-full p-0.5 flex items-center gap-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                currentLang === 'en'
                  ? 'bg-[#FF5D55] text-white shadow-xs'
                  : 'text-[#8A767E] hover:text-[#2D151E]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('fr')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                currentLang === 'fr'
                  ? 'bg-[#FF5D55] text-white shadow-xs'
                  : 'text-[#8A767E] hover:text-[#2D151E]'
              }`}
            >
              FR
            </button>
          </div>
        </div>
      </div>

      {/* 3. VIBRANT GRADIENT ACTION BUTTONS (EXACT TO Screenshot_20260923-123603.jpg) */}
      <div className="space-y-2.5 pt-1">
        {/* ✦ Spark Wallet Button (Rose/Coral Gradient) */}
        <button
          type="button"
          onClick={onNavigateToWallet}
          className="w-full bg-gradient-to-r from-[#FA4468] via-[#FF586E] to-[#FF7558] hover:opacity-95 text-white rounded-[24px] px-5 py-4 font-bold flex items-center justify-between shadow-md shadow-rose-500/20 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
            <span>✦</span>
            <span>Spark Wallet</span>
            <span className="text-xs font-semibold opacity-90 ml-1">
              ({balance} Sparks)
            </span>
          </div>
          <span className="text-sm font-extrabold">
            Open →
          </span>
        </button>

        {/* ★ Premium & invites Button (Gold/Amber Gradient) */}
        <button
          type="button"
          onClick={onOpenReferralPromo}
          className="w-full bg-gradient-to-r from-[#F39C24] via-[#F5AA30] to-[#E99020] hover:opacity-95 text-white rounded-[24px] px-5 py-4 font-bold flex items-center justify-between shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
            <span>★</span>
            <span>Premium & invites</span>
            {currentUser.isPremium && (
              <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-black">
                VIP
              </span>
            )}
          </div>
          <span className="text-sm font-extrabold">
            Open →
          </span>
        </button>

        {/* ⚙ Admin area Button (Orange/Coral Gradient) */}
        {canApprove && (
          <button
            type="button"
            onClick={onNavigateToAdmin}
            className="w-full bg-gradient-to-r from-[#F07238] via-[#F17E3F] to-[#E56830] hover:opacity-95 text-white rounded-[24px] px-5 py-4 font-bold flex items-center justify-between shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
              <span>⚙</span>
              <span>Admin area</span>
              <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-black">
                Approver
              </span>
            </div>
            <span className="text-sm font-extrabold">
              Open →
            </span>
          </button>
        )}

        {/* Log Out Button */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full bg-[#EFE4DC] hover:bg-[#E8DCD3] text-[#4A353E] rounded-[24px] py-4 font-bold text-center transition cursor-pointer text-sm shadow-2xs"
        >
          Log out
        </button>
      </div>

      {/* 4. EXPANDABLE PROFILE & MEDIA CONTROLS */}
      <div className="pt-2">
        <div className="bg-white/80 border border-[#E8DDD4] rounded-[26px] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.profilePicture} 
                alt={currentUser.displayName} 
                className="w-12 h-12 rounded-2xl object-cover border border-[#E8DDD4]"
              />
              <div>
                <h4 className="text-sm font-bold text-[#2D151E]">
                  {currentUser.displayName}, {currentUser.age}
                </h4>
                <p className="text-[11px] text-[#8A767E]">
                  📍 {currentUser.town} • {currentUser.photos.length}/7 photos • {currentUser.videos?.length || 0}/2 videos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="py-1.5 px-3 rounded-xl bg-[#F2E7DF] hover:bg-[#EBDED6] text-[#2D151E] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Edit3 size={13} />
              <span>{isEditing ? 'Close' : 'Edit'}</span>
            </button>
          </div>

          {/* Registration Voice Playback */}
          <div className="pt-2 border-t border-[#F0E2DA]">
            <span className="text-[10px] font-bold tracking-wider text-[#8A767E] uppercase block mb-1.5">
              YOUR PERMANENT VOICE INTRODUCTION:
            </span>
            <AudioPlayer
              audioUrl={currentUser.registrationVoiceUrl}
              duration={currentUser.registrationVoiceDuration || 5}
              userName={currentUser.displayName}
              seed={currentUser.id}
            />
          </div>

          {/* Photos & Videos toggle button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMediaSection(!showMediaSection)}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-[#F2E7DF] hover:bg-[#EBDED6] text-[#2D151E] text-xs font-bold transition flex items-center justify-between border border-[#E5D7CE] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Camera size={14} className="text-[#FF4A70]" />
                <span>My Photos & Videos ({currentUser.photos.length}/7 photos)</span>
              </span>
              <span className="text-[11px] text-[#8A767E] font-semibold">{showMediaSection ? 'Hide ▲' : 'Manage / Delete ▼'}</span>
            </button>
          </div>

          {showMediaSection && (
            <div className="pt-2 border-t border-[#F0E2DA]">
              <MediaGallery
                user={currentUser}
                isEditable={true}
                onUpdateMedia={handleUpdateMedia}
              />
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE FORM */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-[#EBDED6] rounded-[26px] p-5 space-y-3.5 shadow-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#F0E2DA] pb-2">
            <h3 className="text-sm font-bold text-[#2D151E]">Edit Profile Details</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[#8A767E] hover:text-[#2D151E] text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A767E] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={editForm.displayName}
              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A767E] mb-1">
                Town / City
              </label>
              <select
                value={editForm.town}
                onChange={(e) => setEditForm({ ...editForm, town: e.target.value as TownLocation })}
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70] cursor-pointer"
              >
                {editCountry.towns.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A767E] mb-1">
                Neighborhood
              </label>
              <input
                type="text"
                value={editForm.neighborhood}
                onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                placeholder="e.g. Commercial Ave"
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A767E] mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-bold text-xs shadow-md shadow-rose-500/20 cursor-pointer hover:opacity-95 transition"
          >
            Save Profile Changes
          </button>
        </form>
      )}

    </div>
  );
};
