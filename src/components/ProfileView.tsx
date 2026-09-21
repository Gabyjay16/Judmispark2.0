import React, { useState } from 'react';
import { 
  UserProfile, 
  TownLocation, 
  RelationshipIntention 
} from '../types';
import { storage } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
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
  Heart
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: UserProfile;
  onRefreshUser: () => void;
  onLogout: () => void;
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
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: currentUser.displayName,
    town: currentUser.town,
    neighborhood: currentUser.neighborhood || '',
    bio: currentUser.bio,
    relationshipIntention: currentUser.relationshipIntention
  });

  const referrals = storage.getUserReferrals(currentUser.id);
  const balance = storage.calculateUserBalance(currentUser.id);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://judmispark.cm/join?ref=${currentUser.referralCode}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      displayName: editForm.displayName.trim() || currentUser.displayName,
      town: editForm.town,
      neighborhood: editForm.neighborhood.trim() || undefined,
      bio: editForm.bio.trim() || currentUser.bio,
      relationshipIntention: editForm.relationshipIntention
    };

    storage.updateUser(updated);
    setIsEditing(false);
    onRefreshUser();
  };

  const handleUpgradePremium = () => {
    if (balance < 10) {
      alert('You need at least 10 Sparks (5,000 CFA) in your wallet to activate 1 month of JudmiSpark Premium. Please deposit via Mobile Money first.');
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
    alert('Congratulations! JudmiSpark Premium is now active on your account.');
  };

  return (
    <div id="profile-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-5 pb-28">
      {/* Top Header Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-700 text-xs transition"
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

        <div className="flex items-center justify-center gap-1 text-xs text-rose-400 font-medium mt-1">
          <MapPin size={13} />
          <span>{currentUser.town}</span>
          {currentUser.neighborhood && (
            <span className="text-neutral-400">• {currentUser.neighborhood}</span>
          )}
        </div>

        <div className="inline-block mt-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-semibold px-3 py-0.5 rounded-full">
          Intent: {currentUser.relationshipIntention}
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
              Display Name
            </label>
            <input
              type="text"
              value={editForm.displayName}
              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Town / City
              </label>
              <select
                value={editForm.town}
                onChange={(e) => setEditForm({ ...editForm, town: e.target.value as TownLocation })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {CAMEROON_TOWNS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Neighborhood
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

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Relationship Intention
            </label>
            <select
              value={editForm.relationshipIntention}
              onChange={(e) => setEditForm({ ...editForm, relationshipIntention: e.target.value as RelationshipIntention })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {RELATIONSHIP_INTENTIONS.map(intent => (
                <option key={intent} value={intent}>{intent}</option>
              ))}
            </select>
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
            className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md"
          >
            Save Profile Changes
          </button>
        </form>
      )}

      {/* PERMANENT VOICE INTRODUCTION (Rule #9: Cannot be deleted or replaced) */}
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

      {/* REFERRAL SYSTEM */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Referral Rewards</h3>
              <p className="text-[11px] text-neutral-400">Earn 1 Spark per voice-verified friend</p>
            </div>
          </div>

          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
            {referrals.length} Invited
          </span>
        </div>

        <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Your Referral Code</span>
            <span className="text-sm font-mono font-extrabold text-white tracking-wider">
              {currentUser.referralCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyReferral}
            className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition"
          >
            {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedCode ? 'Copied' : 'Share Link'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
          <span>Earned from referrals:</span>
          <strong className="text-white">{referrals.filter(r => r.status === 'activated').length} Sparks ({(referrals.filter(r => r.status === 'activated').length * 500).toLocaleString()} CFA)</strong>
        </div>
      </div>
    </div>
  );
};
