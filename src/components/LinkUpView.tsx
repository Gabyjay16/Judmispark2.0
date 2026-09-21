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
  Share2,
  AlertCircle
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
  'Bafoussam'
];

export const LinkUpView: React.FC<LinkUpViewProps> = ({
  currentUser,
  onOpenChatWithUser
}) => {
  const [selectedTown, setSelectedTown] = useState<TownLocation | 'All'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    town: currentUser.town,
    availability: 'Tonight' as const,
    time: '7:30 PM',
    message: '',
    isAnonymous: false
  });

  const allPosts = storage.getLinkUps();

  // Filter posts
  const filteredPosts = allPosts.filter(p => {
    if (p.status === 'expired') return false;
    if (selectedTown !== 'All' && p.town !== selectedTown) return false;
    return true;
  });

  const handleCreateLinkUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.message.trim()) return;

    const created = new Date();
    const expires = new Date(created.getTime() + 24 * 3600 * 1000); // 24 hours exact

    const post: LinkUpPost = {
      id: `link_${Date.now()}`,
      userId: currentUser.id,
      userDisplayName: newPost.isAnonymous ? 'Anonymous Spark User' : currentUser.displayName,
      userPhoto: newPost.isAnonymous ? '' : currentUser.profilePicture,
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
  };

  const calculateHoursRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  return (
    <div id="linkup-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-24">
      {/* Header */}
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

        <button
          id="create-linkup-btn"
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition hover:scale-105"
        >
          <Plus size={15} />
          <span>Post Link Up</span>
        </button>
      </div>

      {/* Town filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {(['All', 'Bamenda', 'Douala', 'Yaoundé', 'Buea', 'Limbe'] as const).map(town => (
          <button
            key={town}
            type="button"
            onClick={() => setSelectedTown(town)}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
              selectedTown === town
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm shadow-amber-500/30'
                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700/50'
            }`}
          >
            {town === 'All' ? 'All Towns' : `📍 ${town}`}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Zap size={24} />
            </div>
            <h3 className="text-sm font-bold text-white">
              No Link Ups in this location right now
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Be the first to post a Link Up! Let people know you're free to hang out today or tonight.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition"
            >
              Create a Link Up
            </button>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-3xl p-4 space-y-3 shadow-xl transition"
            >
              {/* Header: Town is always prominent, even if anonymous! */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {post.isAnonymous ? (
                    <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 shrink-0">
                      <EyeOff size={16} />
                    </div>
                  ) : (
                    <img 
                      src={post.userPhoto || currentUser.profilePicture} 
                      alt={post.userDisplayName} 
                      className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shrink-0"
                    />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate">
                        {post.userDisplayName}
                      </h4>
                      {post.isAnonymous && (
                        <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.2 rounded">
                          Anonymous
                        </span>
                      )}
                    </div>

                    {/* Prominent Location Tag (Never hidden!) */}
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                      <MapPin size={11} className="fill-amber-400/20" />
                      <span>{post.town.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Expiration badge */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 bg-neutral-950 px-2 py-1 rounded-full border border-neutral-800">
                  <Clock size={11} className="text-amber-400" />
                  <span>{calculateHoursRemaining(post.expiresAt)}</span>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs text-neutral-200 leading-relaxed font-medium bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800/80">
                "{post.message}"
              </p>

              {/* Footer details & Action */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-neutral-300">
                    Available: {post.availability} ({post.time})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenChatWithUser(post.userId, `Hey! Saw your Link Up in ${post.town}: "${post.message}"`)}
                  className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <MessageSquare size={13} />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
                    {newPost.isAnonymous ? 'Your name is hidden, but your town stays visible.' : 'Your name and photo will appear.'}
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
