import React, { useState } from 'react';
import { 
  UserProfile, 
  MatchConversation 
} from '../types';
import { storage } from '../utils/storage';
import { 
  Heart, 
  MessageCircle, 
  Clock, 
  Mic, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  MapPin,
  Lock
} from 'lucide-react';

interface MatchViewProps {
  currentUser: UserProfile;
  onOpenChat: (conversation: MatchConversation, otherUser: UserProfile) => void;
  onOpenProfile: (user: UserProfile) => void;
}

export const MatchView: React.FC<MatchViewProps> = ({
  currentUser,
  onOpenChat,
  onOpenProfile
}) => {
  const matches = storage.getMatches();
  const allUsers = storage.getUsers();
  const blocked = new Set(storage.getBlockedIds());

  // Filter conversations where currentUser is a participant and other participant is not blocked
  const userMatches = matches.filter(m => 
    m.participants.includes(currentUser.id) &&
    !m.participants.some(p => p !== currentUser.id && blocked.has(p))
  );

  // SECTION A: Awaiting Reply
  // The other person has messaged/contacted, and the current user has not yet replied!
  // (i.e. last message was from the other user AND currentUser has 0 replies or last message sender is other user with unreplied status)
  const awaitingReplyMatches = userMatches.filter(m => {
    const myCount = m.userMessageCounts[currentUser.id] || 0;
    const isLastFromOther = m.lastMessageSenderId !== currentUser.id;
    return isLastFromOther && myCount === 0;
  });

  // SECTION B: Active Conversations
  // Conversations where the user has already replied or conversation is actively ongoing
  const activeConversations = userMatches.filter(m => {
    const myCount = m.userMessageCounts[currentUser.id] || 0;
    const isLastFromOther = m.lastMessageSenderId !== currentUser.id;
    return !(isLastFromOther && myCount === 0);
  });

  const getOtherUser = (conv: MatchConversation): UserProfile | undefined => {
    const otherId = conv.participants.find(p => p !== currentUser.id);
    return allUsers.find(u => u.id === otherId);
  };

  return (
    <div id="match-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>Matches & Chats</span>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {userMatches.length}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Voice-verified connections in Cameroon
          </p>
        </div>
      </div>

      {/* SECTION A: Awaiting Reply */}
      <div id="awaiting-reply-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Section A — Awaiting Your Reply ({awaitingReplyMatches.length})
            </h3>
          </div>
          <span className="text-[10px] text-neutral-500">
            They messaged you first
          </span>
        </div>

        {awaitingReplyMatches.length === 0 ? (
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center text-xs text-neutral-400">
            No pending conversations awaiting your reply.
          </div>
        ) : (
          <div className="space-y-2.5">
            {awaitingReplyMatches.map(conv => {
              const otherUser = getOtherUser(conv);
              if (!otherUser) return null;

              return (
                <div
                  key={conv.id}
                  className="bg-gradient-to-r from-neutral-900 via-amber-950/20 to-neutral-900 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg shadow-amber-950/10 hover:border-amber-500/50 transition cursor-pointer"
                  onClick={() => onOpenChat(conv, otherUser)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={otherUser.profilePicture} 
                        alt={otherUser.displayName} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/60"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-neutral-900" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate">
                          {otherUser.displayName}
                        </h4>
                        <span className="text-[11px] text-neutral-400">
                          {otherUser.age} • {otherUser.town}
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/90 truncate mt-0.5 italic">
                        "{conv.lastMessageText}"
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChat(conv, otherUser);
                    }}
                    className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-xs shrink-0 flex items-center gap-1 shadow-md shadow-amber-500/20 transition hover:scale-105"
                  >
                    <span>Reply</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION B: Active Conversations */}
      <div id="active-conversations-section" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Section B — Active Conversations ({activeConversations.length})
            </h3>
          </div>
          <span className="text-[10px] text-neutral-500">
            Voice verified & chatting
          </span>
        </div>

        {activeConversations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <MessageCircle size={20} />
            </div>
            <h4 className="text-xs font-semibold text-neutral-300">
              No active conversations yet
            </h4>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
              Like more profiles in Discover to create new matches and start chatting!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeConversations.map(conv => {
              const otherUser = getOtherUser(conv);
              if (!otherUser) return null;

              const isVoiceVerified = conv.isVoiceVerified;
              const myCount = conv.userMessageCounts[currentUser.id] || 0;
              const isLocked = myCount >= 5 && !isVoiceVerified;

              return (
                <div
                  key={conv.id}
                  onClick={() => onOpenChat(conv, otherUser)}
                  className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={otherUser.profilePicture} 
                        alt={otherUser.displayName} 
                        className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                      />
                      {isVoiceVerified ? (
                        <span title="Voice Verified" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      ) : (
                        <span title="Voice Exchange Incomplete" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                          🎙
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition">
                          {otherUser.displayName}
                        </h4>
                        <span className="text-[11px] text-neutral-400">
                          • {otherUser.town}
                        </span>
                        {isLocked && (
                          <span className="text-[10px] bg-rose-950 border border-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                            <Lock size={9} /> Locked
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {conv.lastMessageSenderId === currentUser.id ? 'You: ' : ''}
                        {conv.lastMessageText}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-neutral-500 block">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {isVoiceVerified ? (
                        <span className="text-[10px] text-emerald-400 font-medium">Verified</span>
                      ) : (
                        <span className="text-[10px] text-rose-400 font-medium">Need Voice</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
