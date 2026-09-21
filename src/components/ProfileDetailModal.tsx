import React from 'react';
import { UserProfile } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { MapPin, ShieldCheck, X, Heart, Gift, Flag, Lock } from 'lucide-react';

interface ProfileDetailModalProps {
  user: UserProfile;
  onClose: () => void;
  onLike?: () => void;
  onGift?: () => void;
  onReport?: () => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  user,
  onClose,
  onLike,
  onGift,
  onReport
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md my-6 shadow-2xl overflow-hidden">
        {/* Photo header */}
        <div className="relative h-72 w-full bg-neutral-950">
          <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/40" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/10"
          >
            <X size={18} />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{user.displayName}, {user.age}</h2>
              {user.isVerified && <ShieldCheck size={20} className="text-emerald-400" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-300 mt-1">
              <MapPin size={12} className="text-rose-500" />
              <span>{user.town}</span>
              {user.neighborhood && <span>• {user.neighborhood}</span>}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold px-3 py-1 rounded-full">
            <span>Looking for: {user.relationshipIntention}</span>
          </div>

          <div>
            <span className="text-xs font-bold text-neutral-400 block mb-1">About</span>
            <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800">
              {user.bio}
            </p>
          </div>

          {/* Permanent Registration Voice Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>Permanent Voice Introduction</span>
                <span className="text-emerald-400 text-[10px]">Verified ✓</span>
              </span>
              <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                <Lock size={10} /> Tamper-Proof
              </span>
            </div>
            <AudioPlayer
              audioUrl={user.registrationVoiceUrl}
              duration={user.registrationVoiceDuration || 4}
              userName={user.displayName}
              isRegistrationVoice={true}
              seed={user.id}
            />
          </div>

          {/* Interests */}
          <div>
            <span className="text-xs font-bold text-neutral-400 block mb-1.5">Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map(i => (
                <span key={i} className="text-[11px] font-medium bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full border border-neutral-700">
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
            {onGift && (
              <button
                type="button"
                onClick={onGift}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Gift size={14} />
                <span>Gift Sparks</span>
              </button>
            )}

            {onReport && (
              <button
                type="button"
                onClick={onReport}
                className="p-2.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-700 transition"
                title="Report User"
              >
                <Flag size={15} />
              </button>
            )}

            {onLike && (
              <button
                type="button"
                onClick={onLike}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/25 transition"
              >
                <Heart size={14} className="fill-current" />
                <span>Like Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
