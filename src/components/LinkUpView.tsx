import React, { useState } from 'react';
import { 
  UserProfile, 
  LinkUpPost, 
  TownLocation 
} from '../types';
import { storage } from '../utils/storage';
import { 
  Zap, 
  MapPin, 
  Clock, 
  Plus, 
  Filter, 
  User, 
  EyeOff, 
  MessageSquare, 
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface LinkUpViewProps {
  currentUser: UserProfile;
  onOpenChatWithUser: (targetUserId: string, initialMessage?: string) => void;
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

type GenderFilter = 'all' | 'female' | 'male' | 'non-binary';

export const LinkUpView: React.FC<LinkUpViewProps> = ({
  currentUser,
  onOpenChatWithUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'mine'>('all');
  const [selectedTown, setSelectedTown] = useState<TownLocation | 'All'>('All');
  const [selectedGender, setSelectedGender] = useState<GenderFilter>('all');
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(99);
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<LinkUpPost | null>(null);
  const [postedToast, setPostedToast] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  
  const [newPost, setNewPost] = useState({
    town: currentUser.town,
    availability: 'Tonight' as const,
    time: '7:30 PM',
    message: '',
    isAnonymous: false
  });

  const allPosts = storage.getLinkUps();
  const myPosts = allPosts.filter(p => p.userId === currentUser.id);
  const myPostsCount = myPosts.length;

  // Active filters count
  const activeFiltersCount = 
    (selectedTown !== 'All' ? 1 : 0) + 
    (selectedGender !== 'all' ? 1 : 0) + 
    (minAge > 18 || maxAge < 99 ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedTown('All');
    setSelectedGender('all');
    setMinAge(18);
    setMaxAge(99);
  };

  const handleDeletePost = (postId: string) => {
    storage.deleteLinkUp(postId);
    setPostToDelete(null);
    setPostedToast('Link Up deleted successfully');
    setTimeout(() => {
      setPostedToast(null);
    }, 2000);
  };

  // Filter posts by town, gender, and age
  const filteredPosts = allPosts.filter(p => {
    if (p.status === 'expired') return false;
    
    // Town filter
    if (selectedTown !== 'All' && p.town !== selectedTown) return false;

    // Gender filter
    if (selectedGender !== 'all') {
      const gender = p.userGender || (p.userId === currentUser.id ? currentUser.gender : undefined);
      if (gender && gender !== selectedGender) return false;
    }

    // Age filter
    const age = p.userAge || (p.userId === currentUser.id ? currentUser.age : 24);
    if (age < minAge || age > maxAge) return false;

    return true;
  });

  const handleCreateLinkUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.message.trim()) return;

    const created = new Date();
    const expires = new Date(created.getTime() + 24 * 3600 * 1000); // 24 hours exact
    const newPostId = `link_${Date.now()}`;

    const post: LinkUpPost = {
      id: newPostId,
      userId: currentUser.id,
      userDisplayName: newPost.isAnonymous ? 'Anonymous Spark User' : currentUser.displayName,
      userPhoto: newPost.isAnonymous ? '' : currentUser.profilePicture,
      userAge: currentUser.age,
      userGender: currentUser.gender,
      isAnonymous: newPost.isAnonymous,
      town: newPost.town,
      availability: newPost.availability,
      time: newPost.time || 'Tonight',
      message: newPost.message.trim(),
      createdAt: created.toISOString(),
      expiresAt: expires.toISOString(),
      replyCount: 0,
      status: 'active'
    };

    storage.setLinkUps([post, ...allPosts]);
    setIsCreateModalOpen(false);
    setNewPost({
      town: currentUser.town,
      availability: 'Tonight',
      time: '7:30 PM',
      message: '',
      isAnonymous: false
    });

    // Ensure the post is visible if current town filter would hide it
    if (selectedTown !== 'All' && selectedTown !== post.town) {
      setSelectedTown('All');
    }

    // Show small confirmation message
    setPostedToast('Link Up Posted! 🎉');
    setHighlightedPostId(newPostId);

    // Scroll to the post and highlight once automatically
    setTimeout(() => {
      const el = document.getElementById(`post-${newPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Automatically remove highlight after 1.6s (short snappy highlight)
    setTimeout(() => {
      setHighlightedPostId(null);
    }, 1600);

    // Remove toast after 2s
    setTimeout(() => {
      setPostedToast(null);
    }, 2000);
  };

  const calculateHoursRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  const formatGenderDisplay = (gender?: string) => {
    if (!gender) return 'Spark Member';
    if (gender === 'female') return '♀ Female';
    if (gender === 'male') return '♂ Male';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <div id="linkup-page-view" className="max-w-md mx-auto w-full px-4 pb-24 relative">
      {/* Posted Toast Confirmation Banner */}
      {postedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-amber-500/60 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center font-black shrink-0">
            <Check size={13} />
          </div>
          <span className="text-amber-300">{postedToast}</span>
        </div>
      )}

      {/* STICKY HEADER & FILTERS BAR (Fixed when scrolling) */}
      <div className="sticky top-14 z-30 bg-[#FAF4F0]/95 backdrop-blur-md pt-2.5 pb-2.5 -mx-4 px-4 border-b border-[#EFE3DB] shadow-xs space-y-2.5">
        {/* Header Title & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#2D151E] flex items-center gap-2">
              <span className="text-[#FF4A70]">⚡</span>
              <span>Link Up</span>
            </h2>
            <p className="text-xs text-[#8A767E] mt-0.5">
              Real-time daily meetups • Auto-expires in 24 hours
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Button */}
            {activeSubTab === 'all' && (
              <button
                type="button"
                id="linkup-filter-button"
                onClick={() => setIsFilterModalOpen(true)}
                className={`py-2 px-3.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  activeFiltersCount > 0
                    ? 'bg-[#FF4A70]/15 border-[#FF4A70]/30 text-[#FF4A70]'
                    : 'bg-white border-[#E5D7CE] text-[#2D151E] hover:border-[#FF4A70]'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#FF4A70] text-white text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}

            {/* Post Button */}
            <button
              id="create-linkup-btn"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition hover:opacity-95 active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Post Link Up</span>
            </button>
          </div>
        </div>

        {/* SUB-NAVIGATION: All Link Ups vs My Link Ups */}
        <div className="flex items-center gap-2 bg-white border border-[#EFE3DB] p-1 rounded-full shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`flex-1 py-2 px-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-[#2D151E] text-white shadow-xs'
                : 'text-[#8A767E] hover:text-[#2D151E]'
            }`}
          >
            <Zap size={14} className={activeSubTab === 'all' ? 'fill-white' : ''} />
            <span>All Link Ups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mine')}
            className={`flex-1 py-2 px-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeSubTab === 'mine'
                ? 'bg-[#2D151E] text-white shadow-xs'
                : 'text-[#8A767E] hover:text-[#2D151E]'
            }`}
          >
            <User size={14} />
            <span>My Link Ups</span>
            {myPostsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'mine'
                  ? 'bg-[#FF4A70] text-white'
                  : 'bg-[#FF4A70]/15 text-[#FF4A70]'
              }`}>
                {myPostsCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Indicators if Town, Gender or Age is set */}
        {activeSubTab === 'all' && activeFiltersCount > 0 && (
          <div className="flex items-center justify-between bg-white border border-[#EFE3DB] px-3.5 py-1.5 rounded-full text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#8A767E] text-[10px]">Filtered:</span>
              {selectedTown !== 'All' && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/25 text-[10px] font-bold flex items-center gap-0.5">
                  <MapPin size={10} />
                  <span>{selectedTown}</span>
                </span>
              )}
              {selectedGender !== 'all' && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/25 text-[10px] font-bold">
                  {selectedGender === 'female' ? '♀ Women' : selectedGender === 'male' ? '♂ Men' : 'Non-binary'}
                </span>
              )}
              {(minAge > 18 || maxAge < 99) && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/25 text-[10px] font-bold">
                  Age: {minAge} - {maxAge === 99 ? '99+' : maxAge}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[10px] text-[#8A767E] hover:text-[#FF4A70] flex items-center gap-1 font-semibold transition cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* ALL LINK UPS VIEW */}
      {activeSubTab === 'all' && (
        <div className="pt-2.5">
          {/* Posts List */}
          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-[#EFE3DB] text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF4F0] text-[#FF4A70] flex items-center justify-center mx-auto border border-[#E5D7CE]">
                  <Zap size={24} />
                </div>
                <h3 className="text-sm font-bold text-[#2D151E]">
                  No Link Ups matching your filters
                </h3>
                <p className="text-xs text-[#8A767E] max-w-xs mx-auto">
                  Try adjusting your town, age, or gender filters, or be the first to post a Link Up!
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="py-2 px-4 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-xs font-semibold text-[#2D151E] border border-[#E5D7CE] transition cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="py-2 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
                  >
                    Create a Link Up
                  </button>
                </div>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isHighlighted = highlightedPostId === post.id;
                const isMyPost = post.userId === currentUser.id;

                return (
                  <div
                    id={`post-${post.id}`}
                    key={post.id}
                    className={`bg-white border rounded-3xl p-4 space-y-3 shadow-sm transition-all duration-300 relative ${
                      isHighlighted 
                        ? 'ring-2 ring-[#FF4A70] border-[#FF4A70] bg-[#FFF9F5]' 
                        : 'border-[#EFE3DB] hover:border-[#E5D7CE]'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {post.isAnonymous ? (
                          <div className="w-10 h-10 rounded-2xl bg-[#FAF4F0] border border-[#E5D7CE] flex items-center justify-center text-[#FF4A70] shrink-0">
                            <EyeOff size={18} />
                          </div>
                        ) : (
                          <img 
                            src={post.userPhoto || currentUser.profilePicture} 
                            alt={post.userDisplayName} 
                            className="w-10 h-10 rounded-2xl object-cover border border-[#FF4A70]/30 shrink-0 shadow-xs"
                          />
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#2D151E] truncate">
                              {post.userDisplayName}
                            </h4>
                            {isMyPost && (
                              <span className="text-[9px] font-bold text-[#FF4A70] bg-[#FF4A70]/10 border border-[#FF4A70]/25 px-1.5 py-0.2 rounded-full">
                                You
                              </span>
                            )}
                            {isHighlighted && (
                              <span className="text-[9px] font-black text-white bg-gradient-to-r from-[#F73B66] to-[#FF874F] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-pulse">
                                <Sparkles size={10} />
                                <span>Just Posted!</span>
                              </span>
                            )}
                          </div>

                          {/* Metadata tags: Gender, Age & Location */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-[#8A767E] bg-[#FAF4F0] px-2 py-0.5 rounded-full border border-[#E5D7CE] flex items-center gap-1">
                              <span>{formatGenderDisplay(post.userGender)}</span>
                            </span>

                            <span className="text-[10px] font-semibold text-[#8A767E] bg-[#FAF4F0] px-2 py-0.5 rounded-full border border-[#E5D7CE]">
                              {post.userAge ? `${post.userAge} yrs` : '24 yrs'}
                            </span>

                            <span className="text-[10px] font-bold text-[#FF4A70] bg-[#FF4A70]/10 px-2 py-0.5 rounded-full border border-[#FF4A70]/20 flex items-center gap-0.5">
                              <MapPin size={10} className="text-[#FF4A70]" />
                              <span>{post.town}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expiration badge */}
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-[#8A767E] bg-[#FAF4F0] px-2.5 py-1 rounded-full border border-[#E5D7CE] shrink-0">
                        <Clock size={11} className="text-[#FF4A70]" />
                        <span>{calculateHoursRemaining(post.expiresAt)}</span>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-[#FAF4F0] p-3.5 rounded-2xl border border-[#EFE3DB]">
                      <p className="text-xs text-[#2D151E] leading-relaxed font-medium">
                        "{post.message}"
                      </p>
                    </div>

                    {/* Footer details & Action */}
                    <div className="flex items-center justify-between pt-0.5 text-xs text-[#8A767E]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-[#8A767E]">
                          Available: <strong className="text-[#2D151E] font-semibold">{post.availability}</strong> ({post.time})
                        </span>
                      </div>

                      {isMyPost ? (
                        <button
                          type="button"
                          onClick={() => setPostToDelete(post)}
                          className="py-1.5 px-3 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          title="Delete My Link Up"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenChatWithUser(post.userId, `Hey! Saw your Link Up in ${post.town}: "${post.message}"`)}
                          className="py-1.5 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-rose-500/20 cursor-pointer"
                        >
                          <MessageSquare size={13} />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MY LINK UPS VIEW */}
      {activeSubTab === 'mine' && (
        <div className="space-y-3">
          {myPosts.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-[#EFE3DB] text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF4F0] text-[#FF4A70] flex items-center justify-center mx-auto border border-[#E5D7CE]">
                <User size={24} />
              </div>
              <h3 className="text-sm font-bold text-[#2D151E]">
                You Haven't Posted Any Link Ups
              </h3>
              <p className="text-xs text-[#8A767E] max-w-xs mx-auto">
                Need someone to grab coffee, hang out tonight, or share drinks in Cameroon? Post a Link Up now!
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
                >
                  Post Your First Link Up
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#8A767E]">
                  Your Posts ({myPosts.length})
                </span>
                <span className="text-[11px] text-[#FF4A70] font-semibold">
                  Auto-expires after 24h
                </span>
              </div>

              {myPosts.map(post => {
                const isExpired = post.status === 'expired' || calculateHoursRemaining(post.expiresAt) === 'Expired';

                return (
                  <div
                    key={post.id}
                    className="bg-white border border-[#EFE3DB] rounded-3xl p-4 space-y-3 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {post.isAnonymous ? (
                          <div className="w-8 h-8 rounded-xl bg-[#FAF4F0] border border-[#E5D7CE] flex items-center justify-center text-[#FF4A70]">
                            <EyeOff size={15} />
                          </div>
                        ) : (
                          <img 
                            src={currentUser.profilePicture} 
                            alt={currentUser.displayName} 
                            className="w-8 h-8 rounded-xl object-cover border border-[#FF4A70]/30 shadow-xs"
                          />
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#2D151E]">
                              {post.isAnonymous ? 'Anonymous Post' : currentUser.displayName}
                            </h4>
                            <span className="text-[9px] font-bold text-[#FF4A70] bg-[#FF4A70]/10 px-1.5 py-0.2 rounded border border-[#FF4A70]/20">
                              You
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8A767E] mt-0.5">
                            <span className="text-[#FF4A70] font-semibold">📍 {post.town}</span>
                            <span>•</span>
                            <span>{post.availability} ({post.time})</span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isExpired 
                          ? 'bg-[#FAF4F0] text-[#8A767E] border-[#E5D7CE]' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {isExpired ? 'Expired' : calculateHoursRemaining(post.expiresAt)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="bg-[#FAF4F0] p-3.5 rounded-2xl border border-[#EFE3DB]">
                      <p className="text-xs text-[#2D151E] leading-relaxed font-medium">
                        "{post.message}"
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#EFE3DB]">
                      <span className="text-[11px] text-[#8A767E]">
                        Posted {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPostToDelete(post)}
                        className="py-1.5 px-3 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete Link Up</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2D151E]">Delete Link Up?</h3>
                <p className="text-[11px] text-[#8A767E]">This post will be permanently removed.</p>
              </div>
            </div>

            <div className="bg-[#FAF4F0] p-3 rounded-2xl border border-[#EFE3DB] text-xs text-[#2D151E] italic">
              "{postToDelete.message}"
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(postToDelete.id)}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED FILTER MODAL (Town, Age, Gender) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FF4A70]/10 text-[#FF4A70] flex items-center justify-center">
                  <SlidersHorizontal size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D151E]">Filter Link Ups</h3>
                  <p className="text-[10px] text-[#8A767E]">Find companions by location, gender & age</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] flex items-center justify-center transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* 1. Town Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#2D151E] flex items-center gap-1">
                <MapPin size={13} className="text-[#FF4A70]" />
                <span>Town / City</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto no-scrollbar p-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedTown('All')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer ${
                    selectedTown === 'All'
                      ? 'bg-[#FF4A70] text-white font-bold shadow-2xs'
                      : 'bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
                  }`}
                >
                  All Towns
                </button>
                {CAMEROON_TOWNS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTown(t)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center truncate cursor-pointer ${
                      selectedTown === t
                        ? 'bg-[#FF4A70] text-white font-bold shadow-2xs'
                        : 'bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Gender Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#2D151E] flex items-center gap-1">
                <User size={13} className="text-[#FF4A70]" />
                <span>Poster Gender</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'female', label: '♀ Women' },
                  { value: 'male', label: '♂ Men' },
                  { value: 'non-binary', label: 'Non-binary' }
                ].map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setSelectedGender(g.value as GenderFilter)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center transition cursor-pointer ${
                      selectedGender === g.value
                        ? 'bg-[#FF4A70] text-white shadow-2xs'
                        : 'bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Age Range Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2D151E]">
                  Age Range: <span className="text-[#FF4A70] font-extrabold">{minAge} - {maxAge === 99 ? '99+' : maxAge} yrs</span>
                </label>
                {(minAge > 18 || maxAge < 99) && (
                  <button
                    type="button"
                    onClick={() => { setMinAge(18); setMaxAge(99); }}
                    className="text-[10px] text-[#8A767E] hover:text-[#FF4A70] cursor-pointer"
                  >
                    Reset Age
                  </button>
                )}
              </div>

              {/* Age Presets */}
              <div className="grid grid-cols-4 gap-1.5 pb-1">
                {[
                  { label: 'All', min: 18, max: 99 },
                  { label: '18 - 25', min: 18, max: 25 },
                  { label: '26 - 35', min: 26, max: 35 },
                  { label: '36+', min: 36, max: 99 }
                ].map(preset => {
                  const isSelected = minAge === preset.min && maxAge === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setMinAge(preset.min);
                        setMaxAge(preset.max);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF4A70]/15 border border-[#FF4A70]/40 text-[#FF4A70]'
                          : 'bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Min & Max Range Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-[#8A767E] block mb-1">Min Age ({minAge})</span>
                  <input
                    type="range"
                    min={18}
                    max={maxAge}
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="w-full accent-[#FF4A70] cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#8A767E] block mb-1">Max Age ({maxAge === 99 ? '99+' : maxAge})</span>
                  <input
                    type="range"
                    min={minAge}
                    max={99}
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="w-full accent-[#FF4A70] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#EFE3DB]">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] font-bold text-xs transition cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-bold text-xs shadow-md shadow-rose-500/20 transition hover:scale-[1.02] cursor-pointer"
              >
                Apply ({filteredPosts.length} matches)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE LINK UP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
              <h3 className="text-sm font-bold text-[#2D151E] flex items-center gap-1.5">
                <Zap size={16} className="text-[#FF4A70]" />
                <span>Post a Daily Link Up</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8A767E] hover:text-[#2D151E] text-xs cursor-pointer font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateLinkUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                  Town / City (Always displayed)
                </label>
                <select
                  value={newPost.town}
                  onChange={(e) => setNewPost({ ...newPost, town: e.target.value as TownLocation })}
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                >
                  {CAMEROON_TOWNS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                    Availability
                  </label>
                  <select
                    value={newPost.availability}
                    onChange={(e) => setNewPost({ ...newPost, availability: e.target.value as any })}
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                  >
                    <option value="Tonight">Tonight</option>
                    <option value="Today">Today</option>
                    <option value="Right Now">Right Now</option>
                    <option value="This Afternoon">This Afternoon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={newPost.time}
                    onChange={(e) => setNewPost({ ...newPost, time: e.target.value })}
                    placeholder="e.g. 7:00 PM"
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={newPost.message}
                  onChange={(e) => setNewPost({ ...newPost, message: e.target.value })}
                  placeholder="I'm free tonight. Anyone wants to hang out for food or drinks?"
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70] resize-none"
                />
              </div>

              {/* Public or Anonymous toggle */}
              <div className="p-3 bg-[#FAF4F0] border border-[#EFE3DB] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#2D151E] flex items-center gap-1.5">
                    {newPost.isAnonymous ? <EyeOff size={13} className="text-[#FF4A70]" /> : <User size={13} className="text-[#8A767E]" />}
                    <span>{newPost.isAnonymous ? 'Post as Anonymous' : 'Post with My Profile'}</span>
                  </div>
                  <p className="text-[10px] text-[#8A767E] mt-0.5">
                    {newPost.isAnonymous 
                      ? `Your name & photo are hidden. Your age (${currentUser.age}) & gender (${formatGenderDisplay(currentUser.gender)}) will be shown.`
                      : 'Your name and photo will appear.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPost({ ...newPost, isAnonymous: !newPost.isAnonymous })}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    newPost.isAnonymous ? 'bg-[#FF4A70]' : 'bg-[#E5D7CE]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    newPost.isAnonymous ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#8A767E] pt-1">
                <Clock size={12} />
                <span>Post automatically expires after 24 hours.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition hover:scale-[1.01] cursor-pointer"
              >
                Publish Link Up
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
