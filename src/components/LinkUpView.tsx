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
      <div className="sticky top-14 z-30 bg-neutral-950/95 backdrop-blur-md pt-2.5 pb-2.5 -mx-4 px-4 border-b border-neutral-850 shadow-md space-y-2.5">
        {/* Header Title & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span className="text-amber-400">⚡</span>
              <span>Link Up</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
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
                className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  activeFiltersCount > 0
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-black flex items-center justify-center">
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
              className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Post Link Up</span>
            </button>
          </div>
        </div>

        {/* SUB-NAVIGATION: All Link Ups vs My Link Ups */}
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap size={14} className={activeSubTab === 'all' ? 'fill-neutral-950' : ''} />
            <span>All Link Ups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mine')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeSubTab === 'mine'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>My Link Ups</span>
            {myPostsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'mine'
                  ? 'bg-neutral-950 text-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {myPostsCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Indicators if Town, Gender or Age is set */}
        {activeSubTab === 'all' && activeFiltersCount > 0 && (
          <div className="flex items-center justify-between bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-2xl text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-neutral-400 text-[10px]">Filtered:</span>
              {selectedTown !== 'All' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-0.5">
                  <MapPin size={10} />
                  <span>{selectedTown}</span>
                </span>
              )}
              {selectedGender !== 'all' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  {selectedGender === 'female' ? '♀ Women' : selectedGender === 'male' ? '♂ Men' : 'Non-binary'}
                </span>
              )}
              {(minAge > 18 || maxAge < 99) && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Age: {minAge} - {maxAge === 99 ? '99+' : maxAge}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[10px] text-neutral-400 hover:text-rose-400 flex items-center gap-1 font-semibold transition cursor-pointer"
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
              <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <Zap size={24} />
                </div>
                <h3 className="text-sm font-bold text-white">
                  No Link Ups matching your filters
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Try adjusting your town, age, or gender filters, or be the first to post a Link Up!
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="py-2 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
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
                    className={`bg-neutral-900 border rounded-3xl p-4 space-y-3 shadow-xl transition-all duration-300 relative ${
                      isHighlighted 
                        ? 'ring-2 ring-amber-400 border-amber-400/80 bg-gradient-to-br from-neutral-900 via-amber-950/25 to-neutral-900 shadow-xl shadow-amber-500/20 scale-[1.01]' 
                        : 'border-neutral-800 hover:border-neutral-700/80'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {post.isAnonymous ? (
                          <div className="w-10 h-10 rounded-2xl bg-neutral-800/90 border border-neutral-700/60 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                            <EyeOff size={18} />
                          </div>
                        ) : (
                          <img 
                            src={post.userPhoto || currentUser.profilePicture} 
                            alt={post.userDisplayName} 
                            className="w-10 h-10 rounded-2xl object-cover border border-amber-500/30 shrink-0 shadow-md"
                          />
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">
                              {post.userDisplayName}
                            </h4>
                            {isMyPost && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                                You
                              </span>
                            )}
                            {isHighlighted && (
                              <span className="text-[9px] font-black text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                                <Sparkles size={10} />
                                <span>Just Posted!</span>
                              </span>
                            )}
                          </div>

                          {/* Metadata tags: Gender, Age & Location */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800 flex items-center gap-1">
                              <span>{formatGenderDisplay(post.userGender)}</span>
                            </span>

                            <span className="text-[10px] font-semibold text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800">
                              {post.userAge ? `${post.userAge} yrs` : '24 yrs'}
                            </span>

                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-0.5">
                              <MapPin size={10} className="fill-amber-400/20 text-amber-400" />
                              <span>{post.town}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expiration badge */}
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-full border border-neutral-800 shrink-0">
                        <Clock size={11} className="text-amber-400" />
                        <span>{calculateHoursRemaining(post.expiresAt)}</span>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800/80">
                      <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                        "{post.message}"
                      </p>
                    </div>

                    {/* Footer details & Action */}
                    <div className="flex items-center justify-between pt-0.5 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-neutral-400">
                          Available: <strong className="text-neutral-200 font-semibold">{post.availability}</strong> ({post.time})
                        </span>
                      </div>

                      {isMyPost ? (
                        <button
                          type="button"
                          onClick={() => setPostToDelete(post)}
                          className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          title="Delete My Link Up"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenChatWithUser(post.userId, `Hey! Saw your Link Up in ${post.town}: "${post.message}"`)}
                          className="py-1.5 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
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
            <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <User size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">
                You Haven't Posted Any Link Ups
              </h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Need someone to grab coffee, hang out tonight, or share drinks in Cameroon? Post a Link Up now!
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  Post Your First Link Up
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-neutral-400">
                  Your Posts ({myPosts.length})
                </span>
                <span className="text-[11px] text-amber-400">
                  Auto-expires after 24h
                </span>
              </div>

              {myPosts.map(post => {
                const isExpired = post.status === 'expired' || calculateHoursRemaining(post.expiresAt) === 'Expired';

                return (
                  <div
                    key={post.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 space-y-3 shadow-xl"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {post.isAnonymous ? (
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
                            <EyeOff size={15} />
                          </div>
                        ) : (
                          <img 
                            src={currentUser.profilePicture} 
                            alt={currentUser.displayName} 
                            className="w-8 h-8 rounded-xl object-cover border border-amber-500/30"
                          />
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white">
                              {post.isAnonymous ? 'Anonymous Post' : currentUser.displayName}
                            </h4>
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              You
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                            <span className="text-amber-300 font-semibold">📍 {post.town}</span>
                            <span>•</span>
                            <span>{post.availability} ({post.time})</span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isExpired 
                          ? 'bg-neutral-800 text-neutral-400 border-neutral-700' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isExpired ? 'Expired' : calculateHoursRemaining(post.expiresAt)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800/80">
                      <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                        "{post.message}"
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                      <span className="text-[11px] text-neutral-400">
                        Posted {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPostToDelete(post)}
                        className="py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Link Up?</h3>
                <p className="text-[11px] text-neutral-400">This post will be permanently removed.</p>
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-xs text-neutral-300 italic">
              "{postToDelete.message}"
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(postToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/25 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <SlidersHorizontal size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Filter Link Ups</h3>
                  <p className="text-[10px] text-neutral-400">Find companions by location, gender & age</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* 1. Town Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1">
                <MapPin size={13} className="text-amber-400" />
                <span>Town / City</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto no-scrollbar p-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedTown('All')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center ${
                    selectedTown === 'All'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  All Towns
                </button>
                {CAMEROON_TOWNS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTown(t)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center truncate ${
                      selectedTown === t
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Gender Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1">
                <User size={13} className="text-amber-400" />
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
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center transition ${
                      selectedGender === g.value
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
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
                <label className="text-xs font-bold text-neutral-300">
                  Age Range: <span className="text-amber-400 font-extrabold">{minAge} - {maxAge === 99 ? '99+' : maxAge} yrs</span>
                </label>
                {(minAge > 18 || maxAge < 99) && (
                  <button
                    type="button"
                    onClick={() => { setMinAge(18); setMaxAge(99); }}
                    className="text-[10px] text-neutral-400 hover:text-rose-400"
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
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center transition ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
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
                  <span className="text-[10px] text-neutral-400 block mb-1">Min Age ({minAge})</span>
                  <input
                    type="range"
                    min={18}
                    max={maxAge}
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block mb-1">Max Age ({maxAge === 99 ? '99+' : maxAge})</span>
                  <input
                    type="range"
                    min={minAge}
                    max={99}
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition hover:scale-[1.02]"
              >
                Apply ({filteredPosts.length} matches)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE LINK UP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Zap size={16} className="text-amber-400" />
                <span>Post a Daily Link Up</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateLinkUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Town / City (Always displayed)
                </label>
                <select
                  value={newPost.town}
                  onChange={(e) => setNewPost({ ...newPost, town: e.target.value as TownLocation })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {CAMEROON_TOWNS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Availability
                  </label>
                  <select
                    value={newPost.availability}
                    onChange={(e) => setNewPost({ ...newPost, availability: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Tonight">Tonight</option>
                    <option value="Today">Today</option>
                    <option value="Right Now">Right Now</option>
                    <option value="This Afternoon">This Afternoon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={newPost.time}
                    onChange={(e) => setNewPost({ ...newPost, time: e.target.value })}
                    placeholder="e.g. 7:00 PM"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={newPost.message}
                  onChange={(e) => setNewPost({ ...newPost, message: e.target.value })}
                  placeholder="I'm free tonight. Anyone wants to hang out for food or drinks?"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Public or Anonymous toggle */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {newPost.isAnonymous ? <EyeOff size={13} className="text-amber-400" /> : <User size={13} className="text-neutral-400" />}
                    <span>{newPost.isAnonymous ? 'Post as Anonymous' : 'Post with My Profile'}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {newPost.isAnonymous 
                      ? `Your name & photo are hidden. Your age (${currentUser.age}) & gender (${formatGenderDisplay(currentUser.gender)}) will be shown.`
                      : 'Your name and photo will appear.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPost({ ...newPost, isAnonymous: !newPost.isAnonymous })}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    newPost.isAnonymous ? 'bg-amber-500' : 'bg-neutral-800'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    newPost.isAnonymous ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-neutral-500 pt-1">
                <Clock size={12} />
                <span>Post automatically expires after 24 hours.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition hover:scale-[1.02]"
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
