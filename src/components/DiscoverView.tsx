import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Advertisement, 
  TownLocation 
} from '../types';
import { storage } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  X, 
  MapPin, 
  ShieldCheck, 
  Flag, 
  Ban, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Filter,
  Info
} from 'lucide-react';

interface DiscoverViewProps {
  currentUser: UserProfile;
  onMatchCreated: (matchedUser: UserProfile) => void;
  onOpenProfile: (user: UserProfile) => void;
  onReportUser: (user: UserProfile) => void;
  onBlockUser: (user: UserProfile) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  currentUser,
  onMatchCreated,
  onOpenProfile,
  onReportUser,
  onBlockUser
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [nextAdThreshold, setNextAdThreshold] = useState(3); // 3 or 4
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [selectedTownFilter, setSelectedTownFilter] = useState<TownLocation | 'All'>('All');
  const [isMatchPopupOpen, setIsMatchPopupOpen] = useState(false);
  const [lastMatchedUser, setLastMatchedUser] = useState<UserProfile | null>(null);

  // Load profiles excluding currentUser, swiped, and blocked
  useEffect(() => {
    loadProfiles();
  }, [currentUser, selectedTownFilter]);

  const loadProfiles = () => {
    const allUsers = storage.getUsers();
    const swiped = new Set(storage.getSwipedIds());
    const blocked = new Set(storage.getBlockedIds());

    const filtered = allUsers.filter(u => {
      if (u.id === currentUser.id) return false;
      if (blocked.has(u.id)) return false;
      if (swiped.has(u.id)) return false;
      if (selectedTownFilter !== 'All' && u.town !== selectedTownFilter) return false;
      return true;
    });

    setProfiles(filtered);
    setCurrentIndex(0);
  };

  const handleInteraction = (type: 'like' | 'pass') => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    // Record swipe
    storage.addSwipedId(currentProfile.id);

    const newCount = interactionCount + 1;
    setInteractionCount(newCount);

    if (type === 'like') {
      // Simulate mutual match check: If profile is Sarah or Junior, it's a mutual match!
      const isMutualMatch = true; // In JudmiSpark showcase, matching creates exciting connections
      if (isMutualMatch) {
        // Create match record in storage
        const matches = storage.getMatches();
        const existingMatch = matches.find(m => 
          m.participants.includes(currentUser.id) && m.participants.includes(currentProfile.id)
        );

        if (!existingMatch) {
          const matchId = `match_${Date.now()}`;
          const newMatch = {
            id: matchId,
            participants: [currentUser.id, currentProfile.id] as [string, string],
            matchedAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            lastMessageText: 'You matched! Send a voice note to say hello.',
            lastMessageSenderId: currentProfile.id,
            userMessageCounts: {
              [currentUser.id]: 0,
              [currentProfile.id]: 0
            },
            userHasSentVoiceNote: {
              [currentUser.id]: false,
              [currentProfile.id]: false
            },
            isVoiceVerified: false,
            isIdentityRevealed: {
              [currentUser.id]: false,
              [currentProfile.id]: false
            },
            unreadCountByUser: {
              [currentUser.id]: 1,
              [currentProfile.id]: 0
            },
            status: 'active' as const
          };

          storage.setMatches([newMatch, ...matches]);

          // Notification
          storage.addNotification({
            id: `notif_${Date.now()}`,
            userId: currentUser.id,
            title: `New Match with ${currentProfile.displayName}! 🎉`,
            message: 'You both liked each other on JudmiSpark.',
            type: 'match',
            relatedId: matchId,
            read: false,
            createdAt: new Date().toISOString()
          });
        }

        // Trigger confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }

        setLastMatchedUser(currentProfile);
        setIsMatchPopupOpen(true);
        onMatchCreated(currentProfile);
      }
    }

