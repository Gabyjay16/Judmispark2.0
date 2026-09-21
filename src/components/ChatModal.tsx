import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  MatchConversation, 
  ChatMessage, 
  ModerationReport 
} from '../types';
import { storage } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import { AudioRecorder } from './AudioRecorder';
import { RecordedAudioData } from '../utils/audio';
import { 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Flag, 
  X, 
  Sparkles, 
  Check, 
  CheckCheck,
  AlertTriangle,
  Gift
} from 'lucide-react';

interface ChatModalProps {
  currentUser: UserProfile;
  conversation: MatchConversation;
  otherUser: UserProfile;
  onClose: () => void;
  onGiftSpark: (recipient: UserProfile) => void;
  onReportVoiceIdentity: (conversation: MatchConversation, otherUser: UserProfile) => void;
  onRefresh: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  currentUser,
  conversation,
  otherUser,
  onClose,
  onGiftSpark,
  onReportVoiceIdentity,
  onRefresh
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [revealRequested, setRevealRequested] = useState(false);
  const [currentConv, setCurrentConv] = useState<MatchConversation>(conversation);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = () => {
    const all = storage.getMessages();
    const convMessages = all.filter(m => m.conversationId === conversation.id);
    setMessages(convMessages);

    // Refresh conversation data
    const matches = storage.getMatches();
    const updated = matches.find(m => m.id === conversation.id);
    if (updated) {
      setCurrentConv(updated);
    }
  };

  // Check 5-message voice restriction rule:
  // Before sending 6th message (i.e. if user has sent 5 messages already), check if both users have sent voice notes!
  const myMessageCount = currentConv.userMessageCounts[currentUser.id] || 0;
  const myHasSentVoice = currentConv.userHasSentVoiceNote[currentUser.id] || false;
  const otherHasSentVoice = currentConv.userHasSentVoiceNote[otherUser.id] || false;
  const isBothVoiceCompleted = myHasSentVoice && otherHasSentVoice;

  // Is conversation locked for me from sending text?
  const isLockedForMe = myMessageCount >= 5 && !isBothVoiceCompleted;
  const messagesRemaining = Math.max(0, 5 - myMessageCount);

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (isLockedForMe) {
      alert('Conversation Locked: Both users must send a voice note before continuing.');
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: currentConv.id,
      senderId: currentUser.id,
      receiverId: otherUser.id,
      text: inputText.trim(),
      isVoiceNote: false,
      createdAt: new Date().toISOString(),
      read: false
    };

    // Update conversation record
    const allMatches = storage.getMatches();
    const updatedMatches = allMatches.map(m => {
      if (m.id === currentConv.id) {
        const counts = { ...m.userMessageCounts };
        counts[currentUser.id] = (counts[currentUser.id] || 0) + 1;

        return {
          ...m,
          lastMessageAt: newMsg.createdAt,
          lastMessageText: newMsg.text || '',
          lastMessageSenderId: currentUser.id,
          userMessageCounts: counts
        };
      }
      return m;
    });

