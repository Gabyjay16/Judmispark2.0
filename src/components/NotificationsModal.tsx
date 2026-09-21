import React from 'react';
import { InAppNotification } from '../types';
import { storage } from '../utils/storage';
import { Bell, Heart, MessageSquare, Zap, Calendar, X, Check } from 'lucide-react';

interface NotificationsModalProps {
  notifications: InAppNotification[];
  onClose: () => void;
  onClearAll: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onClearAll
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Heart size={15} className="text-rose-400 fill-rose-400/20" />;
      case 'message':
        return <MessageSquare size={15} className="text-blue-400" />;
      case 'spark_gift':
        return <Zap size={15} className="text-amber-400 fill-amber-400/20" />;
      case 'event_join':
        return <Calendar size={15} className="text-emerald-400" />;
      default:
        return <Bell size={15} className="text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-rose-400" />
            <h3 className="text-sm font-bold text-white">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] text-neutral-400 hover:text-white"
              >
                Clear All
              </button>
            )}
            <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white text-xs">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No new notifications.
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-2xl flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-800">
                  {getIcon(notif.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                  <p className="text-[11px] text-neutral-300 mt-0.5 leading-normal">{notif.message}</p>
                  <span className="text-[9px] text-neutral-500 block mt-1">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
