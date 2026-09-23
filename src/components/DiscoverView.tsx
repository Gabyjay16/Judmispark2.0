import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  Advertisement, 
  TownLocation 
} from '../types';
import { storage } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import { DiscoverMediaCarousel } from './DiscoverMediaCarousel';
import { DiscoverFilterModal } from './DiscoverFilterModal';
import { 
  DiscoverFilterOptions, 
  DEFAULT_DISCOVER_FILTERS, 
  MatchScoreResult,
  filterAndRankProfiles 
} from '../utils/matchingAlgorithm';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  X, 
  MapPin, 
  ShieldCheck, 
  Flag, 
  Sparkles, 
  ExternalLink,
  ChevronRight, 
  Filter, 
  Repeat,
  Trash2,
  Info,
  Sliders
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
  const [rankedProfiles, setRankedProfiles] = useState<{ profile: UserProfile; match: MatchScoreResult }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [nextAdThreshold, setNextAdThreshold] = useState(3); // 3 or 4
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [filters, setFilters] = useState<DiscoverFilterOptions>(DEFAULT_DISCOVER_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isMatchPopupOpen, setIsMatchPopupOpen] = useState(false);
  const [lastMatchedUser, setLastMatchedUser] = useState<UserProfile | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ id: number; type: 'greeting' | 'like' | 'removed'; title: string; subtitle?: string } | null>(null);
  const [likedProfileIds, setLikedProfileIds] = useState<Set<string>>(new Set());

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => {
        setFeedbackToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  // Load profiles excluding currentUser, swiped, and blocked, sorted by matching algorithm
  useEffect(() => {
    loadProfiles();
  }, [currentUser, filters]);

  const loadProfiles = () => {
    const allUsers = storage.getUsers();
    const swiped = new Set(storage.getSwipedIds());
    const blocked = new Set(storage.getBlockedIds());

    const ranked = filterAndRankProfiles(allUsers, currentUser, filters, swiped, blocked);

    setRankedProfiles(ranked);
    setCurrentIndex(0);
  };

  const currentScored = rankedProfiles[currentIndex];
  const currentProfile = currentScored?.profile;

  const goToNextProfile = () => {
    if (rankedProfiles.length === 0) return;
    const newCount = interactionCount + 1;
    setInteractionCount(newCount);

    if (newCount >= nextAdThreshold) {
      const ads = storage.getAds().filter(a => a.active);
      if (ads.length > 0) {
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        setActiveAd(randomAd);
        storage.recordAdImpression(randomAd.id);
        setNextAdThreshold(Math.random() > 0.5 ? 3 : 4);
        setInteractionCount(0);
        return;
      }
    }

    setCurrentIndex(prev => (prev + 1 < rankedProfiles.length ? prev + 1 : 0));
  };

  const goToPrevProfile = () => {
    if (rankedProfiles.length === 0) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : rankedProfiles.length - 1));
  };

  const handleStandardLike = (currentProfile: UserProfile) => {
    storage.addSwipedId(currentProfile.id);
    setLikedProfileIds(prev => new Set(prev).add(currentProfile.id));
    storage.addLike(currentUser.id, currentProfile.id, 'single_tap_like');

    // Ensure match record exists
    const matches = storage.getMatches();
    const existingMatch = matches.find(m => 
      m.participants.includes(currentUser.id) && m.participants.includes(currentProfile.id)
    );

    if (!existingMatch) {
      const matchId = `match_${currentUser.id}_${currentProfile.id}_${Date.now()}`;
      const newMatch = {
        id: matchId,
        participants: [currentUser.id, currentProfile.id] as [string, string],
        matchedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessageText: 'Liked profile ❤️',
        lastMessageSenderId: currentUser.id,
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
          [currentUser.id]: 0,
          [currentProfile.id]: 0
        },
        status: 'active' as const,
        isLikedMatch: true
      };
      storage.setMatches([newMatch, ...matches]);
    } else {
      existingMatch.isLikedMatch = true;
      storage.setMatches(matches.map(m => m.id === existingMatch.id ? existingMatch : m));
    }

    // Gentle micro celebration
    try {
      confetti({
        particleCount: 15,
        spread: 30,
        origin: { y: 0.85 }
      });
    } catch {
      // ignore
    }

    // Show feedback popup with hint
    setFeedbackToast({
      id: Date.now(),
      type: 'like',
      title: `Liked ${currentProfile.displayName}'s profile ❤️`,
      subtitle: 'Double-tap the heart to send instant Hello 👋'
    });
  };

  const handleSendGreetingMessage = (currentProfile: UserProfile) => {
    storage.addSwipedId(currentProfile.id);
    setLikedProfileIds(prev => new Set(prev).add(currentProfile.id));

    const greetingText = `Hello ${currentProfile.displayName}! 👋`;
    const matches = storage.getMatches();
    const existingMatch = matches.find(m => 
      m.participants.includes(currentUser.id) && m.participants.includes(currentProfile.id)
    );

    const matchId = existingMatch ? existingMatch.id : `match_${currentUser.id}_${currentProfile.id}_${Date.now()}`;

    if (!existingMatch) {
      const newMatch = {
        id: matchId,
        participants: [currentUser.id, currentProfile.id] as [string, string],
        matchedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessageText: greetingText,
        lastMessageSenderId: currentUser.id,
        userMessageCounts: {
          [currentUser.id]: 1,
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
          [currentUser.id]: 0,
          [currentProfile.id]: 1
        },
        status: 'active' as const
      };

      storage.setMatches([newMatch, ...matches]);
    } else {
      existingMatch.lastMessageAt = new Date().toISOString();
      existingMatch.lastMessageText = greetingText;
      existingMatch.lastMessageSenderId = currentUser.id;
      existingMatch.userMessageCounts[currentUser.id] = (existingMatch.userMessageCounts[currentUser.id] || 0) + 1;
      storage.setMatches(matches.map(m => m.id === existingMatch.id ? existingMatch : m));
    }

    // Add the chat message into conversation storage
    const newChatMessage = {
      id: `msg_greet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: matchId,
      senderId: currentUser.id,
      receiverId: currentProfile.id,
      text: greetingText,
      isVoiceNote: false,
      createdAt: new Date().toISOString(),
      read: false
    };
    const messages = storage.getMessages();
    storage.setMessages([...messages, newChatMessage]);

    // Add in-app notification
    storage.addNotification({
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: `Greeting sent to ${currentProfile.displayName} 👋`,
      message: `Sent: "${greetingText}"`,
      type: 'match',
      relatedId: matchId,
      read: false,
      createdAt: new Date().toISOString()
    });

    // Show confirmation pop-up at the bottom
    setFeedbackToast({
      id: Date.now(),
      type: 'greeting',
      title: `Greeting sent to ${currentProfile.displayName} 👋`,
      subtitle: `"${greetingText}"`
    });

    // Micro heart confetti celebration
    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.8 }
      });
    } catch {
      // ignore
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfile) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
      // Double tap detected -> instant greeting
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleSendGreetingMessage(currentProfile);
    } else {
      // First tap -> schedule single tap (standard like)
      lastTapTimeRef.current = now;
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      clickTimerRef.current = setTimeout(() => {
        handleStandardLike(currentProfile);
        clickTimerRef.current = null;
        lastTapTimeRef.current = 0;
      }, 280);
    }
  };

  const handleInteraction = (type: 'like' | 'pass') => {
    if (!currentProfile) return;

    if (type === 'pass') {
      const removedName = currentProfile.displayName;
      // Permanently register swipe so it won't be seen again
      storage.addSwipedId(currentProfile.id);

      // Immediately filter this card out from the current discovery list
      const nextRanked = rankedProfiles.filter(p => p.profile.id !== currentProfile.id);
      setRankedProfiles(nextRanked);

      if (currentIndex >= nextRanked.length) {
        setCurrentIndex(Math.max(0, nextRanked.length - 1));
      }

      // Show confirmation popup: "Card removed"
      setFeedbackToast({
        id: Date.now(),
        type: 'removed',
        title: 'Card removed',
        subtitle: `${removedName}'s card removed from your feed`
      });

      return;
    }

    if (type === 'like') {
      handleStandardLike(currentProfile);
    }
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

  const isCurrentProfileLiked = currentProfile ? likedProfileIds.has(currentProfile.id) : false;

  // Compute a short human-friendly summary of active filter
  const filterSummary = React.useMemo(() => {
    const isDefaultSort = filters.sortMode === 'best_match';
    const isAllTowns = filters.town === 'All';
    const isDefaultAge = filters.minAge === 18 && filters.maxAge === 55;
    const isAllIntentions = filters.intention === 'All';

    if (isDefaultSort && isAllTowns && isDefaultAge && isAllIntentions) {
      return '⚡ Best Match';
    }

    const parts: string[] = [];
    if (filters.sortMode === 'best_match') parts.push('⚡ Match');
    else if (filters.sortMode === 'same_town') parts.push('📍 City');
    else if (filters.sortMode === 'most_recent') parts.push('🕒 New');

    if (!isAllTowns) parts.push(filters.town);
    if (!isDefaultAge) parts.push(`${filters.minAge}-${filters.maxAge}y`);
    if (!isAllIntentions) parts.push(filters.intention);

    return parts.join(' • ');
  }, [filters]);

  return (
    <div id="discover-container" className="max-w-md mx-auto w-full px-3 pt-2 pb-[68px] h-[calc(100vh-3.5rem)] flex flex-col justify-start">
      {/* FILTER & ALGORITHM MODAL */}
      <DiscoverFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
        }}
        currentUserTown={currentUser.town}
        totalMatchingCount={rankedProfiles.length}
      />

      {/* MATCH MODAL POPUP */}
      {isMatchPopupOpen && lastMatchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/25">
              <Sparkles size={28} />
            </div>
            <span className="text-[11px] font-bold text-[#FF4A70] tracking-wider uppercase">
              It's a JudmiSpark Match!
            </span>
            <h3 className="text-xl font-extrabold text-[#2D151E] mt-1">
              You and {lastMatchedUser.displayName}
            </h3>
            <p className="text-xs text-[#7A666F] mt-1 mb-4">
              You both felt the spark! Remember: Match chats require exchanging voice notes within 5 messages.
            </p>

            <div className="flex items-center justify-center gap-3 mb-5">
              <img 
                src={currentUser.profilePicture} 
                alt="You" 
                className="w-16 h-16 rounded-full object-cover border-2 border-[#FF4A70] shadow-md"
              />
              <div className="w-8 h-8 rounded-full bg-[#FF4A70]/15 border border-[#FF4A70]/30 flex items-center justify-center text-[#FF4A70] font-bold">
                ⚡
              </div>
              <img 
                src={lastMatchedUser.profilePicture} 
                alt={lastMatchedUser.displayName} 
                className="w-16 h-16 rounded-full object-cover border-2 border-[#FF4A70] shadow-md"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMatchPopupOpen(false);
                  onMatchCreated(lastMatchedUser);
                }}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition hover:opacity-95"
              >
                Send Voice Note or Message
              </button>
              <button
                type="button"
                onClick={() => setIsMatchPopupOpen(false)}
                className="w-full py-2 text-xs font-semibold text-[#8A767E] hover:text-[#2D151E] transition cursor-pointer"
              >
                Keep Discovering
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVERTISEMENT CARD (Inserted every 3-4 profiles) */}
      {activeAd ? (
        <div id="advertisement-card" className="flex-1 min-h-0 flex flex-col bg-white border border-[#EFE3DB] rounded-3xl overflow-hidden shadow-xl relative">
          <div className="relative h-60 sm:h-64 w-full overflow-hidden bg-neutral-950">
            <img 
              src={activeAd.imageUrl} 
              alt={activeAd.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D151E] via-transparent to-black/40" />
            
            {/* SPONSORED Badge */}
            <div className="absolute top-4 left-4 bg-amber-400 text-neutral-950 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <span>SPONSORED</span>
            </div>

            <div className="absolute top-4 right-4 text-xs text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              {activeAd.advertiserName}
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between bg-white">
            <div>
              <h3 className="text-base font-bold text-[#2D151E] mb-1">
                {activeAd.title}
              </h3>
              <p className="text-xs text-[#7A666F] leading-relaxed mb-3">
                {activeAd.description}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#8A767E] mb-3">
                <MapPin size={12} className="text-[#FF4A70]" />
                <span>Featured for: {activeAd.targetTowns.join(', ')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F2E7DF]">
              <a
                href={activeAd.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdClick}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-500/25 transition"
              >
                <span>{activeAd.ctaButtonText}</span>
                <ExternalLink size={14} />
              </a>

              <button
                type="button"
                onClick={handleDismissAd}
                className="w-full py-1.5 rounded-xl text-[#8A767E] hover:text-[#2D151E] text-xs font-semibold transition cursor-pointer"
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
          className="flex-1 min-h-0 flex flex-col bg-white border border-[#EFE3DB] rounded-3xl overflow-hidden shadow-xl relative group"
        >
          {/* Main Photo & Video Swiper Carousel with In-Card Location & Matching Algorithm Filter */}
          <DiscoverMediaCarousel
            user={currentProfile}
            selectedTownFilter={filters.town}
            filterSummary={filterSummary}
            matchScore={currentScored?.match.matchPercentage}
            matchReasons={currentScored?.match.reasons}
            onOpenFilterModal={() => setIsFilterModalOpen(true)}
            onOpenProfile={() => onOpenProfile(currentProfile)}
            onReportUser={() => onReportUser(currentProfile)}
            onBlockUser={() => onBlockUser(currentProfile)}
            onNextUser={goToNextProfile}
            onPrevUser={goToPrevProfile}
          />

          {/* Card Body with Voice Note & Interests */}
          <div className="p-3 space-y-2 bg-white shrink-0 flex flex-col justify-between">
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
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {currentProfile.interests.slice(0, 4).map(interest => {
                const isShared = (currentScored?.match.sharedInterests || [])
                  .some(si => si.toLowerCase().trim() === interest.toLowerCase().trim());
                return (
                  <span 
                    key={interest} 
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition ${
                      isShared 
                        ? 'bg-[#FF4A70]/10 text-[#FF4A70] border-[#FF4A70]/30 shadow-2xs font-bold' 
                        : 'bg-[#FAF4F0] text-[#7A666F] border-[#E9DDD5]'
                    }`}
                  >
                    {isShared ? `⚡ ${interest}` : interest}
                  </span>
                );
              })}
              {currentProfile.interests.length > 4 && (
                <span className="text-[10px] font-medium text-[#8A767E] px-1 py-0.5">
                  +{currentProfile.interests.length - 4} more
                </span>
              )}
            </div>

            {/* Action Buttons: Pass (X), Swap (Middle), and Like (Heart) */}
            <div className="flex items-center justify-center gap-5 pt-1.5 border-t border-[#F2E7DF]">
              {/* Pass Button */}
              <button
                id="discover-pass-btn"
                type="button"
                onClick={() => handleInteraction('pass')}
                className="w-12 h-12 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#7A666F] hover:text-[#FF4A70] flex items-center justify-center shadow-sm border border-[#E5D7CE] transition hover:scale-110 active:scale-95 group cursor-pointer"
                title="Pass"
              >
                <X size={22} className="group-hover:rotate-90 transition-transform" />
              </button>

              {/* Intuitive SWAP Profile Button in Middle */}
              <button
                id="discover-swap-btn"
                type="button"
                onClick={goToNextProfile}
                className="h-11 px-5 rounded-full bg-[#2D151E] hover:bg-black text-white flex items-center gap-2 border border-[#2D151E] shadow-md transition hover:scale-105 active:scale-95 group font-bold text-xs cursor-pointer"
                title="Swap to Next User Card"
              >
                <Repeat size={15} className="text-[#FF7B60] group-hover:rotate-180 transition-transform duration-300" />
                <span>Swap</span>
              </button>

              {/* Like / Love Button (Single Tap = Like, Double Tap = Instant Greeting) */}
              <button
                id="discover-like-btn"
                type="button"
                onClick={handleHeartClick}
                className={`w-12 h-12 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white flex items-center justify-center shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition hover:scale-110 active:scale-95 group cursor-pointer ${
                  isCurrentProfileLiked ? 'ring-2 ring-[#FF4A70]' : ''
                }`}
                title="Single tap to Like ❤️ | Double tap to send Hello 👋"
              >
                <Heart size={22} className={`fill-current transition-transform ${isCurrentProfileLiked ? 'scale-110' : 'group-hover:scale-110'}`} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* EMPTY STATE: All profiles swiped or filtered */
        <div id="discover-empty-state" className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-[#EFE3DB] rounded-3xl my-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF4F0] border border-[#E5D7CE] flex items-center justify-center text-[#FF4A70] mb-4 shadow-sm">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-extrabold text-[#2D151E] mb-1">
            No Matching Profiles Right Now
          </h3>
          <p className="text-xs text-[#8A767E] max-w-xs mb-4">
            No profiles found matching your active filter ({filterSummary}). Try broadening your age limit or location.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="py-2.5 px-5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sliders size={14} />
              <span>Adjust Discovery Filters</span>
            </button>

            <button
              type="button"
              onClick={() => {
                // Reset swiped history and filters
                localStorage.removeItem('judmispark_swiped_profiles');
                setFilters(DEFAULT_DISCOVER_FILTERS);
              }}
              className="py-2.5 px-5 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] border border-[#E5D7CE] text-xs font-semibold text-[#2D151E] transition cursor-pointer"
            >
              Reset Swipes & Filters
            </button>
          </div>
        </div>
      )}

      {/* DISCOVER ACTION BOTTOM CONFIRMATION POPUP */}
      {feedbackToast && (
        <div 
          id="discover-action-toast"
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-[#2D151E]/95 border border-[#482834] text-white px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-md ${
              feedbackToast.type === 'removed' 
                ? 'bg-white/10 text-rose-300 border border-white/15' 
                : feedbackToast.type === 'like'
                ? 'bg-rose-500/20 text-[#FF7B60] border border-rose-500/40'
                : 'bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] text-white shadow-rose-500/20'
            }`}>
              {feedbackToast.type === 'removed' ? (
                <Trash2 size={15} />
              ) : feedbackToast.type === 'like' ? (
                <Heart size={15} className="fill-[#FF4A70] text-[#FF4A70]" />
              ) : (
                '👋'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {feedbackToast.title}
              </p>
              {feedbackToast.subtitle && (
                <p className="text-[11px] text-neutral-300 truncate font-medium">
                  {feedbackToast.subtitle}
                </p>
              )}
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => setFeedbackToast(null)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
