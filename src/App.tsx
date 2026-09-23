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
import { ReferralPromoModal } from './components/ReferralPromoModal';
import { LandingHomeView } from './components/LandingHomeView';
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
  Lock,
  Crown
} from 'lucide-react';

type ActiveTab = 'discover' | 'matches' | 'linkup' | 'talk' | 'events' | 'wallet' | 'profile' | 'admin';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storage.isUserLoggedIn());
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  
  // Modals state
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isReferralPromoOpen, setIsReferralPromoOpen] = useState(false);
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

    // Check if user is logging in for the first time or has not seen the referral promo popup yet
    const user = storage.getCurrentUser();
    if (!storage.hasUserSeenReferralPromo(user.id)) {
      const timer = setTimeout(() => {
        setIsReferralPromoOpen(true);
      }, 700);
      return () => {
        clearTimeout(timer);
        unsubscribe();
      };
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCloseReferralPromo = () => {
    storage.markUserSeenReferralPromo(currentUser.id);
    setIsReferralPromoOpen(false);
  };

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

      case 'admin_alert':
      case 'wallet_topup': {
        if (storage.canUserApproveWallets(currentUser)) {
          setActiveTab('admin');
        } else {
          setActiveTab('wallet');
        }
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

  // If user is logged out, show the public Home / Landing Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF4F0] text-[#2D151E] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <LandingHomeView
          onOpenRegister={() => setIsRegistrationOpen(true)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            storage.setUserLoggedIn(true);
            refreshData();
            setActiveTab('discover');
          }}
        />

        {/* Registration Modal */}
        <RegistrationModal
          isOpen={isRegistrationOpen}
          onClose={() => setIsRegistrationOpen(false)}
          onRegistered={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            storage.setUserLoggedIn(true);
            setIsRegistrationOpen(false);
            refreshData();
            setIsReferralPromoOpen(true);
            setActiveTab('discover');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF4F0] text-[#2D151E] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* TOP APPLICATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FAF4F0]/90 backdrop-blur-md border-b border-[#F0E2DA]">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand Logo with Coral 'J' circle as in screenshot */}
          <div 
            onClick={() => setActiveTab('discover')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4A70] to-[#FF7B60] flex items-center justify-center text-white font-black text-sm shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              J
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-base font-black tracking-tight text-[#2D151E]">
                  JudmiSpark
                </span>
                <span className="text-[10px] font-extrabold bg-[#FF4A70]/10 text-[#FF4A70] px-1.5 py-0.2 rounded-full border border-[#FF4A70]/20">
                  CM
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Admin / Wallet Approver Hub button */}
            {storage.canUserApproveWallets(currentUser) && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-[#F07238] via-[#F17E3F] to-[#E56830] text-white border-transparent shadow-md shadow-orange-500/20'
                    : 'bg-[#F2E7DF] hover:bg-[#EBDED6] text-[#2D151E] border-[#E5D7CE]'
                }`}
                title="Admin Dashboard & Wallet Approvals"
              >
                <ShieldAlert size={14} className={activeTab === 'admin' ? 'text-white' : 'text-[#F07238]'} />
                <span className="hidden sm:inline">Admin Hub</span>
              </button>
            )}

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-full bg-white text-[#2D151E] hover:bg-[#F8EFEA] border border-[#EADBD2] transition shadow-2xs cursor-pointer"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF4A70] text-white text-[10px] font-bold flex items-center justify-center shadow-md">
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
            onLogout={() => {
              storage.logoutUser();
              setIsLoggedIn(false);
            }}
            onNavigateToWallet={() => setActiveTab('wallet')}
            onNavigateToAdmin={() => setActiveTab('admin')}
            onOpenReferralPromo={() => setIsReferralPromoOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            currentUser={currentUser}
            onExitAdmin={() => setActiveTab('profile')}
          />
        )}
      </main>

      {/* FLOATING SLEEK PILL DOCK (MATCHING SCREENSHOT AESTHETIC) */}
      <nav id="bottom-navigation-bar" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md bg-[#221B1E]/95 backdrop-blur-md border border-white/10 rounded-full shadow-2xl px-2 py-1.5">
        <div className="flex items-center justify-around">
          {/* 1. Discover */}
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'discover' 
                ? 'text-[#FF4A70] font-bold' 
                : 'text-[#A898A0] hover:text-white'
            }`}
          >
            <Flame size={19} className={activeTab === 'discover' ? 'fill-[#FF4A70]/20' : ''} />
            <span className="text-[10px] mt-0.5">Discover</span>
          </button>

          {/* 2. Matches */}
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'matches' 
                ? 'text-[#FF4A70] font-bold' 
                : 'text-[#A898A0] hover:text-white'
            }`}
          >
            <MessageCircle size={19} className={activeTab === 'matches' ? 'fill-[#FF4A70]/20' : ''} />
            <span className="text-[10px] mt-0.5">Matches</span>
          </button>

          {/* 3. Link Up */}
          <button
            type="button"
            onClick={() => setActiveTab('linkup')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'linkup' 
                ? 'text-[#F39C24] font-bold' 
                : 'text-[#A898A0] hover:text-white'
            }`}
          >
            <Zap size={19} className={activeTab === 'linkup' ? 'fill-[#F39C24]/20' : ''} />
            <span className="text-[10px] mt-0.5">Link Up</span>
          </button>

          {/* 4. Talk */}
          <button
            type="button"
            onClick={() => setActiveTab('talk')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'talk' 
                ? 'text-[#FF4A70] font-bold' 
                : 'text-[#A898A0] hover:text-white'
            }`}
          >
            <HeartHandshake size={19} />
            <span className="text-[10px] mt-0.5">Talk</span>
          </button>

          {/* 5. Events */}
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'events' 
                ? 'text-[#FF4A70] font-bold' 
                : 'text-[#A898A0] hover:text-white'
            }`}
          >
            <Calendar size={19} />
            <span className="text-[10px] mt-0.5">Events</span>
          </button>

          {/* 6. Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'profile' 
                ? 'text-[#FF4A70] font-bold' 
                : 'text-[#A898A0] hover:text-white'
            }`}
          >
            <User size={19} />
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
          setIsReferralPromoOpen(true);
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

      {/* 7. First-Time Login Referral & Free Premium VIP Modal */}
      <ReferralPromoModal
        isOpen={isReferralPromoOpen}
        currentUser={currentUser}
        onClose={handleCloseReferralPromo}
        onNavigateToProfile={() => {
          handleCloseReferralPromo();
          setActiveTab('profile');
        }}
      />
    </div>
  );
}
