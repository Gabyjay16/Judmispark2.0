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
          pillBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          activeTab: 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs',
          gradient: 'from-[#F73B66] via-[#FF5864] to-[#FF874F]',
          accentText: 'text-[#FF4A70]'
        };
      case 'Lonely':
        return {
          pillBg: 'bg-rose-50 border-rose-200 text-rose-700',
          activeTab: 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs',
          gradient: 'from-[#F73B66] via-[#FF5864] to-[#FF874F]',
          accentText: 'text-[#FF4A70]'
        };
      case 'Need Advice':
        return {
          pillBg: 'bg-amber-50 border-amber-200 text-amber-700',
          activeTab: 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs',
          gradient: 'from-[#F73B66] via-[#FF5864] to-[#FF874F]',
          accentText: 'text-[#FF4A70]'
        };
      default:
        return {
          pillBg: 'bg-[#FAF4F0] border-[#E5D7CE] text-[#8A767E]',
          activeTab: 'bg-[#FAF4F0] text-[#2D151E]',
          gradient: 'from-[#F73B66] via-[#FF5864] to-[#FF874F]',
          accentText: 'text-[#FF4A70]'
        };
    }
  };

  return (
    <div id="talk-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#2D151E] flex items-center gap-2">
            <span>Talk Community</span>
          </h2>
          <p className="text-xs text-[#8A767E] mt-0.5">
            Safe, supportive space for feelings, companionship & advice
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelplineModal(true)}
            title="Helplines & Crisis Support"
            className="p-2 rounded-xl bg-[#FAF4F0] border border-[#E5D7CE] text-[#FF4A70] hover:bg-[#F2E7DF] text-xs transition cursor-pointer"
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
            className="py-2 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* THREE SEPARATE CATEGORY PAGES / TABS: Depressed | Lonely | Need Advice */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F2E7DF] border border-[#E9DDD5] rounded-2xl">
        {/* 1. Depressed Page Tab */}
        <button
          type="button"
          id="talk-tab-depressed"
          onClick={() => setActiveCategory('Depressed')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeCategory === 'Depressed'
              ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs'
              : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <div className="flex items-center gap-1">
            <CloudRain size={13} className={activeCategory === 'Depressed' ? 'text-white' : 'text-[#FF4A70]'} />
            <span className="truncate">Depressed</span>
          </div>
          <span className="text-[10px] opacity-80">
            {depressedCount} posts
          </span>
        </button>

        {/* 2. Lonely Page Tab */}
        <button
          type="button"
          id="talk-tab-lonely"
          onClick={() => setActiveCategory('Lonely')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeCategory === 'Lonely'
              ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs'
              : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <div className="flex items-center gap-1">
            <Compass size={13} className={activeCategory === 'Lonely' ? 'text-white' : 'text-[#FF4A70]'} />
            <span className="truncate">Lonely</span>
          </div>
          <span className="text-[10px] opacity-80">
            {lonelyCount} posts
          </span>
        </button>

        {/* 3. Need Advice Page Tab */}
        <button
          type="button"
          id="talk-tab-advice"
          onClick={() => setActiveCategory('Need Advice')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeCategory === 'Need Advice'
              ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs'
              : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <div className="flex items-center gap-1">
            <HelpCircle size={13} className={activeCategory === 'Need Advice' ? 'text-white' : 'text-[#FF4A70]'} />
            <span className="truncate">Need Advice</span>
          </div>
          <span className="text-[10px] opacity-80">
            {adviceCount} posts
          </span>
        </button>
      </div>

      {/* Page Context Banner */}
      <div className="p-3.5 rounded-2xl border border-[#EFE3DB] bg-white text-xs flex items-start gap-2.5 shadow-2xs">
        <div className="mt-0.5">
          {activeCategory === 'Depressed' && <CloudRain size={16} className="text-[#FF4A70]" />}
          {activeCategory === 'Lonely' && <Compass size={16} className="text-[#FF4A70]" />}
          {activeCategory === 'Need Advice' && <HelpCircle size={16} className="text-[#FF4A70]" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold block text-[#2D151E] text-[11px]">
            {activeCategory === 'Depressed' && 'Depression & Heavy Emotions Hub'}
            {activeCategory === 'Lonely' && 'Loneliness & Solitude Hub'}
            {activeCategory === 'Need Advice' && 'Community Guidance & Advice Hub'}
          </span>
          <p className="text-[11px] text-[#8A767E] mt-0.5">
            {activeCategory === 'Depressed' && 'A gentle space to release stress, fatigue, or low moods without judgment.'}
            {activeCategory === 'Lonely' && 'For those wanting companionship, quiet evening company, or genuine connection.'}
            {activeCategory === 'Need Advice' && 'Ask life dilemmas, relationship questions, and gather honest peer feedback.'}
          </p>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-[#EFE3DB] text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border border-[#E5D7CE] bg-[#FAF4F0] text-[#FF4A70]">
              {activeCategory === 'Depressed' && <CloudRain size={24} />}
              {activeCategory === 'Lonely' && <Compass size={24} />}
              {activeCategory === 'Need Advice' && <HelpCircle size={24} />}
            </div>
            <h3 className="text-sm font-bold text-[#2D151E]">
              No posts in {activeCategory} yet
            </h3>
            <p className="text-xs text-[#8A767E] max-w-xs mx-auto">
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
              className="py-2 px-4 rounded-full text-xs font-bold text-white transition bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] shadow-md shadow-rose-500/20 cursor-pointer"
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
                className="bg-white border border-[#EFE3DB] hover:border-[#E5D7CE] rounded-3xl p-4 space-y-3 shadow-2xs transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.isAnonymous ? (
                      <div className="w-8 h-8 rounded-full bg-[#FAF4F0] border border-[#E5D7CE] flex items-center justify-center text-[#8A767E] text-xs">
                        <EyeOff size={14} />
                      </div>
                    ) : (
                      <img 
                        src={post.userPhoto || currentUser.profilePicture} 
                        alt={post.userDisplayName} 
                        className="w-8 h-8 rounded-full object-cover border border-[#E5D7CE] shadow-2xs"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-[#2D151E]">
                          {post.userDisplayName}
                        </h4>
                        {post.isAnonymous && (
                          <span className="text-[9px] font-bold bg-[#FAF4F0] text-[#8A767E] px-1 py-0.2 rounded border border-[#E5D7CE]">
                            Anon
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8A767E]">
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.pillBg}`}>
                    {post.category === 'Depressed / Lonely' ? 'Depressed' : post.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#2D151E] group-hover:text-[#FF4A70] transition">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#5C454F] line-clamp-3 mt-1 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EFE3DB] text-xs text-[#8A767E]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MessageCircle size={13} /> {post.repliesCount} replies
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Heart size={13} className="text-[#FF4A70]" /> {post.likesCount} support
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-[#FF4A70] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#EFE3DB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2D151E]">Talk Discussion</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getCategoryTheme(selectedPost.category).pillBg}`}>
                  {selectedPost.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-[#8A767E] hover:text-[#2D151E] text-xs px-2.5 py-1 rounded-full border border-[#E5D7CE] bg-[#FAF4F0] cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-[#FAF4F0] p-4 rounded-2xl border border-[#E5D7CE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D151E]">
                    {selectedPost.userDisplayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onReportContent('talk_post', selectedPost.id, selectedPost.title)}
                    className="text-[10px] text-[#8A767E] hover:text-rose-500 transition cursor-pointer"
                  >
                    Report
                  </button>
                </div>
                <h3 className="text-base font-bold text-[#2D151E]">{selectedPost.title}</h3>
                <p className="text-xs text-[#5C454F] leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {/* Replies Header */}
              <div className="text-xs font-bold text-[#8A767E] flex items-center justify-between">
                <span>Community Replies ({postReplies.length})</span>
                <span className="text-[10px] text-[#8A767E]">Tap reply to chat privately</span>
              </div>

              {/* Replies List */}
              <div className="space-y-2.5">
                {postReplies.length === 0 ? (
                  <p className="text-xs text-[#8A767E] text-center py-4">
                    No replies yet. Be the first to offer advice or supportive words.
                  </p>
                ) : (
                  postReplies.map(reply => (
                    <div 
                      key={reply.id} 
                      className="bg-white border border-[#EFE3DB] p-3 rounded-2xl space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={reply.userPhoto || currentUser.profilePicture} 
                            alt={reply.userDisplayName}
                            className="w-6 h-6 rounded-full object-cover border border-[#E5D7CE]" 
                          />
                          <span className="text-xs font-bold text-[#2D151E]">{reply.userDisplayName}</span>
                        </div>

                        {reply.userId !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => onOpenPrivateTalkChat(reply.userId, `Saw your thoughtful reply on "${selectedPost.title}"`)}
                            className="text-[10px] font-bold text-[#FF4A70] hover:opacity-80 flex items-center gap-1 cursor-pointer"
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
                        <p className="text-xs text-[#5C454F] leading-relaxed pl-8">
                          {reply.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Input Box */}
            <div className="p-3 border-t border-[#EFE3DB] bg-[#FAF4F0] space-y-2">
              {isVoiceReplyOpen ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8A767E]">
                    <span className="font-bold text-[#2D151E]">Record Supportive Voice Note</span>
                    <button
                      type="button"
                      onClick={() => setIsVoiceReplyOpen(false)}
                      className="text-xs text-[#8A767E] hover:text-[#2D151E] cursor-pointer"
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
                    className="p-2.5 rounded-full bg-white text-[#FF4A70] border border-[#E5D7CE] hover:bg-[#F2E7DF] transition cursor-pointer"
                  >
                    <Mic size={16} />
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Write a supportive, kind reply..."
                    className="flex-1 bg-white border border-[#E5D7CE] rounded-full px-3.5 py-2 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70] placeholder-[#8A767E]"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendReply()}
                    disabled={!replyText.trim()}
                    className="p-2.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white disabled:opacity-40 transition cursor-pointer shadow-md shadow-rose-500/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
              <h3 className="text-sm font-bold text-[#2D151E] flex items-center gap-1.5">
                <span>Create a Talk Post</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8A767E] hover:text-[#2D151E] text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1.5">
                  Select Section
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Depressed', 'Lonely', 'Need Advice'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewPost({ ...newPost, category: cat })}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold transition text-center cursor-pointer ${
                        newPost.category === cat
                          ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white shadow-sm'
                          : 'bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
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
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                  Share Your Story or Question
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Write freely. JudmiSpark is a supportive community."
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70] resize-none"
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="p-3 bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#2D151E] flex items-center gap-1.5">
                    {newPost.isAnonymous ? <EyeOff size={13} className="text-[#FF4A70]" /> : <User size={13} className="text-[#8A767E]" />}
                    <span>{newPost.isAnonymous ? 'Post Anonymously' : 'Post With My Profile'}</span>
                  </div>
                  <p className="text-[10px] text-[#8A767E] mt-0.5">
                    {newPost.isAnonymous ? 'Your identity is shielded from other users.' : 'Your name and photo will be displayed.'}
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

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Publish to {newPost.category}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HELPLINE & CRISIS SUPPORT MODAL */}
      {showHelplineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
              <div className="flex items-center gap-2 text-[#FF4A70] font-bold text-sm">
                <LifeBuoy size={18} />
                <span>Support & Helpline Resources</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelplineModal(false)}
                className="text-[#8A767E] hover:text-[#2D151E] text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#5C454F] leading-relaxed">
              JudmiSpark is a peer community platform. If you are experiencing severe distress, crisis, or suicidal thoughts, please reach out to trusted professional support:
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl">
                <h4 className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                  <PhoneCall size={12} className="text-emerald-600" />
                  <span>Cameroon Red Cross & Health Line</span>
                </h4>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">Call: 1510 / 119</p>
                <p className="text-[10px] text-[#8A767E]">Toll-free emergency & medical psychological assistance</p>
              </div>

              <div className="p-3 bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl">
                <h4 className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-[#FF4A70]" />
                  <span>Befrienders Worldwide Crisis Helpline</span>
                </h4>
                <p className="text-xs text-[#FF4A70] font-semibold mt-0.5">befrienders.org</p>
                <p className="text-[10px] text-[#8A767E]">Free, confidential emotional support 24/7</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelplineModal(false)}
              className="w-full py-2.5 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] border border-[#E5D7CE] text-[#2D151E] text-xs font-bold transition cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
