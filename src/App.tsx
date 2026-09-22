import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  MatchConversation, 
  InAppNotification 
} from './types';
import { storage } from './utils/storage';
import { DiscoverView } from './components/DiscoverView';
import { MatchView } from './components/MatchView';
import { LinkUpView } from './components/LinkUpView';
import { TalkView } from './components/TalkView';
import { EventsView } from './components/EventsView';
import { WalletView } from './components/WalletView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';
import { ChatModal } from './components/ChatModal';
import { RegistrationModal } from './components/RegistrationModal';
import { VoiceReportModal } from './components/VoiceReportModal';
import { GiftSparkModal } from './components/GiftSparkModal';
import { ProfileDetailModal } from './components/ProfileDetailModal';
import { NotificationsModal } from './components/NotificationsModal';
import { 
  Sparkles, 
  Flame, 
  MessageCircle, 
  Zap, 
  HeartHandshake, 
  Calendar, 
  Wallet, 
  User, 
  Bell, 
  ShieldAlert, 
  Users, 
  Lock
} from 'lucide-react';

type ActiveTab = 'discover' | 'matches' | 'linkup' | 'talk' | 'events' | 'wallet' | 'profile' | 'admin';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  
  // Modals state
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<{
    conversation: MatchConversation;
    otherUser: UserProfile;
  } | null>(null);

  const [activeProfileDetail, setActiveProfileDetail] = useState<UserProfile | null>(null);
  const [activeVoiceReport, setActiveVoiceReport] = useState<{
    reportedUser: UserProfile;
    conversation?: MatchConversation;
  } | null>(null);

  const [activeGiftSpark, setActiveGiftSpark] = useState<UserProfile | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Deep linking state for notifications
  const [talkInitialPostId, setTalkInitialPostId] = useState<string | null>(null);
  const [eventsInitialEventId, setEventsInitialEventId] = useState<string | null>(null);

  // App metrics
  const [balance, setBalance] = useState<number>(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshData = () => {
    const user = storage.getCurrentUser();
    setCurrentUser(user);
    const bal = storage.calculateUserBalance(user.id);
    setBalance(bal);

    const notifs = storage.getUserNotifications(user.id);
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = storage.onNotificationAdded(() => {
      refreshData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleStartChatWithUser = (targetUserId: string, initialMessage?: string) => {
    const allUsers = storage.getUsers();
    const otherUser = allUsers.find(u => u.id === targetUserId);
    if (!otherUser) return;

    // Check if match conversation already exists
    const matches = storage.getMatches();
    let conversation = matches.find(m => 
      m.participants.includes(currentUser.id) && m.participants.includes(otherUser.id)
    );

    if (!conversation) {
      conversation = {
        id: `match_${Date.now()}`,
        participants: [currentUser.id, otherUser.id],
        matchedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessageText: initialMessage || 'Connected via JudmiSpark',
        lastMessageSenderId: currentUser.id,
        userMessageCounts: {
          [currentUser.id]: 0,
          [otherUser.id]: 0
        },
        userHasSentVoiceNote: {
          [currentUser.id]: false,
          [otherUser.id]: false
        },
        isVoiceVerified: false,
        isIdentityRevealed: {
          [currentUser.id]: false,
          [otherUser.id]: false
        },
        unreadCountByUser: {
          [currentUser.id]: 0,
          [otherUser.id]: 1
        },
        status: 'active'
      };

      storage.setMatches([conversation, ...matches]);
    }

    setActiveChat({ conversation, otherUser });
  };

  const handleNotificationClick = (notif: InAppNotification) => {
    // 1. Mark as read & update state
    storage.markNotificationAsRead(notif.id);
    refreshData();
    setIsNotificationsOpen(false);

    // 2. Direct user to exact page and exact place/component
    switch (notif.type) {
      case 'match':
      case 'message':
      case 'voice_requirement': {
        const matches = storage.getMatches();
        const users = storage.getUsers();
        
        let conversation = matches.find(m => m.id === notif.relatedId);
        
        if (!conversation && notif.relatedId) {
          conversation = matches.find(m => 
            m.participants.includes(currentUser.id) && m.participants.includes(notif.relatedId!)
          );
        }

        if (!conversation) {
          conversation = matches.find(m => m.participants.includes(currentUser.id));
        }

        if (conversation) {
          const otherId = conversation.participants.find(id => id !== currentUser.id) || conversation.participants[0];
          const otherUser = users.find(u => u.id === otherId);
          if (otherUser) {
            setActiveChat({ conversation, otherUser });
            return;
          }
        }

        if (notif.relatedId && notif.relatedId.startsWith('usr_')) {
          handleStartChatWithUser(notif.relatedId);
          return;
        }

        setActiveTab('matches');
        break;
      }

      case 'spark_received':
      case 'spark_gift':
      case 'withdrawal_status': {
        setActiveTab('wallet');
        break;
      }

      case 'talk_reply': {
        setTalkInitialPostId(notif.relatedId || null);
        setActiveTab('talk');
        break;
      }

      case 'event_join': {
        setEventsInitialEventId(notif.relatedId || null);
        setActiveTab('events');
        break;
      }

      case 'linkup_reply': {
        setActiveTab('linkup');
        break;
      }

      case 'premium_unlocked': {
        setActiveTab('profile');
        break;
      }

      default: {
        if (notif.relatedId?.startsWith('evt_')) {
          setEventsInitialEventId(notif.relatedId);
          setActiveTab('events');
        } else if (notif.relatedId?.startsWith('talk_')) {
          setTalkInitialPostId(notif.relatedId);
          setActiveTab('talk');
        } else if (notif.relatedId?.startsWith('match_') || notif.relatedId?.startsWith('usr_')) {
          handleStartChatWithUser(notif.relatedId.replace('match_', ''));
        } else if (notif.relatedId?.startsWith('tx_') || notif.relatedId?.startsWith('SPK')) {
          setActiveTab('wallet');
        } else {
          setActiveTab('discover');
        }
        break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* TOP APPLICATION BAR */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('discover')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-rose-500/30 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-base font-black tracking-tight text-white">
                  Judmi<span className="text-rose-500">Spark</span>
                </span>
                <span className="text-[10px] font-extrabold bg-rose-500/10 text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/20">
                  CM
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 block -mt-0.5 font-medium">
                Voice-Verified Social Platform
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT ROUTE */}
      <main className="flex-1 flex flex-col min-h-0">
        {activeTab === 'discover' && (
          <DiscoverView
            currentUser={currentUser}
            onMatchCreated={(other) => handleStartChatWithUser(other.id)}
            onOpenProfile={(user) => setActiveProfileDetail(user)}
            onReportUser={(user) => setActiveVoiceReport({ reportedUser: user })}
            onBlockUser={(user) => {
              storage.addBlockedId(user.id);
              refreshData();
              alert(`Blocked ${user.displayName}. Their profile will no longer appear.`);
            }}
          />
        )}

        {activeTab === 'matches' && (
          <MatchView
            currentUser={currentUser}
            onOpenChat={(conv, other) => setActiveChat({ conversation: conv, otherUser: other })}
            onOpenProfile={(user) => setActiveProfileDetail(user)}
          />
        )}

        {activeTab === 'linkup' && (
          <LinkUpView
            currentUser={currentUser}
            onOpenChatWithUser={(targetUserId, initialMsg) => handleStartChatWithUser(targetUserId, initialMsg)}
          />
        )}

        {activeTab === 'talk' && (
          <TalkView
            currentUser={currentUser}
            initialPostId={talkInitialPostId}
            onClearInitialPost={() => setTalkInitialPostId(null)}
            onOpenPrivateTalkChat={(targetUserId, initialMsg) => handleStartChatWithUser(targetUserId, initialMsg)}
            onReportContent={(type, id, name) => {
              alert(`Report received for "${name}". The moderation team will review it.`);
            }}
          />
        )}

        {activeTab === 'events' && (
          <EventsView
            currentUser={currentUser}
            initialEventId={eventsInitialEventId}
            onClearInitialEvent={() => setEventsInitialEventId(null)}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletView
            currentUser={currentUser}
            onRefreshUser={refreshData}
            onBack={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onRefreshUser={refreshData}
            onLogout={() => setIsRegistrationOpen(true)}
            onNavigateToWallet={() => setActiveTab('wallet')}
            onNavigateToAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            currentUser={currentUser}
            onExitAdmin={() => setActiveTab('profile')}
          />
        )}
      </main>

      {/* MOBILE-FIRST FLOATING BOTTOM NAVIGATION BAR */}
      <nav id="bottom-navigation-bar" className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800/90 py-1.5 px-2 sm:px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* 1. Discover */}
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'discover' 
                ? 'text-rose-500 font-bold scale-105' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame size={20} className={activeTab === 'discover' ? 'fill-rose-500/20' : ''} />
            <span className="text-[10px] mt-0.5">Discover</span>
          </button>

          {/* 2. Matches */}
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'matches' 
                ? 'text-rose-500 font-bold scale-105' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageCircle size={20} className={activeTab === 'matches' ? 'fill-rose-500/20' : ''} />
            <span className="text-[10px] mt-0.5">Matches</span>
          </button>

          {/* 3. Link Up */}
          <button
            type="button"
            onClick={() => setActiveTab('linkup')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'linkup' 
                ? 'text-amber-400 font-bold scale-105' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap size={20} className={activeTab === 'linkup' ? 'fill-amber-400/20' : ''} />
            <span className="text-[10px] mt-0.5">Link Up</span>
          </button>

          {/* 4. Talk */}
          <button
            type="button"
            onClick={() => setActiveTab('talk')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'talk' 
                ? 'text-rose-500 font-bold scale-105' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HeartHandshake size={20} />
            <span className="text-[10px] mt-0.5">Talk</span>
          </button>

          {/* 5. Events */}
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'events' 
                ? 'text-rose-500 font-bold scale-105' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calendar size={20} />
            <span className="text-[10px] mt-0.5">Events</span>
          </button>

          {/* 6. Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'profile' 
                ? 'text-rose-500 font-bold scale-105' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User size={20} />
            <span className="text-[10px] mt-0.5">Profile</span>
          </button>
        </div>
      </nav>

      {/* MODALS */}
      {/* 1. Chat Modal with 5-Message Voice Verification & Locks */}
      {activeChat && (
        <ChatModal
          currentUser={currentUser}
          conversation={activeChat.conversation}
          otherUser={activeChat.otherUser}
          onClose={() => setActiveChat(null)}
          onOpenProfile={(u) => setActiveProfileDetail(u)}
          onGiftSpark={(recipient) => setActiveGiftSpark(recipient)}
          onReportVoiceIdentity={(conv, other) => setActiveVoiceReport({ reportedUser: other, conversation: conv })}
          onRefresh={refreshData}
        />
      )}

      {/* 2. Registration Modal with Mandatory Voice Introduction */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onRegistered={(user) => {
          setCurrentUser(user);
          setIsRegistrationOpen(false);
          refreshData();
        }}
      />

      {/* 3. Voice Identity Report Modal */}
      {activeVoiceReport && (
        <VoiceReportModal
          currentUser={currentUser}
          reportedUser={activeVoiceReport.reportedUser}
          conversation={activeVoiceReport.conversation}
          onClose={() => setActiveVoiceReport(null)}
          onSubmitted={() => {
            setActiveVoiceReport(null);
            refreshData();
          }}
        />
      )}

      {/* 4. Gift Spark Modal */}
      {activeGiftSpark && (
        <GiftSparkModal
          currentUser={currentUser}
          recipient={activeGiftSpark}
          onClose={() => setActiveGiftSpark(null)}
          onGiftSent={() => {
            setActiveGiftSpark(null);
            refreshData();
          }}
        />
      )}

      {/* 5. Full Profile Detail Modal */}
      {activeProfileDetail && (
        <ProfileDetailModal
          user={activeProfileDetail}
          onClose={() => setActiveProfileDetail(null)}
          onGift={() => {
            const u = activeProfileDetail;
            setActiveProfileDetail(null);
            setActiveGiftSpark(u);
          }}
          onReport={() => {
            const u = activeProfileDetail;
            setActiveProfileDetail(null);
            setActiveVoiceReport({ reportedUser: u });
          }}
          onLike={() => {
            setActiveProfileDetail(null);
            handleStartChatWithUser(activeProfileDetail.id);
          }}
        />
      )}

      {/* 6. Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onClearAll={() => {
            storage.clearNotifications(currentUser.id);
            refreshData();
          }}
          onSelectNotification={handleNotificationClick}
        />
      )}
    </div>
  );
}
