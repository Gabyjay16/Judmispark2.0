import React, { useState } from 'react';
import { 
  UserProfile, 
  TalkPost, 
  TalkReply 
} from '../types';
import { storage } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import { AudioRecorder } from './AudioRecorder';
import { RecordedAudioData } from '../utils/audio';
import { 
  MessageCircle, 
  Heart, 
  HelpCircle, 
  EyeOff, 
  User, 
  Plus, 
  Send, 
  Mic, 
  ShieldAlert, 
  PhoneCall, 
  Share2, 
  ArrowRight,
  LifeBuoy
} from 'lucide-react';

interface TalkViewProps {
  currentUser: UserProfile;
  onOpenPrivateTalkChat: (targetUserId: string, initialMessage?: string) => void;
  onReportContent: (type: 'talk_post', id: string, name: string) => void;
}

export const TalkView: React.FC<TalkViewProps> = ({
  currentUser,
  onOpenPrivateTalkChat,
  onReportContent
}) => {
  const [activeCategory, setActiveCategory] = useState<'Depressed / Lonely' | 'Need Advice'>('Depressed / Lonely');
  const [selectedPost, setSelectedPost] = useState<TalkPost | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isVoiceReplyOpen, setIsVoiceReplyOpen] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  const [newPost, setNewPost] = useState({
    category: 'Depressed / Lonely' as 'Depressed / Lonely' | 'Need Advice',
    title: '',
    content: '',
    isAnonymous: true
  });

  const allPosts = storage.getTalkPosts();
  const allReplies = storage.getTalkReplies();

  const filteredPosts = allPosts.filter(p => p.status === 'active' && p.category === activeCategory);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    const post: TalkPost = {
      id: `talk_${Date.now()}`,
      userId: currentUser.id,
      userDisplayName: newPost.isAnonymous ? 'Anonymous Spark User' : currentUser.displayName,
      userPhoto: newPost.isAnonymous ? '' : currentUser.profilePicture,
      isAnonymous: newPost.isAnonymous,
      category: newPost.category,
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      likesCount: 1,
      status: 'active'
    };

    storage.setTalkPosts([post, ...allPosts]);
    setIsCreateModalOpen(false);
    setNewPost({
      category: activeCategory,
      title: '',
      content: '',
      isAnonymous: true
    });
  };

  const handleSendReply = (voiceData?: RecordedAudioData) => {
    if (!selectedPost) return;
    if (!voiceData && !replyText.trim()) return;

    const reply: TalkReply = {
      id: `reply_${Date.now()}`,
      talkPostId: selectedPost.id,
      userId: currentUser.id,
      userDisplayName: currentUser.displayName,
      userPhoto: currentUser.profilePicture,
      isAnonymous: false,
      content: replyText.trim() || (voiceData ? '🎙️ Voice note response' : ''),
      voiceUrl: voiceData?.blobUrl,
      voiceDuration: voiceData?.duration,
      createdAt: new Date().toISOString()
    };

    // Update replies and count
    storage.setTalkReplies([...allReplies, reply]);
    const updatedPosts = allPosts.map(p => {
      if (p.id === selectedPost.id) {
        return { ...p, repliesCount: p.repliesCount + 1 };
      }
      return p;
    });
    storage.setTalkPosts(updatedPosts);
    setSelectedPost(prev => prev ? { ...prev, repliesCount: prev.repliesCount + 1 } : null);

    setReplyText('');
    setIsVoiceReplyOpen(false);
  };

  const postReplies = selectedPost 
    ? storage.getTalkReplies().filter(r => r.talkPostId === selectedPost.id) 
    : [];

  return (
    <div id="talk-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>Talk Community</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Safe space for honest emotional sharing & advice
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelplineModal(true)}
            title="Helplines & Crisis Support"
            className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs transition"
          >
            <LifeBuoy size={16} />
          </button>

          <button
            id="create-talk-post-btn"
            type="button"
            onClick={() => {
              setNewPost(prev => ({ ...prev, category: activeCategory }));
              setIsCreateModalOpen(true);
            }}
            className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition hover:scale-105"
          >
            <Plus size={15} />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Category Tabs: Depressed / Lonely vs Need Advice */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveCategory('Depressed / Lonely')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeCategory === 'Depressed / Lonely'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Heart size={13} className={activeCategory === 'Depressed / Lonely' ? 'fill-rose-400/40 text-rose-400' : ''} />
          <span>Depressed / Lonely</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('Need Advice')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeCategory === 'Need Advice'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <HelpCircle size={13} className={activeCategory === 'Need Advice' ? 'text-amber-400' : ''} />
          <span>Need Advice</span>
        </button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.map(post => (
          <div
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-3xl p-4 space-y-3 shadow-xl transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {post.isAnonymous ? (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 text-xs">
                    <EyeOff size={14} />
                  </div>
                ) : (
                  <img 
                    src={post.userPhoto || currentUser.profilePicture} 
                    alt={post.userDisplayName} 
                    className="w-8 h-8 rounded-full object-cover border border-rose-500/40"
                  />
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {post.userDisplayName}
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                post.category === 'Depressed / Lonely'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                {post.category}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-neutral-100 group-hover:text-rose-300 transition">
                {post.title}
              </h3>
              <p className="text-xs text-neutral-300 line-clamp-3 mt-1 leading-relaxed">
                {post.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px]">
                  <MessageCircle size={13} /> {post.repliesCount} replies
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Heart size={13} className="text-rose-400" /> {post.likesCount} support
                </span>
              </div>

              <span className="text-[11px] text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>View Discussion</span>
                <ArrowRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* POST DETAILS & REPLIES MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Talk Discussion</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                  {selectedPost.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg border border-neutral-800"
              >
                Close
              </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400">
                    {selectedPost.userDisplayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onReportContent('talk_post', selectedPost.id, selectedPost.title)}
                    className="text-[10px] text-neutral-500 hover:text-amber-400 transition"
                  >
                    Report
                  </button>
                </div>
                <h3 className="text-base font-bold text-white">{selectedPost.title}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {/* Replies Header */}
              <div className="text-xs font-bold text-neutral-400 flex items-center justify-between">
                <span>Community Replies ({postReplies.length})</span>
                <span className="text-[10px] text-neutral-500">Tap reply to chat privately</span>
              </div>

              {/* Replies List */}
              <div className="space-y-2.5">
                {postReplies.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-4">
                    No replies yet. Be the first to offer advice or supportive words.
                  </p>
                ) : (
                  postReplies.map(reply => (
                    <div 
                      key={reply.id} 
                      className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl space-y-2 hover:border-neutral-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={reply.userPhoto || currentUser.profilePicture} 
                            alt={reply.userDisplayName} 
                            className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                          />
                          <span className="text-xs font-semibold text-neutral-200">
                            {reply.userDisplayName}
                          </span>
                        </div>

                        {reply.userId !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => onOpenPrivateTalkChat(reply.userId, `Saw your reply on Talk: "${reply.content}"`)}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1 transition"
                          >
                            <span>Chat Privately</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>

                      {reply.voiceUrl ? (
                        <AudioPlayer
                          audioUrl={reply.voiceUrl}
                          duration={reply.voiceDuration || 4}
                          userName={reply.userDisplayName}
                          seed={reply.id}
                        />
                      ) : (
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {reply.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Input Strip */}
            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVoiceReplyOpen(true)}
                title="Send Voice Reply"
                className="w-10 h-10 rounded-2xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 border border-neutral-800 flex items-center justify-center shrink-0 transition"
              >
                <Mic size={16} />
              </button>

              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a supportive reply..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl py-2 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />

              <button
                type="button"
                disabled={!replyText.trim()}
                onClick={() => handleSendReply()}
                className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOICE REPLY RECORDER */}
      {isVoiceReplyOpen && selectedPost && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <AudioRecorder
            isRegistration={false}
            userName={currentUser.displayName}
            onRecordingComplete={(voiceData) => handleSendReply(voiceData)}
            onCancel={() => setIsVoiceReplyOpen(false)}
            title="Record Voice Reply"
            description="Share your voice advice and comforting words with this person."
          />
        </div>
      )}

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white">Create Talk Post</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Category
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value as any })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Depressed / Lonely">Depressed / Lonely</option>
                  <option value="Need Advice">Need Advice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="e.g. Dealing with burnout in a new city"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Share Your Story or Question
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Write freely. JudmiSpark is a supportive community."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {newPost.isAnonymous ? <EyeOff size={13} className="text-rose-400" /> : <User size={13} className="text-neutral-400" />}
                    <span>{newPost.isAnonymous ? 'Post Anonymously' : 'Post With My Profile'}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {newPost.isAnonymous ? 'Your identity is shielded from other users.' : 'Your name and photo will be displayed.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPost({ ...newPost, isAnonymous: !newPost.isAnonymous })}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    newPost.isAnonymous ? 'bg-rose-500' : 'bg-neutral-800'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    newPost.isAnonymous ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition hover:scale-[1.02]"
              >
                Publish to Talk
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HELPLINE & CRISIS SUPPORT MODAL (Spec #57 Safety) */}
      {showHelplineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <LifeBuoy size={18} />
                <span>Support & Helpline Resources</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelplineModal(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              JudmiSpark is a peer community platform. If you are experiencing severe distress, crisis, or suicidal thoughts, please reach out to trusted professional support:
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PhoneCall size={12} className="text-emerald-400" />
                  <span>Cameroon Red Cross & Health Line</span>
                </h4>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">Call: 1510 / 119</p>
                <p className="text-[10px] text-neutral-400">Toll-free emergency & medical psychological assistance</p>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-blue-400" />
                  <span>Befrienders Worldwide Crisis Helpline</span>
                </h4>
                <p className="text-xs text-blue-400 font-semibold mt-0.5">befrienders.org</p>
                <p className="text-[10px] text-neutral-400">Free, confidential emotional support 24/7</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelplineModal(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-semibold hover:bg-neutral-700 transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