    // Check if advertisement should trigger (every 3-4 interactions)
    if (newCount >= nextAdThreshold) {
      const ads = storage.getAds().filter(a => a.active);
      if (ads.length > 0) {
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        setActiveAd(randomAd);
        storage.recordAdImpression(randomAd.id);
        // Reset ad counter with random 3 or 4
        setNextAdThreshold(Math.random() > 0.5 ? 3 : 4);
        setInteractionCount(0);
        return;
      }
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleDismissAd = () => {
    setActiveAd(null);
    setCurrentIndex(prev => prev + 1);
  };

  const handleAdClick = () => {
    if (activeAd) {
      storage.recordAdClick(activeAd.id);
    }
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div id="discover-container" className="max-w-md mx-auto w-full px-4 py-3 flex flex-col min-h-[calc(100vh-140px)]">
      {/* City filter bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
          <Filter size={13} className="text-rose-500" />
          <span>Location:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(['All', 'Bamenda', 'Douala', 'Yaoundé', 'Buea', 'Limbe'] as const).map(town => (
            <button
              key={town}
              type="button"
              onClick={() => setSelectedTownFilter(town)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition ${
                selectedTownFilter === town
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 border border-neutral-700/40'
              }`}
            >
              {town === 'All' ? 'All Cameroon' : town}
            </button>
          ))}
        </div>
      </div>

      {/* MATCH MODAL POPUP */}
      {isMatchPopupOpen && lastMatchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-gradient-to-b from-neutral-900 via-rose-950/40 to-neutral-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/30">
              <Sparkles size={28} />
            </div>
            <span className="text-[11px] font-bold text-rose-400 tracking-wider uppercase">
              It's a JudmiSpark Match!
            </span>
            <h3 className="text-xl font-extrabold text-white mt-1">
              You and {lastMatchedUser.displayName}
            </h3>
            <p className="text-xs text-neutral-300 mt-1 mb-4">
              You both felt the spark! Remember: Match chats require exchanging voice notes within 5 messages.
            </p>

            <div className="flex items-center justify-center gap-3 mb-5">
              <img 
                src={currentUser.profilePicture} 
                alt="You" 
                className="w-16 h-16 rounded-full object-cover border-2 border-rose-500 shadow-md"
              />
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
                ⚡
              </div>
              <img 
                src={lastMatchedUser.profilePicture} 
                alt={lastMatchedUser.displayName} 
                className="w-16 h-16 rounded-full object-cover border-2 border-rose-500 shadow-md"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMatchPopupOpen(false);
                  onMatchCreated(lastMatchedUser);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-xs shadow-lg shadow-rose-500/25 transition hover:scale-[1.02]"
              >
                Send Voice Note or Message
              </button>
              <button
                type="button"
                onClick={() => setIsMatchPopupOpen(false)}
                className="w-full py-2 text-xs text-neutral-400 hover:text-neutral-200 transition"
              >
                Keep Discovering
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVERTISEMENT CARD (Inserted every 3-4 profiles) */}
      {activeAd ? (
        <div id="advertisement-card" className="flex-1 flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-950">
            <img 
              src={activeAd.imageUrl} 
              alt={activeAd.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/40" />
            
            {/* SPONSORED Badge */}
            <div className="absolute top-4 left-4 bg-amber-500/90 text-neutral-950 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <span>SPONSORED</span>
            </div>

            <div className="absolute top-4 right-4 text-xs text-neutral-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {activeAd.advertiserName}
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1.5">
                {activeAd.title}
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                {activeAd.description}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-4">
                <MapPin size={12} className="text-rose-500" />
                <span>Featured for: {activeAd.targetTowns.join(', ')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <a
                href={activeAd.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdClick}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
              >
                <span>{activeAd.ctaButtonText}</span>
                <ExternalLink size={14} />
              </a>

              <button
                type="button"
                onClick={handleDismissAd}
                className="w-full py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium transition"
              >
                Continue Discovering
              </button>
            </div>
          </div>
        </div>
      ) : currentProfile ? (
        /* MAIN PROFILE CARD */
        <div 
          id={`profile-card-${currentProfile.id}`}
          className="flex-1 flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative group"
        >
          {/* Main Photo */}
          <div className="relative h-[380px] sm:h-[420px] w-full overflow-hidden bg-neutral-950 cursor-pointer" onClick={() => onOpenProfile(currentProfile)}>
            <img 
              src={currentProfile.profilePicture} 
              alt={currentProfile.displayName} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-neutral-200 border border-white/10">
                <MapPin size={12} className="text-rose-500" />
                <span>{currentProfile.town}</span>
                {currentProfile.neighborhood && (
                  <span className="text-neutral-400">• {currentProfile.neighborhood}</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Report User"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReportUser(currentProfile);
                  }}
                  className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-neutral-400 hover:text-amber-400 flex items-center justify-center border border-white/10 transition"
                >
                  <Flag size={13} />
                </button>
                <button
                  type="button"
                  title="Block User"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockUser(currentProfile);
                  }}
                  className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-neutral-400 hover:text-rose-400 flex items-center justify-center border border-white/10 transition"
                >
                  <Ban size={13} />
                </button>
              </div>
            </div>

            {/* Profile info on image */}
            <div className="absolute bottom-3 left-4 right-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-extrabold text-white">
                  {currentProfile.displayName}, {currentProfile.age}
                </h2>
                {currentProfile.isVerified && (
                  <span title="Voice Verified User" className="text-emerald-400 flex items-center">
                    <ShieldCheck size={18} className="fill-emerald-400/20" />
                  </span>
                )}
              </div>

              {/* Relationship Intention Badge */}
              <div className="inline-flex items-center gap-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
                <span>Looking for: {currentProfile.relationshipIntention}</span>
              </div>

              {/* Bio */}
              <p className="text-xs text-neutral-200 line-clamp-2 leading-relaxed">
                {currentProfile.bio}
              </p>
            </div>
          </div>

          {/* Card Body with Voice Note & Interests */}
          <div className="p-4 space-y-3 bg-neutral-900 flex-1 flex flex-col justify-between">
            {/* Permanent Voice Introduction Player */}
            <div>
              <AudioPlayer
                audioUrl={currentProfile.registrationVoiceUrl}
                duration={currentProfile.registrationVoiceDuration || 4}
                userName={currentProfile.displayName}
                isRegistrationVoice={true}
                seed={currentProfile.id}
              />
            </div>

            {/* Interests Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentProfile.interests.slice(0, 4).map(interest => (
                <span 
                  key={interest} 
                  className="text-[10px] font-medium bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full border border-neutral-700/60"
                >
                  {interest}
                </span>
              ))}
              {currentProfile.interests.length > 4 && (
                <span className="text-[10px] font-medium text-neutral-400 px-1 py-0.5">
                  +{currentProfile.interests.length - 4} more
                </span>
              )}
            </div>

            {/* Action Buttons: Pass (X) and Like (Heart) */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-neutral-800/80">
              <button
                id="discover-pass-btn"
                type="button"
                onClick={() => handleInteraction('pass')}
                className="w-14 h-14 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 flex items-center justify-center shadow-lg border border-neutral-700 transition hover:scale-110 active:scale-95 group"
                title="Pass"
              >
                <X size={26} className="group-hover:rotate-90 transition-transform" />
              </button>

              <button
                id="discover-details-btn"
                type="button"
                onClick={() => onOpenProfile(currentProfile)}
                className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-700 hover:bg-neutral-700 transition"
                title="View Full Profile"
              >
                <Info size={18} />
              </button>

              <button
                id="discover-like-btn"
                type="button"
                onClick={() => handleInteraction('like')}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 transition hover:scale-110 active:scale-95 group"
                title="Like"
              >
                <Heart size={26} className="fill-current group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* EMPTY STATE: All profiles swiped */
        <div id="discover-empty-state" className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-neutral-900/60 border border-neutral-800 rounded-3xl my-auto">
          <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-rose-500 mb-4 shadow-lg">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            You're All Caught Up!
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mb-6">
            You've explored the current profiles in {selectedTownFilter === 'All' ? 'Cameroon' : selectedTownFilter}. Check back soon or reset your discovery history.
          </p>

          <button
            type="button"
            onClick={() => {
              // Reset swiped history
              localStorage.removeItem('judmispark_swiped_profiles');
              loadProfiles();
            }}
            className="py-2.5 px-5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 transition"
          >
            Reset Discover Feed
          </button>
        </div>
      )}
    </div>
  );
};
