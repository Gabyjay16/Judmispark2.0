import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  EventItem, 
  EventChatMessage, 
  TownLocation 
} from '../types';
import { storage } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import { AudioRecorder } from './AudioRecorder';
import { RecordedAudioData } from '../utils/audio';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plus, 
  Share2, 
  MessageSquare, 
  Check, 
  Image as ImageIcon, 
  Send, 
  Mic, 
  X,
  Sparkles,
  Lock,
  Bell,
  BellRing
} from 'lucide-react';

interface EventsViewProps {
  currentUser: UserProfile;
  initialEventId?: string | null;
  onClearInitialEvent?: () => void;
}

const CAMEROON_TOWNS: TownLocation[] = [
  'Douala',
  'Bamenda',
  'Yaoundé',
  'Buea',
  'Limbe',
  'Bafoussam'
];

export const EventsView: React.FC<EventsViewProps> = ({ 
  currentUser,
  initialEventId,
  onClearInitialEvent
}) => {
  const [events, setEvents] = useState<EventItem[]>(storage.getEvents());
  const [selectedTown, setSelectedTown] = useState<TownLocation | 'All'>('All');
  const [activeChatEvent, setActiveChatEvent] = useState<EventItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareModalEvent, setShareModalEvent] = useState<EventItem | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [remindedEventIds, setRemindedEventIds] = useState<string[]>(() => storage.getEventReminders(currentUser.id));
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Jump to specific event if opened from a notification
  useEffect(() => {
    if (initialEventId) {
      const target = events.find(e => e.id === initialEventId);
      if (target) {
        setSelectedTown('All');
        setActiveChatEvent(target);
        setEventMessages(storage.getEventMessages(target.id));
      }
      onClearInitialEvent?.();
    }
  }, [initialEventId, events, onClearInitialEvent]);

  // Event Chat State
  const [eventMessages, setEventMessages] = useState<EventChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [eventChatPhoto, setEventChatPhoto] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isEventVoiceOpen, setIsEventVoiceOpen] = useState(false);
  const eventFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '25 September 2026',
    time: '8:00 PM',
    town: currentUser.town,
    neighborhood: '',
    venue: '',
    photos: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80'
    ] as string[],
    chatMode: 'Open Chat' as 'Open Chat' | 'Creator Only' | 'Disabled'
  });

  const refreshEvents = () => {
    setEvents(storage.getEvents());
  };

  const filteredEvents = events.filter(e => {
    if (selectedTown !== 'All' && e.town !== selectedTown) return false;
    return true;
  });

  const handleJoinEvent = (event: EventItem) => {
    if (event.joinedUserIds.includes(currentUser.id)) return;

    const updated = events.map(e => {
      if (e.id === event.id) {
        return {
          ...e,
          joinedUserIds: [...e.joinedUserIds, currentUser.id]
        };
      }
      return e;
    });

    storage.setEvents(updated);
    setEvents(updated);

    // Notify event creator
    if (event.creatorId !== currentUser.id) {
      storage.addNotification({
        id: `notif_${Date.now()}`,
        userId: event.creatorId,
        title: 'Someone joined your event! 🎉',
        message: `${currentUser.displayName} joined "${event.title}".`,
        type: 'event_join',
        relatedId: event.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const created = new Date();
    // Expiration: event datetime + 3 hours
    const eventTimeIso = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    const expiresIso = new Date(eventTimeIso.getTime() + 3 * 3600 * 1000);

    const createdEvent: EventItem = {
      id: `evt_${Date.now()}`,
      creatorId: currentUser.id,
      creatorName: currentUser.displayName,
      creatorPhoto: currentUser.profilePicture,
      title: newEvent.title.trim(),
      description: newEvent.description.trim(),
      date: newEvent.date,
      time: newEvent.time,
      town: newEvent.town,
      neighborhood: newEvent.neighborhood || 'Central',
      venue: newEvent.venue || undefined,
      photos: newEvent.photos.slice(0, 3),
      chatMode: newEvent.chatMode,
      joinedUserIds: [currentUser.id],
      createdAt: created.toISOString(),
      eventDateTime: eventTimeIso.toISOString(),
      expiresAt: expiresIso.toISOString(),
      status: 'upcoming'
    };

    const updated = [createdEvent, ...events];
    storage.setEvents(updated);
    setEvents(updated);
    setIsCreateModalOpen(false);
  };

  const openEventChat = (event: EventItem) => {
    setActiveChatEvent(event);
    setEventMessages(storage.getEventMessages(event.id));
  };

  const handleEventPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEventChatPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSendEventMessage = (voiceData?: RecordedAudioData) => {
    if (!activeChatEvent) return;
    if (!voiceData && !chatInputText.trim() && !eventChatPhoto) return;

    const msg: EventChatMessage = {
      id: `evtm_${Date.now()}`,
      eventId: activeChatEvent.id,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderPhoto: currentUser.profilePicture,
      text: chatInputText.trim() || undefined,
      imageUrl: eventChatPhoto || undefined,
      voiceUrl: voiceData?.blobUrl,
      voiceDuration: voiceData?.duration,
      createdAt: new Date().toISOString()
    };

    storage.addEventMessage(msg);
    setEventMessages(prev => [...prev, msg]);
    setChatInputText('');
    setEventChatPhoto(null);
    setIsEventVoiceOpen(false);
  };

  const getShareUrl = (evt: EventItem) => {
    return `https://judmispark.com/event/${evt.id.slice(-6)}`;
  };

  const handleCopyLink = (evt: EventItem) => {
    const url = getShareUrl(evt);
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleToggleReminder = (event: EventItem) => {
    const isNowReminded = storage.toggleEventReminder(currentUser.id, event.id);
    const updatedReminders = storage.getEventReminders(currentUser.id);
    setRemindedEventIds(updatedReminders);

    if (isNowReminded) {
      setReminderToast(`Reminder set for "${event.title}"! 🔔`);
      setTimeout(() => setReminderToast(null), 3200);

      // Create in-app notification confirming reminder preference saved
      storage.addNotification({
        id: `notif_remind_${Date.now()}`,
        userId: currentUser.id,
        title: `Event Reminder: ${event.title} 🔔`,
        message: `You subscribed to notifications for "${event.title}" in ${event.town} (${event.date} at ${event.time}).`,
        type: 'event_join',
        relatedId: event.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    } else {
      setReminderToast(`Reminder turned off for "${event.title}".`);
      setTimeout(() => setReminderToast(null), 3200);
    }
  };

  return (
    <div id="events-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-24 relative">
      {/* Reminder Action Toast */}
      {reminderToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-amber-500/40 text-neutral-100 text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#2D151E] flex items-center gap-2">
            <span>Real-World Events</span>
          </h2>
          <p className="text-xs text-[#8A767E] mt-0.5">
            Hangouts, meetups & gatherings in Cameroon
          </p>
        </div>

        <button
          id="create-event-btn"
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition hover:opacity-95 active:scale-95 cursor-pointer"
        >
          <Plus size={15} />
          <span>New Event</span>
        </button>
      </div>

      {/* Town filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {(['All', 'Douala', 'Bamenda', 'Yaoundé', 'Buea', 'Limbe'] as const).map(town => (
          <button
            key={town}
            type="button"
            onClick={() => setSelectedTown(town)}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-bold transition cursor-pointer ${
              selectedTown === town
                ? 'bg-[#FF4A70] text-white shadow-2xs'
                : 'bg-white text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
            }`}
          >
            {town === 'All' ? 'All Towns' : `📍 ${town}`}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map(event => {
          const isJoined = event.joinedUserIds.includes(currentUser.id);
          const isCreator = event.creatorId === currentUser.id;
          const isReminded = remindedEventIds.includes(event.id);

          return (
            <div
              key={event.id}
              className="bg-white border border-[#EFE3DB] hover:border-[#E5D7CE] rounded-3xl overflow-hidden shadow-sm transition group"
            >
              {/* Photo Gallery (up to 3 photos) */}
              <div className="grid grid-cols-3 gap-1 h-44 bg-[#FAF4F0] p-1">
                {event.photos.slice(0, 3).map((photo, pIdx) => (
                  <div key={pIdx} className="relative h-full overflow-hidden rounded-xl">
                    <img 
                      src={photo} 
                      alt={`Event preview ${pIdx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>

              {/* Event Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold text-[#2D151E]">
                      {event.title}
                    </h3>
                    {/* Location prominently displayed */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF4A70] mt-1">
                      <MapPin size={13} className="shrink-0 fill-[#FF4A70]/20" />
                      <span>{event.neighborhood}, {event.town}</span>
                      {event.venue && (
                        <span className="text-[#8A767E] font-normal">({event.venue})</span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Remind Me Toggle & Share */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleReminder(event)}
                      title={isReminded ? "Turn off reminder notifications" : "Subscribe to event reminder notifications"}
                      className={`py-1.5 px-3 rounded-full border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                        isReminded
                          ? 'bg-[#FF4A70]/15 text-[#FF4A70] border-[#FF4A70]/30 shadow-2xs'
                          : 'bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] hover:bg-[#F2E7DF] border-[#E5D7CE]'
                      }`}
                    >
                      {isReminded ? (
                        <>
                          <BellRing size={13} className="text-[#FF4A70] animate-pulse shrink-0" />
                          <span>Reminded</span>
                        </>
                      ) : (
                        <>
                          <Bell size={13} className="text-[#8A767E] shrink-0" />
                          <span>Remind Me</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareModalEvent(event)}
                      title="Share Event"
                      className="p-2 rounded-full bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE] transition shrink-0 cursor-pointer"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-4 text-xs text-[#2D151E] bg-[#FAF4F0] p-2.5 rounded-2xl border border-[#EFE3DB]">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#FF4A70]" />
                    <span className="font-semibold">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#FF4A70]" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto text-[#8A767E] text-[11px]">
                    <Users size={12} className="text-emerald-600" />
                    <span>{event.joinedUserIds.length} joined</span>
                  </div>
                </div>

                <p className="text-xs text-[#8A767E] leading-relaxed">
                  {event.description}
                </p>

                {/* Chat Mode Tag */}
                <div className="flex items-center justify-between text-[11px] text-[#8A767E] pt-1">
                  <span>
                    Chat Mode: <strong className="text-[#2D151E]">{event.chatMode}</strong>
                  </span>
                  <span className="text-[10px] text-[#8A767E]">
                    Host: {event.creatorName}
                  </span>
                </div>

                {/* Action Buttons: Join and Chat */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#EFE3DB]">
                  <button
                    type="button"
                    onClick={() => handleJoinEvent(event)}
                    disabled={isJoined}
                    className={`flex-1 py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isJoined
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-default'
                        : 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-md shadow-rose-500/20'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span>Joined ({event.joinedUserIds.length})</span>
                      </>
                    ) : (
                      <>
                        <Users size={14} />
                        <span>JOIN EVENT</span>
                      </>
                    )}
                  </button>

                  {event.chatMode !== 'Disabled' && (
                    <button
                      type="button"
                      onClick={() => openEventChat(event)}
                      className="py-2.5 px-4 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] font-bold text-xs flex items-center gap-1.5 border border-[#E5D7CE] transition cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>Event Chat</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EVENT CHAT MODAL */}
      {activeChatEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl w-full max-w-lg h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#EFE3DB] flex items-center justify-between bg-[#FAF4F0]">
              <div>
                <h3 className="text-sm font-bold text-[#2D151E] truncate max-w-xs">
                  {activeChatEvent.title} — Chat
                </h3>
                <span className="text-[11px] text-[#8A767E]">
                  {activeChatEvent.chatMode} • {activeChatEvent.joinedUserIds.length} members
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveChatEvent(null)}
                className="text-[#8A767E] hover:text-[#2D151E] text-xs px-3 py-1 rounded-full border border-[#E5D7CE] bg-white cursor-pointer font-bold"
              >
                Close
              </button>
            </div>

            {/* Hidden native input */}
            <input 
              type="file" 
              ref={eventFileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleEventPhotoUpload} 
            />

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF4F0]/60">
              {eventMessages.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8A767E]">
                  No messages yet in this event chat. Say hello to participants!
                </div>
              ) : (
                eventMessages.map(msg => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-[#8A767E] mb-0.5 px-1">
                        {msg.senderName}
                      </span>
                      <div className={`max-w-[80%] rounded-2xl p-2.5 text-xs space-y-1.5 shadow-2xs ${
                        isMe 
                          ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white' 
                          : 'bg-white border border-[#EFE3DB] text-[#2D151E]'
                      }`}>
                        {/* Event chat photo */}
                        {msg.imageUrl && (
                          <div 
                            className="rounded-xl overflow-hidden cursor-pointer"
                            onClick={() => setLightboxImg(msg.imageUrl || null)}
                          >
                            <img 
                              src={msg.imageUrl} 
                              alt="Shared in event" 
                              className="max-h-48 w-full object-cover rounded-xl"
                            />
                          </div>
                        )}

                        {msg.voiceUrl ? (
                          <AudioPlayer
                            audioUrl={msg.voiceUrl}
                            duration={msg.voiceDuration || 4}
                            userName={msg.senderName}
                            seed={msg.id}
                          />
                        ) : (
                          msg.text && <span>{msg.text}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected photo preview strip */}
            {eventChatPhoto && (
              <div className="px-3 py-1.5 bg-[#FAF4F0] border-t border-[#EFE3DB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={eventChatPhoto} alt="Preview" className="w-9 h-9 rounded-lg object-cover border border-[#FF4A70]/50" />
                  <span className="text-[11px] text-[#2D151E] font-medium">Photo attached</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEventChatPhoto(null)} 
                  className="text-[#8A767E] hover:text-[#2D151E] text-xs p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Check Mode */}
            <div className="p-3 bg-white border-t border-[#EFE3DB]">
              {activeChatEvent.chatMode === 'Creator Only' && activeChatEvent.creatorId !== currentUser.id ? (
                <div className="p-2.5 bg-[#FAF4F0] border border-[#EFE3DB] rounded-xl text-center text-xs text-[#8A767E] flex items-center justify-center gap-2">
                  <Lock size={13} />
                  <span>Only the event creator can post messages in this chat.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => eventFileInputRef.current?.click()}
                    title="Send photo"
                    className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition cursor-pointer ${
                      eventChatPhoto 
                        ? 'bg-[#FF4A70] text-white border-[#FF4A70]' 
                        : 'bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#8A767E] hover:text-[#2D151E] border-[#E5D7CE]'
                    }`}
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEventVoiceOpen(true)}
                    className="w-10 h-10 rounded-2xl bg-[#FAF4F0] hover:bg-[#FF4A70]/15 text-[#8A767E] hover:text-[#FF4A70] border border-[#E5D7CE] flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Mic size={16} />
                  </button>
                  <input
                    type="text"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    placeholder={eventChatPhoto ? "Add a message..." : "Message event participants..."}
                    className="flex-1 bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl py-2 px-3 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
                  />
                  <button
                    type="button"
                    disabled={!chatInputText.trim() && !eventChatPhoto}
                    onClick={() => handleSendEventMessage()}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#F73B66] to-[#FF874F] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Event Images */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-lg max-h-[85vh] w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white border border-neutral-700"
            >
              <X size={18} />
            </button>
            <img 
              src={lightboxImg} 
              alt="Enlarged" 
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* EVENT VOICE RECORDER MODAL */}
      {isEventVoiceOpen && activeChatEvent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <AudioRecorder
            isRegistration={false}
            userName={currentUser.displayName}
            onRecordingComplete={(voiceData) => handleSendEventMessage(voiceData)}
            onCancel={() => setIsEventVoiceOpen(false)}
            title="Send Event Voice Note"
            description="Share a quick voice note with attendees."
          />
        </div>
      )}

      {/* SHAREABLE EVENT LINK MODAL (Spec #31) */}
      {shareModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
              <h3 className="text-sm font-bold text-[#2D151E] flex items-center gap-1.5">
                <Share2 size={16} className="text-[#FF4A70]" />
                <span>Share Event</span>
              </h3>
              <button
                type="button"
                onClick={() => setShareModalEvent(null)}
                className="text-[#8A767E] hover:text-[#2D151E] text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#2D151E] mb-1">{shareModalEvent.title}</h4>
              <p className="text-[11px] text-[#8A767E]">
                📍 {shareModalEvent.neighborhood}, {shareModalEvent.town} • {shareModalEvent.date}
              </p>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out "${shareModalEvent.title}" on JudmiSpark! 📍 ${shareModalEvent.town}: ${getShareUrl(shareModalEvent)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
              >
                WhatsApp
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Going to "${shareModalEvent.title}" in ${shareModalEvent.town}! Join on JudmiSpark: ${getShareUrl(shareModalEvent)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
              >
                WhatsApp Status
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(getShareUrl(shareModalEvent))}&text=${encodeURIComponent(shareModalEvent.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-sky-100 transition"
              >
                Telegram
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl(shareModalEvent))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition"
              >
                Facebook
              </a>
            </div>

            {/* Copy Link Input */}
            <div className="pt-2">
              <div className="flex items-center gap-2 bg-[#FAF4F0] p-1.5 rounded-xl border border-[#E5D7CE]">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(shareModalEvent)}
                  className="bg-transparent text-xs text-[#2D151E] px-2 flex-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(shareModalEvent)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FF4A70] text-white text-xs font-bold shrink-0 transition cursor-pointer"
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
              <h3 className="text-sm font-bold text-[#2D151E]">Create New Event</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8A767E] hover:text-[#2D151E] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Friday Night Hangout"
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                    Town / City
                  </label>
                  <select
                    value={newEvent.town}
                    onChange={(e) => setNewEvent({ ...newEvent, town: e.target.value as TownLocation })}
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                  >
                    {CAMEROON_TOWNS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                    Neighborhood / Area
                  </label>
                  <input
                    type="text"
                    required
                    value={newEvent.neighborhood}
                    onChange={(e) => setNewEvent({ ...newEvent, neighborhood: e.target.value })}
                    placeholder="e.g. Bonapriso, Molyko"
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    placeholder="25 September 2026"
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    placeholder="8:00 PM"
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                  Optional Venue
                </label>
                <input
                  type="text"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="e.g. Green Terrace Lounge"
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Come chill and meet new people..."
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                  Event Chat Mode
                </label>
                <select
                  value={newEvent.chatMode}
                  onChange={(e) => setNewEvent({ ...newEvent, chatMode: e.target.value as any })}
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                >
                  <option value="Open Chat">Open Chat (Everyone can chat & voice)</option>
                  <option value="Creator Only">Creator Only (Announcements only)</option>
                  <option value="Disabled">Disabled (No event chat)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition hover:scale-[1.01] cursor-pointer"
              >
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
