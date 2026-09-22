import React, { useState } from 'react';
import { 
  UserProfile, 
  Advertisement, 
  ModerationReport, 
  WalletTransaction, 
  AdminAuditLog 
} from '../types';
import { storage } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import { 
  ShieldAlert, 
  Users, 
  Megaphone, 
  CreditCard, 
  FileText, 
  Ban, 
  Plus
} from 'lucide-react';

interface AdminViewProps {
  currentUser: UserProfile;
  onExitAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, onExitAdmin }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'voice_reports' | 'ads' | 'finance' | 'audit'>('users');
  const [users, setUsers] = useState<UserProfile[]>(storage.getUsers());
  const [reports, setReports] = useState<ModerationReport[]>(storage.getReports());
  const [ads, setAds] = useState<Advertisement[]>(storage.getAds());
  const [transactions, setTransactions] = useState<WalletTransaction[]>(storage.getTransactions());
  const [logs, setLogs] = useState<AdminAuditLog[]>(storage.getAuditLogs());

  // New Ad Form State
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&auto=format&fit=crop&q=80',
    ctaButtonText: 'Learn More',
    destinationUrl: 'https://judmispark.cm',
    advertiserName: 'Local Sponsor',
    targetTowns: ['Bamenda', 'Douala'] as string[]
  });

  const refreshAll = () => {
    setUsers(storage.getUsers());
    setReports(storage.getReports());
    setAds(storage.getAds());
    setTransactions(storage.getTransactions());
    setLogs(storage.getAuditLogs());
  };

  const handleToggleUserStatus = (user: UserProfile) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const updated = { ...user, status: newStatus as any };
    storage.updateUser(updated);

    storage.addAuditLog({
      id: `log_${Date.now()}`,
      action: newStatus === 'banned' ? 'USER_BAN' : 'USER_UNBAN',
      adminId: currentUser.id,
      adminName: currentUser.displayName,
      targetType: 'user',
      targetId: user.id,
      reason: `Admin changed status of ${user.displayName} to ${newStatus}`,
      createdAt: new Date().toISOString()
    });

    refreshAll();
  };

  const handleResolveReport = (report: ModerationReport, action: 'resolved_ban' | 'dismissed') => {
    const updatedReports = reports.map(r => {
      if (r.id === report.id) {
        return {
          ...r,
          status: 'resolved' as const,
          outcome: action === 'resolved_ban' ? ('Account ban' as const) : ('No violation' as const),
          adminNotes: `Admin ${currentUser.displayName} chose: ${action}`,
          reviewedBy: currentUser.displayName,
          resolvedAt: new Date().toISOString()
        };
      }
      return r;
    });

    storage.setReports(updatedReports);

    if (action === 'resolved_ban') {
      const targetUser = users.find(u => u.id === report.targetUserId);
      if (targetUser) {
        handleToggleUserStatus(targetUser);
      }
    }

    storage.addAuditLog({
      id: `log_${Date.now()}`,
      action: 'MODERATION_ACTION',
      adminId: currentUser.id,
      adminName: currentUser.displayName,
      targetType: 'report',
      targetId: report.targetUserId,
      reason: `Resolved report ${report.id} as ${action}`,
      createdAt: new Date().toISOString()
    });

    refreshAll();
  };

  const handleApproveWithdrawal = (tx: WalletTransaction) => {
    const all = storage.getTransactions();
    const updated = all.map(t => {
      if (t.id === tx.id) {
        return { ...t, status: 'COMPLETED' as const };
      }
      return t;
    });

    storage.setTransactions(updated);

    storage.addAuditLog({
      id: `log_${Date.now()}`,
      action: 'WITHDRAWAL_APPROVE',
      adminId: currentUser.id,
      adminName: currentUser.displayName,
      targetType: 'transaction',
      targetId: tx.userId,
      reason: `Approved cashout of ${tx.sparks} Sparks (${tx.cfaAmount} CFA)`,
      createdAt: new Date().toISOString()
    });

    refreshAll();
  };

  const handleToggleAd = (ad: Advertisement) => {
    const updated = ads.map(a => {
      if (a.id === ad.id) {
        return { ...a, active: !a.active };
      }
      return a;
    });
    storage.setAds(updated);
    refreshAll();
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title.trim()) return;

    const ad: Advertisement = {
      id: `ad_${Date.now()}`,
      title: newAd.title.trim(),
      description: newAd.description.trim(),
      imageUrl: newAd.imageUrl,
      ctaButtonText: newAd.ctaButtonText || 'Learn More',
      destinationUrl: newAd.destinationUrl,
      advertiserName: newAd.advertiserName,
      targetTowns: newAd.targetTowns as any,
      minAge: 18,
      maxAge: 70,
      gender: 'all',
      active: true,
      frequency: 3,
      impressions: 0,
      clicks: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };

    storage.setAds([ad, ...ads]);
    setIsCreatingAd(false);
    refreshAll();
  };

  return (
    <div id="admin-dashboard-view" className="max-w-4xl mx-auto w-full px-4 py-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">JudmiSpark Control Console</h2>
              <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                Admin
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Admin: <span className="text-rose-400 font-mono font-medium">{currentUser.email || currentUser.displayName}</span> • Secure Moderation & Controls
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExitAdmin}
          className="py-1.5 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5"
        >
          <span>← Back to Profile</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'users' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users size={14} />
          <span className="hidden sm:inline">Users ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voice_reports')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'voice_reports' ? 'bg-neutral-800 text-rose-400 shadow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShieldAlert size={14} />
          <span className="hidden sm:inline">Voice Reports ({reports.filter(r => r.status === 'pending').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'ads' ? 'bg-neutral-800 text-amber-400 shadow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Megaphone size={14} />
          <span className="hidden sm:inline">Ads & Sponsors ({ads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'finance' ? 'bg-neutral-800 text-emerald-400 shadow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <CreditCard size={14} />
          <span className="hidden sm:inline">Finances</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-neutral-800 text-blue-400 shadow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileText size={14} />
          <span className="hidden sm:inline">Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Registered platform members</span>
            <span>Total: {users.length}</span>
          </div>

          <div className="space-y-2">
            {users.map(u => {
              const uBalance = storage.calculateSparkBalance(u.id);
              return (
                <div key={u.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={u.profilePicture} 
                        alt={u.displayName} 
                        className="w-11 h-11 rounded-2xl object-cover border border-neutral-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{u.fullName} ({u.displayName})</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'banned' ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            {u.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          📞 {u.phoneNumber} • 📍 {u.town} • Age {u.age} • Wallet: <span className="text-amber-400 font-mono">{u.walletId}</span> ({uBalance} SPK)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(u)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        u.status === 'banned'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <Ban size={12} />
                      <span>{u.status === 'banned' ? 'Unban User' : 'Ban User'}</span>
                    </button>
                  </div>

                  {/* Audio Player for Admin Inspection */}
                  <div className="pt-2 border-t border-neutral-800/80">
                    <span className="text-[10px] font-semibold text-neutral-400 block mb-1">
                      Permanent Registration Voice Introduction:
                    </span>
                    <AudioPlayer
                      audioUrl={u.registrationVoiceUrl}
                      duration={u.registrationVoiceDuration || 4}
                      userName={u.displayName}
                      isRegistrationVoice={true}
                      seed={u.id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: VOICE IDENTITY REPORTS */}
      {activeTab === 'voice_reports' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Voice identity comparison moderation cases</span>
            <span>Pending: {reports.filter(r => r.status === 'pending').length}</span>
          </div>

          <div className="space-y-3">
            {reports.map(report => {
              const reporter = users.find(u => u.id === report.reporterId);
              const reported = users.find(u => u.id === report.targetUserId);

              return (
                <div key={report.id} className="bg-neutral-900 border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        {report.category}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">
                        Report against {reported?.displayName || report.targetUserName}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Filed by: {reporter?.displayName || report.reporterName} • Reason: "{report.reason}"
                      </p>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                      report.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  {/* Dual Voice Comparison: Registration Voice vs Conversation Voice */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                    <div>
                      <span className="text-[11px] font-bold text-neutral-300 block mb-1">
                        1. Permanent Registration Voice:
                      </span>
                      <AudioPlayer
                        audioUrl={report.registrationVoiceUrl || ''}
                        duration={4}
                        userName={reported?.displayName || 'Registered Voice'}
                        isRegistrationVoice={true}
                        seed={report.id + '_reg'}
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-neutral-300 block mb-1">
                        2. Chat Voice Note In Question:
                      </span>
                      <AudioPlayer
                        audioUrl={report.conversationVoiceUrl || ''}
                        duration={5}
                        userName="Chat Note"
                        seed={report.id + '_chat'}
                      />
                    </div>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={() => handleResolveReport(report, 'dismissed')}
                        className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
                      >
                        Dismiss (Voices Match)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveReport(report, 'resolved_ban')}
                        className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
                      >
                        Ban Impersonator
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ADS & SPONSORS */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Discover feed injected advertisements</span>
            <button
              type="button"
              onClick={() => setIsCreatingAd(true)}
              className="py-1.5 px-3 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Create Ad</span>
            </button>
          </div>

          {isCreatingAd && (
            <form onSubmit={handleCreateAd} className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl space-y-3">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <h4 className="text-xs font-bold text-white">Create New Advertisement</h4>
                <button type="button" onClick={() => setIsCreatingAd(false)} className="text-xs text-neutral-400">Cancel</button>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Ad Title</label>
                <input
                  type="text"
                  required
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  placeholder="e.g. Star Lounge VIP Night"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Advertiser Name</label>
                  <input
                    type="text"
                    value={newAd.advertiserName}
                    onChange={(e) => setNewAd({ ...newAd, advertiserName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={newAd.ctaButtonText}
                    onChange={(e) => setNewAd({ ...newAd, ctaButtonText: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl"
              >
                Save & Launch Ad
              </button>
            </form>
          )}

          <div className="space-y-3">
            {ads.map(ad => {
              const ctr = ad.impressions > 0 
                ? ((ad.clicks / ad.impressions) * 100).toFixed(1) 
                : '0.0';

              return (
                <div key={ad.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={ad.imageUrl} alt={ad.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{ad.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          ad.active ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {ad.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">{ad.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1">
                        <span>👁️ {ad.impressions} views</span>
                        <span>🖱️ {ad.clicks} clicks</span>
                        <span className="text-amber-400 font-semibold">CTR: {ctr}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAd(ad)}
                    className="py-1 px-3 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium border border-neutral-700"
                  >
                    {ad.active ? 'Pause' : 'Activate'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FINANCES & WITHDRAWAL APPROVALS */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Mobile Money cashout requests & financial ledger</span>
            <span>Total Transactions: {transactions.length}</span>
          </div>

          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">{tx.note || `${tx.transactionType} Transaction`}</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    User: {tx.userId} • Ref: {tx.reference} • {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-400 block">{tx.sparks} SPK</span>
                    <span className="text-[10px] text-neutral-400">{tx.cfaAmount.toLocaleString()} CFA</span>
                  </div>

                  {tx.transactionType === 'WITHDRAWAL' && tx.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => handleApproveWithdrawal(tx)}
                      className="py-1 px-2.5 rounded-lg bg-emerald-500 text-white font-bold text-[11px] shadow"
                    >
                      Approve Payout
                    </button>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tx.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {tx.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>System audit trail & administrative events</span>
            <span>Records: {logs.length}</span>
          </div>

          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono text-amber-400 font-bold mr-2">[{log.action}]</span>
                  <span className="text-neutral-200">{log.reason}</span>
                </div>
                <span className="text-[10px] text-neutral-500 shrink-0 ml-3">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