    storage.setMessages([...storage.getMessages(), newMsg]);
    storage.setMatches(updatedMatches);
    setInputText('');
    loadMessages();
    onRefresh();
  };

  const handleSendVoiceNote = (voiceData: RecordedAudioData) => {
    const newMsg: ChatMessage = {
      id: `msg_voice_${Date.now()}`,
      conversationId: currentConv.id,
      senderId: currentUser.id,
      receiverId: otherUser.id,
      voiceUrl: voiceData.blobUrl,
      voiceDuration: voiceData.duration,
      isVoiceNote: true,
      createdAt: new Date().toISOString(),
      read: false
    };

    // Update conversation record with voice flag
    const allMatches = storage.getMatches();
    const updatedMatches = allMatches.map(m => {
      if (m.id === currentConv.id) {
        const counts = { ...m.userMessageCounts };
        counts[currentUser.id] = (counts[currentUser.id] || 0) + 1;

        const voiceNotes = { ...m.userHasSentVoiceNote, [currentUser.id]: true };
        const bothVerified = voiceNotes[currentUser.id] && voiceNotes[otherUser.id];

        return {
          ...m,
          lastMessageAt: newMsg.createdAt,
          lastMessageText: '🎙️ Voice note',
          lastMessageSenderId: currentUser.id,
          userMessageCounts: counts,
          userHasSentVoiceNote: voiceNotes,
          isVoiceVerified: bothVerified
        };
      }
      return m;
    });

    storage.setMessages([...storage.getMessages(), newMsg]);
    storage.setMatches(updatedMatches);
    setIsRecordingModalOpen(false);
    loadMessages();
    onRefresh();

    // Notify other user
    storage.addNotification({
      id: `notif_${Date.now()}`,
      userId: otherUser.id,
      title: `Voice Note from ${currentUser.displayName}`,
      message: 'Listen to the voice note in your match chat.',
      type: 'message',
      relatedId: currentConv.id,
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  const handleRevealIdentity = () => {
    // Request identity reveal
    setRevealRequested(true);
    const allMatches = storage.getMatches();
    const updatedMatches = allMatches.map(m => {
      if (m.id === currentConv.id) {
        return {
          ...m,
          identityRevealRequestedBy: currentUser.id,
          isIdentityRevealed: {
            ...m.isIdentityRevealed,
            [currentUser.id]: true
          }
        };
      }
      return m;
    });
    storage.setMatches(updatedMatches);
    setCurrentConv(prev => ({
      ...prev,
      identityRevealRequestedBy: currentUser.id,
      isIdentityRevealed: { ...prev.isIdentityRevealed, [currentUser.id]: true }
    }));
  };

  const handleAcceptIdentityReveal = () => {
    const allMatches = storage.getMatches();
    const updatedMatches = allMatches.map(m => {
      if (m.id === currentConv.id) {
        return {
          ...m,
          isIdentityRevealed: {
            [currentUser.id]: true,
            [otherUser.id]: true
          }
        };
      }
      return m;
    });
    storage.setMatches(updatedMatches);
    loadMessages();
  };

  const isOtherRevealed = currentConv.isIdentityRevealed[otherUser.id];
  const isMyIdentityRevealed = currentConv.isIdentityRevealed[currentUser.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div 
        id="chat-modal-container"
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* CHAT HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-800 bg-neutral-900/95 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img 
                src={otherUser.profilePicture} 
                alt={otherUser.displayName} 
                className="w-11 h-11 rounded-full object-cover border border-rose-500/40"
              />
              {isBothVoiceCompleted && (
                <span title="Voice Verified Match" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white truncate">
                  {otherUser.displayName}
                </h3>
                <span className="text-[11px] text-neutral-400">
                  • {otherUser.town}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                {isBothVoiceCompleted ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={11} /> Voice Verified
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <Mic size={11} /> Voice exchange required
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onGiftSpark(otherUser)}
              title="Gift Spark"
              className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Gift size={15} />
              <span className="hidden sm:inline">Gift</span>
            </button>

            <button
              type="button"
              onClick={() => onReportVoiceIdentity(currentConv, otherUser)}
              title="Report Voice Identity"
              className="p-2 rounded-xl text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 border border-neutral-800 text-xs flex items-center gap-1 transition"
            >
              <Flag size={15} />
              <span className="hidden sm:inline">Report Voice</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 5-MESSAGE WARNING & VOICE REQUIREMENT BANNER */}
        {!isBothVoiceCompleted && (
          <div className={`p-2.5 text-xs border-b flex items-center justify-between gap-2 shrink-0 ${
            isLockedForMe 
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
              : messagesRemaining <= 3
              ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
              : 'bg-neutral-900 border-neutral-800 text-neutral-300'
          }`}>
            <div className="flex items-center gap-2">
              {isLockedForMe ? (
                <Lock size={14} className="text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              )}
              <span>
                {isLockedForMe ? (
                  <strong>Conversation Locked:</strong>
                ) : (
                  <strong>Voice Note Rule:</strong>
                )}{' '}
                {isLockedForMe 
                  ? 'Both users must send a voice note before this conversation can continue.' 
                  : `${messagesRemaining} message${messagesRemaining === 1 ? '' : 's'} remaining before voice verification requirement.`
                }
              </span>
            </div>

            {!myHasSentVoice && (
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] shrink-0 transition"
              >
                Send Voice Note
              </button>
            )}
          </div>
        )}

        {/* IDENTITY REVEAL PROMPT IF REQUESTED */}
        {currentConv.identityRevealRequestedBy === otherUser.id && !isMyIdentityRevealed && (
          <div className="p-2.5 bg-neutral-950 border-b border-rose-500/20 flex items-center justify-between text-xs text-neutral-200">
            <span className="flex items-center gap-1.5 text-rose-300">
              <Eye size={13} />
              {otherUser.displayName} wants to reveal their full profile identity.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptIdentityReveal}
                className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-semibold"
              >
                Accept
              </button>
            </div>
          </div>
        )}

        {/* MESSAGES LIST */}
        <div id="chat-messages-scroll" className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950/60">
          {/* Permanent Introduction info card */}
          <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl max-w-sm mx-auto text-center my-2">
            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
              Verified Introduction
            </div>
            <p className="text-xs text-neutral-300 mb-2">
              Listen to {otherUser.displayName}'s permanent registration voice:
            </p>
            <AudioPlayer
              audioUrl={otherUser.registrationVoiceUrl}
              duration={otherUser.registrationVoiceDuration || 4}
              userName={otherUser.displayName}
              isRegistrationVoice={true}
              seed={otherUser.id}
            />
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-rose-600 text-white rounded-tr-sm shadow-md shadow-rose-600/20' 
                      : 'bg-neutral-800 text-neutral-100 rounded-tl-sm border border-neutral-700/60'
                  }`}
                >
                  {msg.isVoiceNote ? (
                    <div className="min-w-[200px]">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1 opacity-90">
                        <Mic size={12} />
                        <span>Voice Note ({msg.voiceDuration || 4}s)</span>
                      </div>
                      <AudioPlayer
                        audioUrl={msg.voiceUrl}
                        duration={msg.voiceDuration || 4}
                        userName={isMe ? 'You' : otherUser.displayName}
                        seed={msg.id}
                        compact={false}
                      />
                    </div>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-1 px-1">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span>
                      {msg.read ? <CheckCheck size={11} className="text-rose-400" /> : <Check size={11} />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* IDENTITY REVEAL ACTION STRIP */}
        <div className="px-4 py-1.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          {!isMyIdentityRevealed ? (
            <button
              type="button"
              onClick={handleRevealIdentity}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Eye size={12} />
              <span>Reveal Myself</span>
            </button>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Your Identity Revealed
            </span>
          )}

          <span className="text-neutral-500">
            Messages sent: {myMessageCount}/5 before voice check
          </span>
        </div>

        {/* INPUT STRIP */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 shrink-0">
          {isLockedForMe ? (
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-center space-y-2">
              <p className="text-xs font-semibold text-rose-300">
                Text messaging locked. Exchange voice notes to continue!
              </p>
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(true)}
                className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 mx-auto shadow-lg shadow-rose-500/25 transition"
              >
                <Mic size={14} />
                <span>Record & Send Voice Note</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(true)}
                title="Send Voice Note"
                className="w-10 h-10 rounded-2xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 border border-neutral-700/60 flex items-center justify-center shrink-0 transition"
              >
                <Mic size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl py-2.5 px-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500 text-white flex items-center justify-center shrink-0 transition shadow-md shadow-rose-500/20"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>

        {/* VOICE RECORDER MODAL */}
        {isRecordingModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <AudioRecorder
              isRegistration={false}
              userName={currentUser.displayName}
              onRecordingComplete={handleSendVoiceNote}
              onCancel={() => setIsRecordingModalOpen(false)}
              title="Record Voice Note"
              description={`Send a voice note to ${otherUser.displayName} to unlock unlimited chatting.`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

function CheckCircle2({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
