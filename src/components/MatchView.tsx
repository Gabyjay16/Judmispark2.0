import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Lock,
  Trash2,
  Check,
  CheckSquare,
  Square,
  X,
  ChevronDown,
  AlertTriangle,
  Flame,
  UserCheck
} from 'lucide-react';

interface MatchViewProps {
  currentUser: UserProfile;
  onOpenChat: (conversation: MatchConversation, otherUser: UserProfile) => void;
  onOpenProfile: (user: UserProfile) => void;
}

type MatchesFilterTab = 'all' | 'likes' | 'awaiting' | 'active';

const STORAGE_KEY_LAST_SEEN_AWAITING_TIME = 'judmispark_last_seen_awaiting_time';
const STORAGE_KEY_SEEN_LIKE_USERS = 'judmispark_seen_like_user_ids';

export const MatchView: React.FC<MatchViewProps> = ({
  currentUser,
  onOpenChat,
  onOpenProfile
}) => {
  const [matchesList, setMatchesList] = useState<MatchConversation[]>([]);
  const [filterTab, setFilterTab] = useState<MatchesFilterTab>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [swipedOpenId, setSwipedOpenId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  
  // Track seen like profiles so they stop bouncing once opened
  const [seenLikeUserIds, setSeenLikeUserIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SEEN_LIKE_USERS);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markLikeAsSeenAndOpenProfile = (user: UserProfile) => {
    setSeenLikeUserIds(prev => {
      const next = new Set(prev);
      next.add(user.id);
      try {
        localStorage.setItem(STORAGE_KEY_SEEN_LIKE_USERS, JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error('Failed to save seen likes:', err);
      }
      return next;
    });
    onOpenProfile(user);
  };
  
  // Awaiting Messages Dropdown state (closed automatically by default)
  const [isAwaitingDropdownOpen, setIsAwaitingDropdownOpen] = useState(false);
  const [hasNewAwaitingAlert, setHasNewAwaitingAlert] = useState(false);

  // Load matches
  const reloadMatches = () => {
    const rawMatches = storage.getMatches();
    const blocked = new Set(storage.getBlockedIds());
    const filtered = rawMatches.filter(m => 
      m.participants.includes(currentUser.id) &&
      !m.participants.some(p => p !== currentUser.id && blocked.has(p))
    );
    setMatchesList(filtered);
  };

  useEffect(() => {
    reloadMatches();
  }, [currentUser]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const allUsers = storage.getUsers();
  const likesReceived = storage.getLikesReceivedBy(currentUser.id);
  const likesSent = storage.getLikesSentBy(currentUser.id);

  // Awaiting Messages - Sorted with the most recent at the top
  const awaitingReplyMatches = useMemo(() => {
    return matchesList
      .filter(m => {
        const myCount = m.userMessageCounts[currentUser.id] || 0;
        const isLastFromOther = m.lastMessageSenderId !== currentUser.id;
        return isLastFromOther && myCount === 0;
      })
      .sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.matchedAt || 0).getTime();
        const timeB = new Date(b.lastMessageAt || b.matchedAt || 0).getTime();
        return timeB - timeA; // Descending: newest first
      });
  }, [matchesList, currentUser.id]);

  // Check for new awaiting messages to trigger gentle blinking count badge
  // Using persistent last-seen timestamp so it stays quiet across page navigation once opened!
  useEffect(() => {
    if (awaitingReplyMatches.length === 0) {
      setHasNewAwaitingAlert(false);
      return;
    }

    const lastSeenTime = parseInt(
      localStorage.getItem(STORAGE_KEY_LAST_SEEN_AWAITING_TIME) || '0', 
      10
    );

    // If there is ANY awaiting match whose message/match arrived AFTER lastSeenTime:
    const hasUnseenAwaiting = awaitingReplyMatches.some(m => {
      const msgTime = new Date(m.lastMessageAt || m.matchedAt || 0).getTime();
      return msgTime > lastSeenTime;
    });

    if (hasUnseenAwaiting && !isAwaitingDropdownOpen) {
      setHasNewAwaitingAlert(true);
    } else {
      setHasNewAwaitingAlert(false);
    }
  }, [awaitingReplyMatches, isAwaitingDropdownOpen]);

  const markAwaitingAsSeen = () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST_SEEN_AWAITING_TIME, now.toString());
    setHasNewAwaitingAlert(false);
  };

  const toggleAwaitingDropdown = () => {
    setIsAwaitingDropdownOpen(prev => {
      const next = !prev;
      if (next) {
        // Stops blinking as soon as user opens it
        markAwaitingAsSeen();
      }
      return next;
    });
  };

  // Active Messages
  const activeConversations = useMemo(() => {
    return matchesList
      .filter(m => {
        const myCount = m.userMessageCounts[currentUser.id] || 0;
        const isLastFromOther = m.lastMessageSenderId !== currentUser.id;
        return !(isLastFromOther && myCount === 0);
      })
      .sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.matchedAt || 0).getTime();
        const timeB = new Date(b.lastMessageAt || b.matchedAt || 0).getTime();
        return timeB - timeA;
      });
  }, [matchesList, currentUser.id]);

  // Likes & New Matches for the Top Avatar Carousel & Likes filter
  const newMatchesAndLikes = useMemo(() => {
    const list: { user: UserProfile; conv?: MatchConversation; type: 'liked_you' | 'you_liked' | 'match'; time: string }[] = [];
    const addedUserIds = new Set<string>();

    // 1. Matches from matchesList
    for (const match of matchesList) {
      const otherId = match.participants.find(p => p !== currentUser.id);
      if (!otherId || addedUserIds.has(otherId)) continue;
      const user = allUsers.find(u => u.id === otherId);
      if (!user) continue;

      const hasSentLike = likesSent.some(l => l.toUserId === otherId);
      const hasReceivedLike = likesReceived.some(l => l.fromUserId === otherId);

      let type: 'liked_you' | 'you_liked' | 'match' = 'match';
      if (hasReceivedLike && !hasSentLike) {
        type = 'liked_you';
      } else if (hasSentLike && !hasReceivedLike) {
        type = 'you_liked';
      }

      list.push({
        user,
        conv: match,
        type,
        time: match.lastMessageAt || match.matchedAt
      });
      addedUserIds.add(otherId);
    }

    // 2. Incoming likes that may not yet have a conversation
    for (const like of likesReceived) {
      if (addedUserIds.has(like.fromUserId)) continue;
      const user = allUsers.find(u => u.id === like.fromUserId);
      if (!user) continue;

      list.push({
        user,
        type: 'liked_you',
        time: like.createdAt
      });
      addedUserIds.add(like.fromUserId);
    }

    return list;
  }, [matchesList, allUsers, likesReceived, likesSent, currentUser.id]);

  const getOtherUser = (conv: MatchConversation): UserProfile | undefined => {
    const otherId = conv.participants.find(p => p !== currentUser.id);
    return allUsers.find(u => u.id === otherId);
  };

  const handleOpenConversation = (conv: MatchConversation, otherUser: UserProfile) => {
    markAwaitingAsSeen();
    onOpenChat(conv, otherUser);
  };

  // Delete single conversation
  const handleDeleteSingle = (matchId: string) => {
    const currentMatches = storage.getMatches();
    const updated = currentMatches.filter(m => m.id !== matchId);
    storage.setMatches(updated);

    // Clean up messages for this conversation
    const currentMessages = storage.getMessages();
    const updatedMsgs = currentMessages.filter(m => m.conversationId !== matchId);
    storage.setMessages(updatedMsgs);

    setSwipedOpenId(null);
    reloadMatches();
    setToastMessage('Conversation deleted');
  };

  // Delete multiple selected conversations
  const handleDeleteMultiple = () => {
    if (selectedIds.size === 0) return;

    const currentMatches = storage.getMatches();
    const updated = currentMatches.filter(m => !selectedIds.has(m.id));
    storage.setMatches(updated);

    const currentMessages = storage.getMessages();
    const updatedMsgs = currentMessages.filter(m => !selectedIds.has(m.conversationId));
    storage.setMessages(updatedMsgs);

    const count = selectedIds.size;
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setShowConfirmDeleteModal(false);
    reloadMatches();
    setToastMessage(`${count} ${count === 1 ? 'conversation' : 'conversations'} deleted`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === matchesList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(matchesList.map(m => m.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Swipeable Conversation Row Component
  const ConversationCard: React.FC<{
    conv: MatchConversation;
    isAwaiting: boolean;
  }> = ({ conv, isAwaiting }) => {
    const otherUser = getOtherUser(conv);
    if (!otherUser) return null;

    const isSelected = selectedIds.has(conv.id);
    const isOpen = swipedOpenId === conv.id;
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef<number>(0);
    const currentXRef = useRef<number>(0);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressTriggeredRef = useRef<boolean>(false);

    const isVoiceVerified = conv.isVoiceVerified;
    const myCount = conv.userMessageCounts[currentUser.id] || 0;
    const isLocked = myCount >= 5 && !isVoiceVerified;

    // Check if this conversation is from a single-tap profile like
    const isLikeInitiated = Boolean(
      conv.isLikedMatch || 
      (conv.lastMessageText && conv.lastMessageText.toLowerCase().includes('liked'))
    );

    // Long press detection
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      if (isSelectionMode) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      startXRef.current = clientX;
      currentXRef.current = clientX;
      isLongPressTriggeredRef.current = false;
      setIsDragging(true);

      longPressTimerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        setIsSelectionMode(true);
        setSelectedIds(new Set([conv.id]));
        setOffsetX(0);
        setSwipedOpenId(null);
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500);
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (isSelectionMode) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      currentXRef.current = clientX;
      const diff = clientX - startXRef.current;

      // Cancel long press if finger moved more than 8px
      if (Math.abs(diff) > 8 && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Allow sliding left up to -90px
      if (diff < 0) {
        setOffsetX(Math.max(-90, diff));
      } else if (isOpen && diff > 0) {
        setOffsetX(Math.min(0, -80 + diff));
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      setIsDragging(false);

      if (isLongPressTriggeredRef.current) {
        return;
      }

      if (isSelectionMode) return;

      // Check if swiped enough to snap open or close
      if (offsetX < -45) {
        setOffsetX(-80);
        setSwipedOpenId(conv.id);
      } else {
        setOffsetX(0);
        if (isOpen) {
          setSwipedOpenId(null);
        }
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (isLongPressTriggeredRef.current) {
        isLongPressTriggeredRef.current = false;
        return;
      }

      if (isSelectionMode) {
        e.stopPropagation();
        toggleSelectItem(conv.id);
        return;
      }

      if (isOpen) {
        e.stopPropagation();
        setOffsetX(0);
        setSwipedOpenId(null);
        return;
      }

      handleOpenConversation(conv, otherUser);
    };

    return (
      <div 
        className="relative overflow-hidden rounded-2xl select-none"
        onContextMenu={(e) => isSelectionMode && e.preventDefault()}
      >
        {/* Hidden Red Delete Action underneath */}
        {!isSelectionMode && (
          <div 
            className="absolute inset-y-0 right-0 w-20 bg-rose-600 hover:bg-rose-700 flex flex-col items-center justify-center text-white cursor-pointer transition z-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSingle(conv.id);
            }}
            title="Delete Conversation"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-bold mt-1">Delete</span>
          </div>
        )}

        {/* Swipeable Card Content */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onClick={handleClick}
          style={{
            transform: isSelectionMode ? 'none' : `translateX(${isOpen ? -80 : offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
          className={`relative z-10 ${
            isAwaiting 
              ? 'bg-gradient-to-r from-neutral-900 via-amber-950/20 to-neutral-900 border border-amber-500/30 hover:border-amber-500/50 shadow-amber-950/10' 
              : 'bg-neutral-900/95 border border-neutral-800 hover:border-neutral-700'
          } ${isSelected ? 'ring-2 ring-rose-500 bg-rose-950/20' : ''} p-3.5 flex items-center justify-between gap-3 shadow-lg transition-colors cursor-pointer group`}
        >
          {/* Multi-Select Checkbox */}
          {isSelectionMode && (
            <div 
              className="shrink-0 text-neutral-400 hover:text-white transition"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectItem(conv.id);
              }}
            >
              {isSelected ? (
                <div className="w-5 h-5 rounded-md bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  <Check size={14} />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-md border-2 border-neutral-600 bg-neutral-800" />
              )}
            </div>
          )}

          {/* User Info & Avatar */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img 
                src={otherUser.profilePicture} 
                alt={otherUser.displayName} 
                className={`w-12 h-12 rounded-full object-cover border-2 ${
                  isAwaiting 
                    ? 'border-amber-400/60' 
                    : isLikeInitiated 
                    ? 'border-rose-500' 
                    : 'border-neutral-700'
                }`}
              />
              {isAwaiting ? (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-neutral-900" />
              ) : isLikeInitiated ? (
                <span title="Liked Profile" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] shadow-sm">
                  ❤️
                </span>
              ) : isVoiceVerified ? (
                <span title="Voice Verified" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              ) : (
                <span title="Voice Exchange Incomplete" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                  🎙
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition">
                  {otherUser.displayName}
                </h4>
                <span className="text-[11px] text-neutral-400">
                  {otherUser.age ? `${otherUser.age} • ` : ''}{otherUser.town}
                </span>

                {/* Dedicated badge indicating Likes */}
                {isLikeInitiated && (
                  <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-400 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                    <Heart size={8} className="fill-rose-400 text-rose-400" /> 
                    {conv.lastMessageSenderId === currentUser.id ? 'You Liked' : 'Liked You'}
                  </span>
                )}

                {isLocked && !isAwaiting && (
                  <span className="text-[10px] bg-rose-950 border border-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                    <Lock size={9} /> Locked
                  </span>
                )}
              </div>

              <p className={`text-xs truncate mt-0.5 ${
                isAwaiting ? 'text-amber-200/90 italic' : 'text-neutral-400'
              }`}>
                {!isAwaiting && conv.lastMessageSenderId === currentUser.id ? 'You: ' : ''}
                {isAwaiting ? `"${conv.lastMessageText}"` : conv.lastMessageText}
              </p>
            </div>
          </div>

          {/* Right Action / Timestamp */}
          {isAwaiting ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isSelectionMode) {
                  toggleSelectItem(conv.id);
                } else {
                  handleOpenConversation(conv, otherUser);
                }
              }}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-xs shrink-0 flex items-center gap-1 shadow-md shadow-amber-500/20 transition hover:scale-105"
            >
              <span>Reply</span>
              <ArrowRight size={12} />
            </button>
          ) : (
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
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="match-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-28">
      {/* Top Banner & Multi-Select Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>Matches & Likes</span>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {matchesList.length}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Slide left to delete • Hold to select multiple
          </p>
        </div>

        {/* Toggle Select Mode Button */}
        {matchesList.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (isSelectionMode) {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              } else {
                setIsSelectionMode(true);
              }
            }}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition border ${
              isSelectionMode 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
          >
            {isSelectionMode ? 'Done' : 'Select'}
          </button>
        )}
      </div>

      {/* NEW MATCHES & LIKES STORY CAROUSEL */}
      {newMatchesAndLikes.length > 0 && !isSelectionMode && (
        <div id="new-likes-stories-carousel" className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Heart size={12} className="fill-rose-500 text-rose-500 animate-pulse" />
              New Matches & Likes ({newMatchesAndLikes.length})
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              Tap to view & chat
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4">
            {newMatchesAndLikes.map(({ user, conv, type }) => {
              const isUnseenLike = type === 'liked_you' && !seenLikeUserIds.has(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  id={`like-avatar-${user.id}`}
                  onClick={() => {
                    markLikeAsSeenAndOpenProfile(user);
                  }}
                  className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none transition active:scale-95"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 group-hover:scale-105 transition-transform duration-200 shadow-md shadow-rose-500/20">
                      <img 
                        src={user.profilePicture} 
                        alt={user.displayName}
                        className="w-full h-full rounded-full object-cover border-2 border-neutral-950" 
                      />
                    </div>

                    {/* Heart / Sparkle badge */}
                    <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm border border-neutral-950 ${
                      type === 'liked_you'
                        ? isUnseenLike 
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white animate-bounce'
                          : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                        : 'bg-neutral-800 text-rose-400'
                    }`}>
                      <Heart size={8} className="fill-current" />
                      <span>{type === 'liked_you' ? 'Liked you' : 'Liked'}</span>
                    </div>
                  </div>

                  <div className="text-center w-16">
                    <p className="text-[11px] font-bold text-neutral-200 truncate group-hover:text-rose-400 transition">
                      {user.displayName}
                    </p>
                    <p className="text-[9px] text-neutral-400 truncate">
                      {user.town}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Select Action Bar (when in selection mode) */}
      {isSelectionMode && (
        <div 
          id="multi-select-action-bar"
          className="bg-neutral-900/95 border border-neutral-700 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
            >
              {selectedIds.size === matchesList.length ? (
                <>
                  <CheckSquare size={14} className="text-rose-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={14} />
                  <span>Select All</span>
                </>
              )}
            </button>
            <span className="text-xs font-bold text-rose-400">
              {selectedIds.size} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setShowConfirmDeleteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition active:scale-95"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedIds.size})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Awaiting Messages Dropdown (Closed automatically by default) */}
      <div id="awaiting-reply-section" className="space-y-2.5">
        <button
          type="button"
          onClick={toggleAwaitingDropdown}
          className="w-full bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all group shadow-sm text-left cursor-pointer"
          title={isAwaitingDropdownOpen ? "Collapse Awaiting Messages" : "Expand Awaiting Messages"}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${hasNewAwaitingAlert ? 'bg-amber-400 animate-ping' : 'bg-amber-400'}`} />
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Awaiting Messages
            </h3>
            
            {/* Blinking / highlighted count pill when unseen new messages exist */}
            <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-black transition-all ${
              hasNewAwaitingAlert 
                ? 'bg-amber-400 text-neutral-950 ring-2 ring-amber-300 ring-offset-2 ring-offset-neutral-900 animate-pulse shadow-md shadow-amber-400/40 scale-105' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {awaitingReplyMatches.length}
            </span>

            {hasNewAwaitingAlert && (
              <span className="text-[10px] font-bold text-amber-400 animate-pulse tracking-wide uppercase">
                New
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">
              Pending reply
            </span>
            <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-amber-300 transition">
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-300 ${isAwaitingDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} 
              />
            </div>
          </div>
        </button>

        {/* Dropdown List Content */}
        {isAwaitingDropdownOpen && (
          <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200 pt-0.5">
            {awaitingReplyMatches.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center text-xs text-neutral-400">
                No pending conversations awaiting your reply.
              </div>
            ) : (
              awaitingReplyMatches.map(conv => (
                <ConversationCard 
                  key={conv.id} 
                  conv={conv} 
                  isAwaiting={true} 
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Active Messages */}
      <div id="active-conversations-section" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Active Messages ({activeConversations.length})
            </h3>
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">
            Active conversations
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
            {activeConversations.map(conv => (
              <ConversationCard 
                key={conv.id} 
                conv={conv} 
                isAwaiting={false} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Multiple Deletions */}
      {showConfirmDeleteModal && (
        <div 
          id="confirm-delete-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowConfirmDeleteModal(false)}
        >
          <div 
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Delete {selectedIds.size} {selectedIds.size === 1 ? 'Conversation' : 'Conversations'}?
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                This will remove the selected {selectedIds.size === 1 ? 'conversation' : 'conversations'} and all related messages from your inbox.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMultiple}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div 
          id="matches-action-toast"
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-neutral-900/95 border border-neutral-700 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 text-rose-400 flex items-center justify-center">
              <Trash2 size={14} />
            </div>
            <span className="text-xs font-semibold text-neutral-200">
              {toastMessage}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
