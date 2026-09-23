import React, { useState, useEffect } from 'react';
import { InAppNotification } from '../types';
import { notificationService, NotificationSettings } from '../utils/notificationService';
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  Zap, 
  Calendar, 
  X, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Sparkles, 
  Volume2, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  ChevronRight,
  HeartHandshake,
  Mic,
  ArrowUpRight
} from 'lucide-react';

interface NotificationsModalProps {
  notifications: InAppNotification[];
  onClose: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notif: InAppNotification) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onClearAll,
  onSelectNotification
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [isIframe, setIsIframe] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    setPermission(notificationService.getPermission());
    setIsIframe(notificationService.isInsideIframe());
  }, []);

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
  };

  const handleTriggerTest = () => {
    setTestCountdown(5);
    notificationService.scheduleTestNotification(5);

    const interval = setInterval(() => {
      setTestCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const updated = notificationService.saveSettings({ [key]: !settings[key] });
    setSettings(updated);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Heart size={15} className="text-rose-400 fill-rose-400/20" />;
      case 'message':
        return <MessageSquare size={15} className="text-blue-400" />;
      case 'voice_requirement':
        return <Mic size={15} className="text-amber-400" />;
      case 'spark_gift':
      case 'spark_received':
        return <Zap size={15} className="text-amber-400 fill-amber-400/20" />;
      case 'talk_reply':
        return <HeartHandshake size={15} className="text-emerald-400" />;
      case 'linkup_reply':
        return <Zap size={15} className="text-amber-400" />;
      case 'event_join':
        return <Calendar size={15} className="text-purple-400" />;
      case 'premium_unlocked':
        return <Sparkles size={15} className="text-amber-400" />;
      default:
        return <Bell size={15} className="text-rose-400" />;
    }
  };

  const getDestinationLabel = (type: string, relatedId?: string) => {
    switch (type) {
      case 'match':
      case 'message':
      case 'voice_requirement':
        return { label: 'Open Chat', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'spark_received':
      case 'spark_gift':
      case 'withdrawal_status':
        return { label: 'Wallet', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'talk_reply':
        return { label: 'Talk Forum', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'event_join':
        return { label: 'Event Chat', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'linkup_reply':
        return { label: 'Link Up', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'premium_unlocked':
        return { label: 'Profile Perks', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      default:
        if (relatedId?.startsWith('evt_')) return { label: 'Event', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
        if (relatedId?.startsWith('talk_')) return { label: 'Talk', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
        if (relatedId?.startsWith('match_') || relatedId?.startsWith('usr_')) return { label: 'Chat', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
        if (relatedId?.startsWith('tx_') || relatedId?.startsWith('SPK')) return { label: 'Wallet', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
        return { label: 'View', color: 'text-neutral-400 bg-neutral-800 border-neutral-700' };
    }
  };

  const handleCardClick = (notif: InAppNotification) => {
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF4F0] border border-[#E5D7CE] flex items-center justify-center text-[#FF4A70]">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D151E]">Notifications</h3>
              <p className="text-[10px] text-[#8A767E]">In-app & out-of-app alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                showSettings 
                  ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white border-transparent shadow-xs' 
                  : 'bg-[#FAF4F0] text-[#8A767E] hover:text-[#2D151E] border-[#E5D7CE]'
              }`}
            >
              {showSettings ? 'View List' : 'OS Settings'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-[#8A767E] hover:text-[#2D151E] p-1 rounded-full hover:bg-[#FAF4F0] transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* OUT-OF-APP SYSTEM NOTIFICATIONS CARD */}
        <div className="bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-[#FF4A70]" />
              <span className="text-xs font-bold text-[#2D151E]">Out-of-App OS Alerts</span>
            </div>
            {permission === 'granted' ? (
              <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={11} />
                <span>Active</span>
              </span>
            ) : permission === 'denied' ? (
              <span className="text-[10px] font-bold bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle size={11} />
                <span>Blocked</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                Not Enabled
              </span>
            )}
          </div>

          <p className="text-[11px] text-[#8A767E] leading-relaxed">
            Get instant lock screen and banner notifications when someone matches with you, sends a voice message, or sends Sparks—even when your browser is minimized or in another tab.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {permission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="py-1.5 px-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Bell size={13} />
                <span>Enable Out-of-App Alerts</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTriggerTest}
                disabled={testCountdown !== null}
                className="py-1.5 px-3 rounded-full bg-white hover:bg-[#F2E7DF] text-[#2D151E] font-semibold text-xs border border-[#E5D7CE] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Clock size={13} className="text-[#FF4A70]" />
                <span>
                  {testCountdown !== null 
                    ? `Switch tabs! Alert in ${testCountdown}s...` 
                    : 'Test Out-of-App Alert (5s)'}
                </span>
              </button>
            )}

            {isIframe && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 rounded-full bg-white hover:bg-[#F2E7DF] text-[#2D151E] font-medium text-xs border border-[#E5D7CE] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Open in new browser tab for full native OS notification privileges"
              >
                <span>Open in Tab</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* NOTIFICATION SETTINGS VIEW */}
        {showSettings ? (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="text-[11px] font-bold text-[#8A767E] uppercase tracking-wider">
              Notification Preferences
            </div>

            <div className="bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl p-3 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[#2D151E]">System Alerts Master Toggle</div>
                  <div className="text-[10px] text-[#8A767E]">Receive alerts outside the app</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={() => handleToggleSetting('enabled')}
                  className="w-4 h-4 accent-[#FF4A70] rounded cursor-pointer"
                />
              </label>

              <div className="border-t border-[#E5D7CE] pt-2 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-[#2D151E]">New Mutual Matches</span>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnMatches}
                    onChange={() => handleToggleSetting('notifyOnMatches')}
                    className="w-4 h-4 accent-[#FF4A70] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-[#2D151E]">Voice Chat Messages</span>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnMessages}
                    onChange={() => handleToggleSetting('notifyOnMessages')}
                    className="w-4 h-4 accent-[#FF4A70] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-[#2D151E]">Spark Gifts & Digital Wallet</span>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnGifts}
                    onChange={() => handleToggleSetting('notifyOnGifts')}
                    className="w-4 h-4 accent-[#FF4A70] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs text-[#2D151E]">Background Activity Alerts</div>
                    <div className="text-[10px] text-[#8A767E]">Alerts when you minimize the tab</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.backgroundSimulation}
                    onChange={() => handleToggleSetting('backgroundSimulation')}
                    className="w-4 h-4 accent-[#FF4A70] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl p-3 text-[11px] text-[#8A767E] space-y-1">
              <p className="font-semibold text-[#2D151E]">📱 Mobile & Desktop Compatibility:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-[#8A767E]">
                <li><strong>Desktop (Chrome, Safari, Edge, Firefox):</strong> Native OS push banners when tab is minimized or in background.</li>
                <li><strong>Android (Chrome):</strong> Full lock screen, sound, and notification tray alerts.</li>
                <li><strong>iPhone / iPad (iOS 16.4+):</strong> Tap Share &gt; "Add to Home Screen" to receive Web Push alerts like a native app.</li>
              </ul>
            </div>
          </div>
        ) : (
          /* NOTIFICATIONS LIST */
          <div className="flex-1 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[#8A767E] uppercase tracking-wider">
                Recent In-App Activity
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[11px] text-[#8A767E] hover:text-[#2D151E] cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8A767E]">
                No new notifications.
              </div>
            ) : (
              notifications.map(notif => {
                const dest = getDestinationLabel(notif.type, notif.relatedId);
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleCardClick(notif)}
                    className={`w-full text-left bg-white border p-3 rounded-2xl flex items-start gap-3 transition cursor-pointer active:scale-[0.98] ${
                      !notif.read 
                        ? 'border-[#FF4A70]/30 shadow-xs' 
                        : 'border-[#EFE3DB] hover:border-[#E5D7CE]'
                    }`}
                  >
                    <div className="relative w-8 h-8 rounded-xl bg-[#FAF4F0] flex items-center justify-center shrink-0 border border-[#E5D7CE] mt-0.5">
                      {getIcon(notif.type)}
                      {!notif.read && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF4A70] ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <h4 className="text-xs font-bold text-[#2D151E] truncate">{notif.title}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 flex items-center gap-0.5 ${dest.color}`}>
                          <span>{dest.label}</span>
                          <ArrowUpRight size={9} />
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C454F] leading-normal line-clamp-2">{notif.message}</p>
                      <div className="flex items-center justify-between mt-1 pt-0.5 text-[9px] text-[#8A767E]">
                        <span>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[#FF4A70] font-semibold flex items-center gap-0.5">
                          Tap to view <ChevronRight size={10} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
