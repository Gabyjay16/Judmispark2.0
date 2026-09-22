import { storage } from './storage';

export interface NotificationSettings {
  enabled: boolean;
  notifyOnMatches: boolean;
  notifyOnMessages: boolean;
  notifyOnGifts: boolean;
  notifyOnReferrals: boolean;
  backgroundSimulation: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  notifyOnMatches: true,
  notifyOnMessages: true,
  notifyOnGifts: true,
  notifyOnReferrals: true,
  backgroundSimulation: true,
};

const NOTIF_SETTINGS_KEY = 'judmispark_notif_settings';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private backgroundTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  // Initialize service worker & background listeners
  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
        console.log('[NotificationService] Service Worker registered with scope:', reg.scope);
      } catch (err) {
        console.warn('[NotificationService] Service Worker registration failed (likely iframe sandbox):', err);
      }
    }

    // Set up tab visibility / out-of-app background simulation
    this.setupVisibilityListener();

    // Listen to in-app notifications and broadcast out-of-app system alerts
    storage.onNotificationAdded((notif) => {
      const settings = this.getSettings();
      if (!settings.enabled) return;
      if (notif.type === 'match' && !settings.notifyOnMatches) return;
      if (notif.type === 'message' && !settings.notifyOnMessages) return;
      if (notif.type === 'spark_received' && !settings.notifyOnGifts) return;
      if (notif.type === 'premium_unlocked' && !settings.notifyOnReferrals) return;

      this.sendSystemNotification(notif.title, notif.message, { tag: notif.id });
    });
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window;
  }

  public isInsideIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public getSettings(): NotificationSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(NOTIF_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error reading notification settings', e);
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: Partial<NotificationSettings>): NotificationSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving notification settings', e);
    }
    return updated;
  }

  // Request native browser permission
  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.sendSystemNotification(
          '🔔 Notifications Activated!',
          'You will now receive alerts for new matches, voice messages, and gifts even when out of the app.',
          { tag: 'welcome-notification' }
        );
      }
      return permission;
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return 'denied';
    }
  }

  // Core trigger for Out-Of-App / System OS Notification
  public async sendSystemNotification(
    title: string,
    body: string,
    options: {
      tag?: string;
      icon?: string;
      data?: Record<string, unknown>;
      force?: boolean;
    } = {}
  ): Promise<boolean> {
    if (!this.isSupported()) return false;

    const settings = this.getSettings();
    if (!settings.enabled && !options.force) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const notifOptions: NotificationOptions = {
      body,
      icon: options.icon || '/icon.svg',
      badge: '/icon.svg',
      tag: options.tag || `judmispark-${Date.now()}`,
      data: options.data || { url: '/' },
      ...((('vibrate' in Notification.prototype) ? { vibrate: [200, 100, 200] } : {}) as Record<string, unknown>)
    };

    // 1. Try Service Worker registration first (standard for PWA & background tabs)
    try {
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, notifOptions);
        return true;
      }
      if ('serviceWorker' in navigator) {
        const readyReg = await navigator.serviceWorker.ready;
        if (readyReg && readyReg.showNotification) {
          await readyReg.showNotification(title, notifOptions);
          return true;
        }
      }
    } catch (swErr) {
      console.warn('Service worker notification failed, falling back to Notification constructor:', swErr);
    }

    // 2. Fallback to standard Notification constructor
    try {
      const notif = new Notification(title, notifOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Notification constructor failed (e.g. mobile Safari requires ServiceWorker):', err);
      return false;
    }
  }

  // Schedules a test notification after a delay so the user can minimize / switch tabs
  public scheduleTestNotification(delaySeconds: number = 5): void {
    setTimeout(() => {
      this.sendSystemNotification(
        '🔥 Test Out-of-App Notification',
        'Success! JudmiSpark can reach you on your phone or desktop even when you are on another tab or app.',
        { tag: 'test-notification', force: true }
      );

      // Also record into in-app storage
      const curr = storage.getCurrentUser();
      storage.addNotification({
        id: `notif_test_${Date.now()}`,
        userId: curr.id,
        title: '🔔 System Notification Test Fired',
        message: 'Your device successfully received an out-of-app notification.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString()
      });
    }, delaySeconds * 1000);
  }

  // Background monitor: When user leaves the app/tab, simulate realistic incoming engagement
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User just left the app / switched tabs or minimized!
        const settings = this.getSettings();
        if (!settings.backgroundSimulation) return;

        // Schedule an alert after 18 seconds of being away to demonstrate out-of-app notifications
        if (this.backgroundTimer) clearTimeout(this.backgroundTimer);

        this.backgroundTimer = setTimeout(() => {
          // Double check user is still out of the app
          if (!document.hidden) return;

          const currUser = storage.getCurrentUser();
          const candidateNames = ['Sophie M.', 'Diane B.', 'Vanessa N.', 'Aicha K.', 'Patrick E.'];
          const randomName = candidateNames[Math.floor(Math.random() * candidateNames.length)];
          const sampleAlerts = [
            {
              title: `💬 New Voice Message from ${randomName}`,
              body: `${randomName} sent you a 15s voice note in Douala: "Hey, loved your voice prompt!"`,
              type: 'message' as const
            },
            {
              title: `✨ New Match on JudmiSpark!`,
              body: `${randomName} liked your profile. You two are now connected!`,
              type: 'match' as const
            },
            {
              title: `⚡ Spark Gift Received!`,
              body: `${randomName} sent you 2 Sparks (1,000 CFA value) as a gift!`,
              type: 'spark_received' as const
            }
          ];

          const picked = sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)];

          // 1. Add to persistent storage
          storage.addNotification({
            id: `notif_bg_${Date.now()}`,
            userId: currUser.id,
            title: picked.title,
            message: picked.body,
            type: picked.type,
            read: false,
            createdAt: new Date().toISOString()
          });

          // 2. Deliver native OS notification outside of the app!
          this.sendSystemNotification(picked.title, picked.body, {
            tag: `bg-alert-${Date.now()}`
          });
        }, 18000); // 18 seconds after minimizing
      } else {
        // User came back into app!
        if (this.backgroundTimer) {
          clearTimeout(this.backgroundTimer);
          this.backgroundTimer = null;
        }
      }
    });
  }
}

export const notificationService = new NotificationService();
