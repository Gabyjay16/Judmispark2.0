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
  ChevronDown,
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
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

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
  }, []);

  const handleSwitchUser = (selectedUser: UserProfile) => {
    storage.setCurrentUser(selectedUser);
    setCurrentUser(selectedUser);
    setIsUserSwitcherOpen(false);
    refreshData();
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

  const allAvailableUsers = storage.getUsers();

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
            {/* User Switcher Dropdown (Essential for testing multi-user match/chat/voice flows!) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
                className="py-1 px-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-xs flex items-center gap-1.5 transition"
                title="Switch test account"
              >
                <img 
                  src={currentUser.profilePicture} 
                  alt={currentUser.displayName} 
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-neutral-200 hidden sm:inline max-w-[70px] truncate">
                  {currentUser.displayName}
                </span>
                <ChevronDown size={12} className="text-neutral-400" />
              </button>

              {/* User switcher popup */}
              {isUserSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
                    Switch Test Account:
                  </div>
                  <div className="space-y-1">
                    {allAvailableUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full p-1.5 rounded-xl flex items-center gap-2 text-left text-xs transition ${
                          u.id === currentUser.id 
                            ? 'bg-rose-500/20 text-rose-300 font-bold' 
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <img src={u.profilePicture} alt={u.displayName} className="w-6 h-6 rounded-full object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{u.displayName} ({u.role})</div>
                          <div className="text-[10px] text-neutral-500 truncate">{u.town}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-neutral-800 mt-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserSwitcherOpen(false);
                        setIsRegistrationOpen(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-[11px] text-center transition"
                    >
                      + Register New User with Voice
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spark Wallet Pill */}
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className="py-1 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-1 transition"
              title="Spark Wallet Balance"
            >
              <Zap size={13} className="fill-amber-400 text-amber-400" />
              <span>{balance} SPK</span>
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition"
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Admin Console Switcher */}
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'admin' ? 'discover' : 'admin')}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700'
                }`}
                title="Admin Console"
              >
                <ShieldAlert size={15} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT ROUTE */}
      <main className="flex-1 flex flex-col">
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
            onOpenPrivateTalkChat={(targetUserId, initialMsg) => handleStartChatWithUser(targetUserId, initialMsg)}
            onReportContent={(type, id, name) => {
              alert(`Report received for "${name}". The moderation team will review it.`);
            }}
          />
        )}

        {activeTab === 'events' && (
          <EventsView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletView
            currentUser={currentUser}
            onRefreshUser={refreshData}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onRefreshUser={refreshData}
            onLogout={() => setIsRegistrationOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            currentUser={currentUser}
            onExitAdmin={() => setActiveTab('discover')}
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

          {/* 6. Wallet */}
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'wallet' 
                ? 'text-amber-400 font-bold scale-105' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wallet size={20} />
            <span className="text-[10px] mt-0.5">Wallet</span>
          </button>

          {/* 7. Profile */}
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
        />
      )}
    </div>
  );
}
