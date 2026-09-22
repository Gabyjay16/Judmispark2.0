import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ProfileVideo, TownLocation } from '../types';
import { 
  Camera, 
  Video as VideoIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  ShieldCheck, 
  Flag, 
  Ban, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Clock,
  Filter,
  ChevronDown,
  Check,
  Sparkles,
  Sliders
} from 'lucide-react';

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  title?: string;
  duration?: number;
}

interface DiscoverMediaCarouselProps {
  user: UserProfile;
  selectedTownFilter?: TownLocation | 'All';
  filterSummary?: string;
  matchScore?: number;
  matchReasons?: string[];
  onOpenFilterModal?: () => void;
  onSelectTownFilter?: (town: TownLocation | 'All') => void;
  onOpenProfile: () => void;
  onReportUser: () => void;
  onBlockUser: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
}

export const DiscoverMediaCarousel: React.FC<DiscoverMediaCarouselProps> = ({
  user,
  selectedTownFilter = 'All',
  filterSummary,
  matchScore,
  matchReasons = [],
  onOpenFilterModal,
  onSelectTownFilter,
  onOpenProfile,
  onReportUser,
  onBlockUser,
  onNextUser,
  onPrevUser
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset active media index whenever the user changes
  useEffect(() => {
    setActiveMediaIndex(0);
    setIsPlaying(true);
    setVideoProgress(0);
  }, [user.id]);

  // Touch tracking for swipe right-to-left and left-to-right
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const mouseStartXRef = useRef<number>(0);

  // Build the list of media items:
  // 1. MUST start with user's chosen display picture (user.profilePicture)
  // 2. Next: user's other photos (up to 7 photos)
  // 3. Next: user's videos (up to 2 videos, max 1 min each)
  const mediaItems: MediaItem[] = React.useMemo(() => {
    const items: MediaItem[] = [];
    const displayPic = user.profilePicture;

    // 1. Chosen display picture first
    if (displayPic) {
      items.push({
        id: `main_pic_${displayPic.slice(-10)}`,
        type: 'photo',
        url: displayPic,
        title: 'Display Picture'
      });
    }

    // 2. Other photos (excluding display picture to avoid duplication)
    const otherPhotos = (user.photos || []).filter(p => p !== displayPic);
    otherPhotos.forEach((photoUrl, idx) => {
      items.push({
        id: `photo_${idx}_${photoUrl.slice(-10)}`,
        type: 'photo',
        url: photoUrl,
        title: `Photo ${items.length + 1}`
      });
    });

    // 3. Videos (up to 2 videos, max 1 minute)
    const videos = user.videos || [];
    videos.forEach((vid: ProfileVideo) => {
      items.push({
        id: vid.id,
        type: 'video',
        url: vid.url,
        title: vid.title || 'Profile Video',
        duration: vid.duration
      });
    });

    // Fallback if user has no media
    if (items.length === 0) {
      items.push({
        id: 'fallback_avatar',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        title: 'Display Picture'
      });
    }

    return items;
  }, [user.profilePicture, user.photos, user.videos]);

  // Reset media index when switching to another user profile
  useEffect(() => {
    setActiveMediaIndex(0);
    setIsPlaying(true);
  }, [user.id]);

  // Handle video element play/pause state
  useEffect(() => {
    const currentMedia = mediaItems[activeMediaIndex];
    if (currentMedia?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy might require mute
        setIsMuted(true);
      });
      setIsPlaying(true);
    }
  }, [activeMediaIndex, mediaItems]);

  const goToNextMedia = () => {
    if (activeMediaIndex < mediaItems.length - 1) {
      setActiveMediaIndex(prev => prev + 1);
    }
  };

  const goToPrevMedia = () => {
    if (activeMediaIndex > 0) {
      setActiveMediaIndex(prev => prev - 1);
    }
  };

  // Touch Swipe Handlers (Right to Left to see next photos/videos)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;
    const timeElapsed = Date.now() - touchStartTimeRef.current;

    // Determine if it was a horizontal swipe
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) && timeElapsed < 800) {
      if (deltaX < 0) {
        // Swiped right to left -> NEXT photo/video
        goToNextMedia();
      } else {
        // Swiped left to right -> PREVIOUS photo/video
        goToPrevMedia();
      }
    }
  };

  // Mouse drag handler for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    mouseStartXRef.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const deltaX = e.clientX - mouseStartXRef.current;

    if (Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        goToNextMedia();
      } else {
        goToPrevMedia();
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const toggleVideoPlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const currentMedia = mediaItems[activeMediaIndex] || mediaItems[0];
  const isVideo = currentMedia?.type === 'video';

  return (
    <div 
      className="relative flex-1 min-h-[240px] w-full overflow-hidden bg-neutral-950 select-none group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Visual Media Rendering */}
      {isVideo ? (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={currentMedia.url}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            onTimeUpdate={handleVideoTimeUpdate}
            className="w-full h-full object-cover"
          />

          {/* Video bottom scrubber bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-20">
            <div 
              className="h-full bg-rose-500 transition-all duration-100" 
              style={{ width: `${videoProgress}%` }}
            />
          </div>

          {/* Sound & Play Controls */}
          <div className="absolute bottom-16 right-3 z-30 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleVideoPlayback}
              className="w-7 h-7 rounded-full bg-black/75 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 transition shadow-lg border border-white/10"
              title={isPlaying ? 'Pause Video' : 'Play Video'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className="w-7 h-7 rounded-full bg-black/75 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 transition shadow-lg border border-white/10"
              title={isMuted ? 'Unmute Video' : 'Mute Video'}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          </div>
        </div>
      ) : (
        <img 
          src={currentMedia.url} 
          alt={user.displayName} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          draggable={false}
        />
      )}

      {/* Gradient Overlays for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-black/60 pointer-events-none" />

      {/* Story / Media Segments Progress Bar at Top (like Instagram/Tinder) */}
      {mediaItems.length > 1 && (
        <div className="absolute top-2 left-3 right-3 z-30 flex items-center gap-1 pointer-events-auto">
          {mediaItems.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex(idx);
              }}
              title={item.type === 'video' ? `Video #${idx + 1}` : `Photo #${idx + 1}`}
              className="flex-1 h-1 rounded-full overflow-hidden transition-all bg-white/30 hover:bg-white/60"
            >
              <div 
                className={`h-full transition-all duration-300 ${
                  idx === activeMediaIndex 
                    ? 'bg-rose-500 w-full' 
                    : idx < activeMediaIndex 
                    ? 'bg-white/80 w-full' 
                    : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Top Header: Location & Algorithm Filter Button, Media Counter & Actions */}
      <div className="absolute top-4 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {/* Filter Button opening Full Algorithm & Filter Modal */}
        <div>
          <button
            type="button"
            id="discover-card-location-filter-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFilterModal?.();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition hover:scale-105 active:scale-95 ${
              selectedTownFilter !== 'All' || filterSummary
                ? 'bg-rose-500 text-white border-rose-400/50 shadow-rose-500/30'
                : 'bg-black/70 text-neutral-200 border-white/20 hover:bg-black/90 hover:text-white'
            }`}
            title="Open Matching Algorithm & Age/Location Filters"
          >
            <Sliders size={12} className={selectedTownFilter !== 'All' ? 'text-white' : 'text-rose-400'} />
            <span className="max-w-[130px] truncate">
              {filterSummary || (selectedTownFilter === 'All' ? 'Filter & Match' : selectedTownFilter)}
            </span>
          </button>
        </div>

        {/* Media Type & Counter Badge + Report / Block Actions */}
        <div className="flex items-center gap-1.5">
          {/* Match Score Badge if available */}
          {matchScore !== undefined && (
            <div 
              className="flex items-center gap-1 bg-gradient-to-r from-rose-600/90 to-pink-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-black text-white border border-rose-400/40 shadow-lg shadow-rose-500/25 animate-in zoom-in-95"
              title={matchReasons.join(' • ')}
            >
              <Sparkles size={11} className="text-amber-300" />
              <span>{matchScore}% Match</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/10 shadow-lg">
            {isVideo ? (
              <>
                <VideoIcon size={11} className="text-rose-400 animate-pulse" />
                <span>Video {activeMediaIndex + 1}/{mediaItems.length}</span>
              </>
            ) : (
              <>
                <Camera size={11} className="text-rose-400" />
                <span>{activeMediaIndex + 1}/{mediaItems.length}</span>
              </>
            )}
          </div>

          {/* Report Button */}
          <button
            type="button"
            title="Report User"
            onClick={(e) => {
              e.stopPropagation();
              onReportUser();
            }}
            className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md text-neutral-300 hover:text-amber-400 flex items-center justify-center border border-white/10 transition"
          >
            <Flag size={11} />
          </button>
        </div>
      </div>

      {/* Interactive Navigation Zones:
          - Left 50% zone taps to swap to previous user card
          - Right 50% zone taps to swap to next user card
          - Swipe gesture cycles through photos & videos
      */}
      <div className="absolute inset-0 z-20 flex pointer-events-auto">
        {/* Left Tap Zone -> Previous User Card */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onPrevUser?.();
          }}
          className="w-1/2 h-full cursor-pointer flex items-center justify-start pl-2 select-none"
          title="Tap to swap to previous user card"
        >
          <div className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 opacity-40 hover:opacity-100 hover:scale-110 active:scale-95 transition shadow-lg">
            <ChevronLeft size={18} />
          </div>
        </div>

        {/* Right Tap Zone -> Next User Card */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onNextUser?.();
          }}
          className="w-1/2 h-full cursor-pointer flex items-center justify-end pr-2 select-none"
          title="Tap to swap to next user card"
        >
          <div className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 opacity-40 hover:opacity-100 hover:scale-110 active:scale-95 transition shadow-lg">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>

      {/* Bottom Profile Info Overlay on Media */}
      <div 
        className="absolute bottom-2.5 left-3 right-3 z-30 pointer-events-none"
      >
        {/* Match Highlights Ribbon */}
        {matchReasons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {matchReasons.slice(0, 2).map((reason, rIdx) => (
              <span 
                key={rIdx}
                className="text-[10px] font-bold bg-black/75 backdrop-blur-md text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full shadow-sm"
              >
                ✨ {reason}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-xl font-extrabold text-white truncate">
              {user.displayName}, {user.age}
            </h2>
            {user.isVerified && (
              <span title="Voice Verified User" className="text-emerald-400 shrink-0">
                <ShieldCheck size={16} className="fill-emerald-400/20" />
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-300 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 shrink-0">
            <MapPin size={10} className="text-rose-400" />
            <span>{user.town}</span>
            {user.neighborhood && <span className="text-neutral-400">• {user.neighborhood}</span>}
          </div>
        </div>

        {/* Relationship Intention Badge */}
        <div className="inline-flex items-center gap-1 bg-rose-500/25 border border-rose-500/40 text-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1">
          <span>Looking for: {user.relationshipIntention}</span>
        </div>

        {/* Bio (compact 1 line clamp) */}
        <p className="text-[11px] text-neutral-200 line-clamp-1 leading-tight">
          {user.bio}
        </p>
      </div>
    </div>
  );
};
