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
  Camera,
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
  Gift,
  Maximize2
} from 'lucide-react';

interface ChatModalProps {
  currentUser: UserProfile;
  conversation: MatchConversation;
  otherUser: UserProfile;
  onClose: () => void;
  onOpenProfile?: (user: UserProfile) => void;
  onGiftSpark: (recipient: UserProfile) => void;
  onReportVoiceIdentity: (conversation: MatchConversation, otherUser: UserProfile) => void;
  onRefresh: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  currentUser,
  conversation,
  otherUser,
  onClose,
  onOpenProfile,
  onGiftSpark,
  onReportVoiceIdentity,
  onRefresh
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [showPhotoPickerModal, setShowPhotoPickerModal] = useState(false);
  const [currentConv, setCurrentConv] = useState<MatchConversation>(conversation);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedPhotoUrl) return;

    if (isLockedForMe) {
      alert('Conversation Locked: Both users must send a voice note before continuing.');
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: currentConv.id,
      senderId: currentUser.id,
      receiverId: otherUser.id,
      text: inputText.trim() || undefined,
      imageUrl: selectedPhotoUrl || undefined,
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
          lastMessageText: newMsg.imageUrl ? (newMsg.text ? `📷 ${newMsg.text}` : '📷 Photo') : (newMsg.text || ''),
          lastMessageSenderId: currentUser.id,
          userMessageCounts: counts
        };
      }
      return m;
    });

    storage.setMessages([...storage.getMessages(), newMsg]);
    storage.setMatches(updatedMatches);
    setInputText('');
    setSelectedPhotoUrl(null);
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

  const SAMPLE_PHOTO_PRESETS = [
    { title: 'Sunset Vibes', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80' },
    { title: 'Coffee Chill', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80' },
    { title: 'Music Mood', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' },
    { title: 'Nature Hangout', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md">
      <div 
        id="chat-modal-container"
        className="bg-white border border-[#EFE3DB] rounded-3xl w-full max-w-lg h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Hidden Native File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange} 
        />

        {/* CHAT HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-[#EFE3DB] bg-white flex items-center justify-between gap-3 shrink-0">
          <div 
            onClick={() => onOpenProfile && onOpenProfile(otherUser)}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
          >
            <div className="relative shrink-0">
              <img 
                src={otherUser.profilePicture} 
                alt={otherUser.displayName} 
                className="w-11 h-11 rounded-full object-cover border-2 border-[#FF4A70] group-hover:opacity-90 transition"
              />
              {isBothVoiceCompleted && (
                <span title="Voice Verified Match" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#2D151E] truncate group-hover:text-[#FF4A70] transition">
                  {otherUser.displayName}
                </h3>
                <span className="text-[11px] text-[#8A767E]">
                  {otherUser.age ? `${otherUser.age} • ` : ''}{otherUser.town}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                {isBothVoiceCompleted ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <ShieldCheck size={11} /> Voice Verified
                  </span>
                ) : (
                  <span className="text-[#FF4A70] flex items-center gap-1 font-medium">
                    <Mic size={11} /> Voice exchange required
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => onOpenProfile(otherUser)}
                title="View Full Profile"
                className="p-2 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] border border-[#E5D7CE] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Eye size={14} />
                <span className="hidden sm:inline">Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onGiftSpark(otherUser)}
              title="Gift Spark"
              className="p-2 rounded-full bg-[#FAF4F0] text-[#FF4A70] border border-[#E5D7CE] hover:bg-[#F2E7DF] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Gift size={14} />
              <span className="hidden sm:inline">Gift</span>
            </button>

            <button
              type="button"
              onClick={() => onReportVoiceIdentity(currentConv, otherUser)}
              title="Report Voice Identity"
              className="p-2 rounded-full text-[#8A767E] hover:text-[#2D151E] hover:bg-[#FAF4F0] border border-[#E5D7CE] text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Flag size={14} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full text-[#8A767E] hover:text-[#2D151E] hover:bg-[#FAF4F0] flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 5-MESSAGE WARNING & VOICE REQUIREMENT BANNER */}
        {!isBothVoiceCompleted && (
          <div className={`p-2.5 text-xs border-b flex items-center justify-between gap-2 shrink-0 ${
            isLockedForMe 
              ? 'bg-rose-50 border-rose-200 text-rose-700' 
              : messagesRemaining <= 3
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-[#FAF4F0] border-[#EFE3DB] text-[#2D151E]'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {isLockedForMe ? (
                <Lock size={14} className="text-rose-500 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              )}
              <span className="truncate">
                {isLockedForMe ? (
                  <strong>Conversation Locked:</strong>
                ) : (
                  <strong>Voice Note Rule:</strong>
                )}{' '}
                {isLockedForMe 
                  ? 'Both users must send a voice note to unlock unlimited chat.' 
                  : `${messagesRemaining} message${messagesRemaining === 1 ? '' : 's'} left before voice check.`
                }
              </span>
            </div>

            {!myHasSentVoice && (
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(true)}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-bold text-[11px] shrink-0 transition cursor-pointer shadow-xs"
              >
                Send Voice Note
              </button>
            )}
          </div>
        )}

        {/* MESSAGES & PERMANENTLY OPEN USER PROFILE FEED */}
        <div id="chat-messages-scroll" className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF4F0]">
          {/* PERMANENT OPEN USER PROFILE CARD (CANNOT BE CLOSED) */}
          <div 
            id="chat-open-profile-card"
            className="p-4 bg-white border border-[#EFE3DB] rounded-3xl max-w-sm mx-auto shadow-2xs space-y-3"
          >
            {/* User Header */}
            <div className="flex items-center gap-3">
              <img 
                src={otherUser.profilePicture} 
                alt={otherUser.displayName} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FF4A70] shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-black text-[#2D151E] truncate">
                    {otherUser.displayName}
                  </h4>
                  <span className="text-xs text-[#8A767E] font-semibold">
                    {otherUser.age ? `${otherUser.age} yrs` : ''}
                  </span>
                  {otherUser.isVerified && (
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#8A767E] mt-0.5">
                  <span className="truncate">{otherUser.town}</span>
                  {otherUser.neighborhood && <span>• {otherUser.neighborhood}</span>}
                </div>
                {otherUser.relationshipIntention && (
                  <span className="inline-block mt-1 text-[10px] font-bold bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/20 px-2 py-0.5 rounded-full">
                    Looking for: {otherUser.relationshipIntention}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {otherUser.bio && (
              <p className="text-xs text-[#5C454F] leading-relaxed bg-[#FAF4F0] p-2.5 rounded-2xl border border-[#E5D7CE]">
                {otherUser.bio}
              </p>
            )}

            {/* Interests Chips */}
            {otherUser.interests && otherUser.interests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {otherUser.interests.map(interest => (
                  <span 
                    key={interest}
                    className="text-[10px] font-medium bg-[#FAF4F0] text-[#8A767E] px-2.5 py-0.5 rounded-full border border-[#E5D7CE]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Conversation Messages */}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-2.5 text-xs leading-relaxed space-y-1.5 ${
                    isMe 
                      ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white rounded-tr-xs shadow-xs' 
                      : 'bg-white text-[#2D151E] rounded-tl-xs border border-[#EFE3DB] shadow-2xs'
                  }`}
                >
                  {/* Photo attachment in message */}
                  {msg.imageUrl && (
                    <div 
                      className="relative overflow-hidden rounded-xl cursor-pointer group/img max-w-xs"
                      onClick={() => setPreviewLightboxUrl(msg.imageUrl || null)}
                    >
                      <img 
                        src={msg.imageUrl} 
                        alt="Shared in chat" 
                        className="w-full max-h-60 object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-102"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 rounded-full bg-black/60 text-white shadow-md">
                          <Maximize2 size={16} />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Voice Note */}
                  {msg.isVoiceNote && (
                    <div className="min-w-[200px] p-1">
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
                  )}

                  {/* Text */}
                  {msg.text && (
                    <p className={`px-1 ${msg.imageUrl ? 'pt-1 font-medium' : ''}`}>
                      {msg.text}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-[#8A767E] mt-1 px-1">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <span>
                      {msg.read ? <CheckCheck size={11} className="text-[#FF4A70]" /> : <Check size={11} />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* SELECTED PHOTO PREVIEW STRIP (BEFORE SENDING) */}
        {selectedPhotoUrl && (
          <div className="px-3.5 py-2 bg-[#FAF4F0] border-t border-[#EFE3DB] flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#FF4A70] shrink-0">
                <img 
                  src={selectedPhotoUrl} 
                  alt="Selected upload" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2D151E]">Photo ready to send</p>
                <p className="text-[10px] text-[#8A767E] truncate">Add an optional message below</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPhotoUrl(null)}
              className="p-1.5 rounded-full bg-white hover:bg-[#F2E7DF] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE] transition cursor-pointer"
              title="Remove photo"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* INPUT STRIP */}
        <div className="p-3 bg-white border-t border-[#EFE3DB] shrink-0">
          {isLockedForMe ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
              <p className="text-xs font-semibold text-rose-700">
                Messaging locked. Exchange voice notes to continue!
              </p>
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(true)}
                className="py-2.5 px-5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 mx-auto shadow-md shadow-rose-500/25 transition cursor-pointer"
              >
                <Mic size={14} />
                <span>Record & Send Voice Note</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendTextMessage} className="flex items-center gap-1.5 sm:gap-2">
              {/* Photo upload button */}
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                title="Attach photo from device"
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition border cursor-pointer ${
                  selectedPhotoUrl 
                    ? 'bg-[#FF4A70] text-white border-[#FF4A70]' 
                    : 'bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] border-[#E5D7CE]'
                }`}
              >
                <ImageIcon size={18} />
              </button>

              {/* Sample Photo Pick Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowPhotoPickerModal(true)}
                title="Photo ideas & camera"
                className="w-10 h-10 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] border border-[#E5D7CE] hidden sm:flex items-center justify-center shrink-0 transition cursor-pointer"
              >
                <Camera size={17} />
              </button>

              {/* Voice note button */}
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(true)}
                title="Send Voice Note"
                className="w-10 h-10 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#FF4A70] border border-[#E5D7CE] flex items-center justify-center shrink-0 transition cursor-pointer"
              >
                <Mic size={18} />
              </button>

              {/* Text input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={selectedPhotoUrl ? "Add a caption for your photo..." : "Type a message..."}
                className="flex-1 bg-[#FAF4F0] border border-[#E5D7CE] rounded-full py-2.5 px-4 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
              />

              {/* Submit / Send button */}
              <button
                type="submit"
                disabled={!inputText.trim() && !selectedPhotoUrl}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition shadow-md shadow-rose-500/20 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>

        {/* PHOTO PICKER / PRESET MODAL */}
        {showPhotoPickerModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-white border border-[#EFE3DB] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
                <h3 className="text-sm font-bold text-[#2D151E] flex items-center gap-2">
                  <Camera size={16} className="text-[#FF4A70]" />
                  <span>Send a Photo</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPhotoPickerModal(false)}
                  className="text-[#8A767E] hover:text-[#2D151E] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Upload from device button */}
              <button
                type="button"
                onClick={() => {
                  setShowPhotoPickerModal(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                <ImageIcon size={16} />
                <span>Upload From Device / Camera</span>
              </button>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[#8A767E] uppercase tracking-wider">
                  Or pick a photo prompt:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedPhotoUrl(preset.url);
                        setShowPhotoPickerModal(false);
                      }}
                      className="group/p relative h-24 rounded-2xl overflow-hidden border border-[#E5D7CE] hover:border-[#FF4A70] cursor-pointer shadow-xs transition"
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover/p:scale-105 transition duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                        <span className="text-[10px] font-bold text-white truncate">{preset.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN LIGHTBOX PHOTO VIEWER */}
        {previewLightboxUrl && (
          <div 
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setPreviewLightboxUrl(null)}
          >
            <div className="relative max-w-xl max-h-[85vh] w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => setPreviewLightboxUrl(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 shadow-xl transition cursor-pointer"
                title="Close Photo"
              >
                <X size={20} />
              </button>
              <img 
                src={previewLightboxUrl} 
                alt="Enlarged shared photo" 
                className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* VOICE RECORDER MODAL */}
        {isRecordingModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
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
