import React from 'react';
import { UserProfile } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { MediaGallery } from './MediaGallery';
import { MapPin, ShieldCheck, X, Heart, Gift, Flag, Lock, ArrowLeft } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#EFE3DB] rounded-3xl w-full max-w-md my-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Photo header */}
        <div className="relative h-72 w-full bg-[#FAF4F0]">
          <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

          {/* Prominent Back Button */}
          <button
            type="button"
            id="profile-back-btn"
            onClick={onClose}
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center gap-1.5 border border-white/20 text-xs font-bold shadow-lg transition active:scale-95 group cursor-pointer"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform text-[#FF4A70]" />
            <span>Back</span>
          </button>

          {/* Close Icon Button */}
          <button
            type="button"
            id="profile-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition active:scale-95 cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{user.displayName}, {user.age}</h2>
              {user.isVerified && <ShieldCheck size={20} className="text-emerald-400" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-white/90 mt-1">
              <MapPin size={12} className="text-[#FF4A70]" />
              <span>{user.town}</span>
              {user.neighborhood && <span>• {user.neighborhood}</span>}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="inline-flex items-center gap-1 bg-[#FAF4F0] border border-[#FF4A70]/20 text-[#FF4A70] text-xs font-semibold px-3 py-1 rounded-full">
            <span>Looking for: {user.relationshipIntention}</span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#8A767E] block mb-1">About</span>
            <p className="text-xs text-[#5C454F] leading-relaxed bg-[#FAF4F0] p-3 rounded-2xl border border-[#E5D7CE]">
              {user.bio}
            </p>
          </div>

          {/* Permanent Registration Voice Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2D151E] flex items-center gap-1.5">
                <span>Permanent Voice Introduction</span>
                <span className="text-emerald-600 text-[10px]">Verified ✓</span>
              </span>
              <span className="text-[10px] text-[#8A767E] flex items-center gap-1">
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
            <span className="text-xs font-bold text-[#8A767E] block mb-1.5">Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map(i => (
                <span key={i} className="text-[11px] font-medium bg-[#FAF4F0] text-[#8A767E] px-3 py-1 rounded-full border border-[#E5D7CE]">
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* Media Gallery (Photos & Videos) */}
          <MediaGallery 
            user={user} 
            isEditable={false} 
            onUpdateMedia={() => {}} 
          />

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#EFE3DB]">
            {onGift && (
              <button
                type="button"
                onClick={onGift}
                className="flex-1 py-2.5 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] border border-[#E5D7CE] text-[#FF4A70] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Gift size={14} />
                <span>Gift Sparks</span>
              </button>
            )}

            {onReport && (
              <button
                type="button"
                onClick={onReport}
                className="p-2.5 rounded-full bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE] transition cursor-pointer"
                title="Report User"
              >
                <Flag size={15} />
              </button>
            )}

            {onLike && (
              <button
                type="button"
                onClick={onLike}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 transition cursor-pointer"
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
