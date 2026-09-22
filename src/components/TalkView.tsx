import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  TalkPost, 
  TalkReply,
  TalkCategory 
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
  LifeBuoy,
  CloudRain,
  Compass,
  Sparkles,
  Smile
} from 'lucide-react';

interface TalkViewProps {
  currentUser: UserProfile;
  initialPostId?: string | null;
  onClearInitialPost?: () => void;
  onOpenPrivateTalkChat: (targetUserId: string, initialMessage?: string) => void;
  onReportContent: (type: 'talk_post', id: string, name: string) => void;
}

type ActiveTalkTab = 'Depressed' | 'Lonely' | 'Need Advice';

export const TalkView: React.FC<TalkViewProps> = ({
  currentUser,
  initialPostId,
  onClearInitialPost,
  onOpenPrivateTalkChat,
  onReportContent
}) => {
  const [activeCategory, setActiveCategory] = useState<ActiveTalkTab>('Depressed');
  const [selectedPost, setSelectedPost] = useState<TalkPost | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isVoiceReplyOpen, setIsVoiceReplyOpen] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  const [newPost, setNewPost] = useState({
    category: 'Depressed' as TalkCategory,
    title: '',
    content: '',
    isAnonymous: true
  });

  const allPosts = storage.getTalkPosts();
  const allReplies = storage.getTalkReplies();

  // Jump to specific post if opened from a notification
  useEffect(() => {
    if (initialPostId) {
      const target = allPosts.find(p => p.id === initialPostId);
      if (target) {
        if (target.category === 'Lonely') {
          setActiveCategory('Lonely');
        } else if (target.category === 'Need Advice') {
          setActiveCategory('Need Advice');
        } else {
          setActiveCategory('Depressed');
        }
        setSelectedPost(target);
      }
      onClearInitialPost?.();
    }
  }, [initialPostId, allPosts, onClearInitialPost]);

  // Filter posts for the selected active page
  const filteredPosts = allPosts.filter(p => {
    if (p.status !== 'active') return false;
    if (activeCategory === 'Depressed') {
      return p.category === 'Depressed' || (p.category as string) === 'Depressed / Lonely';
    }
    if (activeCategory === 'Lonely') {
      return p.category === 'Lonely';
    }
    if (activeCategory === 'Need Advice') {
      return p.category === 'Need Advice';
    }
    return false;
  });

  // Category counts
  const depressedCount = allPosts.filter(p => p.status === 'active' && (p.category === 'Depressed' || (p.category as string) === 'Depressed / Lonely')).length;
  const lonelyCount = allPosts.filter(p => p.status === 'active' && p.category === 'Lonely').length;
  const adviceCount = allPosts.filter(p => p.status === 'active' && p.category === 'Need Advice').length;

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

  const getCategoryTheme = (category: TalkCategory) => {
    switch (category) {
      case 'Depressed':
      case 'Depressed / Lonely':
        return {
          pillBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
          activeTab: 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30',
          gradient: 'from-indigo-500 to-purple-600',
          accentText: 'text-indigo-400'
        };
      case 'Lonely':
        return {
          pillBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          activeTab: 'bg-rose-600 text-white font-black shadow-lg shadow-rose-600/30',
          gradient: 'from-rose-500 to-pink-600',
          accentText: 'text-rose-400'
        };
      case 'Need Advice':
        return {
          pillBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          activeTab: 'bg-amber-500 text-neutral-950 font-black shadow-lg shadow-amber-500/30',
          gradient: 'from-amber-500 to-amber-600',
          accentText: 'text-amber-400'
        };
      default:
        return {
          pillBg: 'bg-neutral-800 border-neutral-700 text-neutral-300',
          activeTab: 'bg-neutral-800 text-white',
          gradient: 'from-neutral-700 to-neutral-800',
          accentText: 'text-neutral-400'
        };
    }
  };

  return (
    <div id="talk-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>Talk Community</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Safe, supportive space for feelings, companionship & advice
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelplineModal(true)}
            title="Helplines & Crisis Support"
            className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs transition active:scale-95"
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
            className={`py-2 px-3.5 rounded-2xl bg-gradient-to-r ${getCategoryTheme(activeCategory).gradient} text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition hover:scale-105 active:scale-95`}
          >
            <Plus size={15} />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* THREE SEPARATE CATEGORY PAGES / TABS: Depressed | Lonely | Need Advice */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl">
        {/* 1. Depressed Page Tab */}
        <button
          type="button"
          id="talk-tab-depressed"
          onClick={() => setActiveCategory('Depressed')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
            activeCategory === 'Depressed'
              ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <div className="flex items-center gap-1">
            <CloudRain size={13} className={activeCategory === 'Depressed' ? 'text-indigo-200' : 'text-indigo-400'} />
            <span className="truncate">Depressed</span>
          </div>
          <span className="text-[10px] opacity-75">
            {depressedCount} posts
          </span>
        </button>

        {/* 2. Lonely Page Tab */}
        <button
          type="button"
          id="talk-tab-lonely"
          onClick={() => setActiveCategory('Lonely')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
            activeCategory === 'Lonely'
              ? 'bg-rose-600/90 text-white shadow-md shadow-rose-600/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <div className="flex items-center gap-1">
            <Compass size={13} className={activeCategory === 'Lonely' ? 'text-rose-200' : 'text-rose-400'} />
            <span className="truncate">Lonely</span>
          </div>
          <span className="text-[10px] opacity-75">
            {lonelyCount} posts
          </span>
        </button>

        {/* 3. Need Advice Page Tab */}
        <button
          type="button"
          id="talk-tab-advice"
          onClick={() => setActiveCategory('Need Advice')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
            activeCategory === 'Need Advice'
              ? 'bg-amber-500 text-neutral-950 font-black shadow-md shadow-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <div className="flex items-center gap-1">
            <HelpCircle size={13} className={activeCategory === 'Need Advice' ? 'text-neutral-950' : 'text-amber-400'} />
            <span className="truncate">Need Advice</span>
          </div>
          <span className="text-[10px] opacity-75">
            {adviceCount} posts
          </span>
        </button>
      </div>

      {/* Page Context Banner */}
      <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
        activeCategory === 'Depressed'
          ? 'bg-indigo-950/30 border-indigo-500/25 text-indigo-200'
          : activeCategory === 'Lonely'
          ? 'bg-rose-950/30 border-rose-500/25 text-rose-200'
          : 'bg-amber-950/30 border-amber-500/25 text-amber-200'
      }`}>
        <div className="mt-0.5">
          {activeCategory === 'Depressed' && <CloudRain size={16} className="text-indigo-400" />}
          {activeCategory === 'Lonely' && <Compass size={16} className="text-rose-400" />}
          {activeCategory === 'Need Advice' && <HelpCircle size={16} className="text-amber-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold block text-white text-[11px]">
            {activeCategory === 'Depressed' && 'Depression & Heavy Emotions Hub'}
            {activeCategory === 'Lonely' && 'Loneliness & Solitude Hub'}
            {activeCategory === 'Need Advice' && 'Community Guidance & Advice Hub'}
          </span>
          <p className="text-[11px] opacity-90 mt-0.5">
            {activeCategory === 'Depressed' && 'A gentle space to release stress, fatigue, or low moods without judgment.'}
            {activeCategory === 'Lonely' && 'For those wanting companionship, quiet evening company, or genuine connection.'}
            {activeCategory === 'Need Advice' && 'Ask life dilemmas, relationship questions, and gather honest peer feedback.'}
          </p>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              activeCategory === 'Depressed'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                : activeCategory === 'Lonely'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {activeCategory === 'Depressed' && <CloudRain size={24} />}
              {activeCategory === 'Lonely' && <Compass size={24} />}
              {activeCategory === 'Need Advice' && <HelpCircle size={24} />}
            </div>
            <h3 className="text-sm font-bold text-white">
              No posts in {activeCategory} yet
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              {activeCategory === 'Depressed' && 'Be the first to share how you are feeling. The community is here to listen.'}
              {activeCategory === 'Lonely' && 'Reach out and break the silence. You might inspire someone else to connect.'}
              {activeCategory === 'Need Advice' && 'Got a situation on your mind? Ask the JudmiSpark community for advice.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setNewPost(prev => ({ ...prev, category: activeCategory }));
                setIsCreateModalOpen(true);
              }}
              className={`py-2 px-4 rounded-xl text-xs font-bold text-white transition bg-gradient-to-r ${getCategoryTheme(activeCategory).gradient} shadow-md`}
            >
              Post in {activeCategory}
            </button>
          </div>
        ) : (
          filteredPosts.map(post => {
            const theme = getCategoryTheme(post.category);
            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-3xl p-4 space-y-3 shadow-xl transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.isAnonymous ? (
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 text-xs shadow-inner">
                        <EyeOff size={14} />
                      </div>
                    ) : (
                      <img 
                        src={post.userPhoto || currentUser.profilePicture} 
                        alt={post.userDisplayName} 
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700 shadow"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white">
                          {post.userDisplayName}
                        </h4>
                        {post.isAnonymous && (
                          <span className="text-[9px] font-bold bg-neutral-800 text-neutral-400 px-1 py-0.2 rounded">
                            Anon
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.pillBg}`}>
                    {post.category === 'Depressed / Lonely' ? 'Depressed' : post.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-100 group-hover:text-neutral-200 transition">
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

                  <span className={`text-[11px] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 ${theme.accentText}`}>
                    <span>View Discussion</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* POST DETAILS & REPLIES MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Talk Discussion</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getCategoryTheme(selectedPost.category).pillBg}`}>
                  {selectedPost.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-800/50"
              >
                Close
              </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300">
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
                            className="w-6 h-6 rounded-full object-cover" 
                          />
                          <span className="text-xs font-bold text-white">{reply.userDisplayName}</span>
                        </div>

                        {reply.userId !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => onOpenPrivateTalkChat(reply.userId, `Saw your thoughtful reply on "${selectedPost.title}"`)}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
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
                        <p className="text-xs text-neutral-300 leading-relaxed pl-8">
                          {reply.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Input Box */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950 space-y-2">
              {isVoiceReplyOpen ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-bold text-white">Record Supportive Voice Note</span>
                    <button
                      type="button"
                      onClick={() => setIsVoiceReplyOpen(false)}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Switch to Text
                    </button>
                  </div>
                  <AudioRecorder 
                    userName={currentUser.displayName}
                    onRecordingComplete={(data) => handleSendReply(data)}
                    onCancel={() => setIsVoiceReplyOpen(false)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVoiceReplyOpen(true)}
                    title="Send Voice Reply"
                    className="p-2.5 rounded-xl bg-neutral-800 text-rose-400 hover:bg-neutral-700 transition"
                  >
                    <Mic size={16} />
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Write a supportive, kind reply..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-neutral-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendReply()}
                    disabled={!replyText.trim()}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white disabled:opacity-40 transition"
                  >
                    <Send size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Create a Talk Post</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Select Section
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Depressed', 'Lonely', 'Need Advice'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewPost({ ...newPost, category: cat })}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold transition text-center ${
                        newPost.category === cat
                          ? cat === 'Depressed'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : cat === 'Lonely'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-amber-500 text-neutral-950 font-black shadow-md shadow-amber-500/30'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
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
                  placeholder={
                    newPost.category === 'Depressed'
                      ? 'e.g. Feeling overwhelmed and exhausted lately'
                      : newPost.category === 'Lonely'
                      ? 'e.g. Spending weekends alone in a new city'
                      : 'e.g. How do you handle setting boundaries in relationships?'
                  }
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
                className={`w-full py-3 rounded-2xl bg-gradient-to-r ${getCategoryTheme(newPost.category).gradient} text-white font-bold text-xs shadow-lg transition hover:scale-[1.02]`}
              >
                Publish to {newPost.category}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HELPLINE & CRISIS SUPPORT MODAL */}
      {showHelplineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
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
