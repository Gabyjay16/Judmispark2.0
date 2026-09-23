import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Advertisement, 
  ModerationReport, 
  WalletTransaction, 
  AdminAuditLog,
  PaymentInfoConfig
} from '../types';
import { storage, playChimeSound, triggerBrowserNotification } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import { 
  ShieldAlert, 
  Users, 
  Megaphone, 
  CreditCard, 
  FileText, 
  Ban, 
  Plus,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Bell,
  Smartphone,
  Save,
  Check,
  X,
  ExternalLink,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

interface AdminViewProps {
  currentUser: UserProfile;
  onExitAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, onExitAdmin }) => {
  const isSuperAdmin = currentUser.role === 'admin' || currentUser.email === 'gabyjay16@gmail.com';
  const canApprove = storage.canUserApproveWallets(currentUser);

  const [activeTab, setActiveTab] = useState<'finance' | 'users' | 'voice_reports' | 'ads' | 'audit'>('finance');
  const [financeSubTab, setFinanceSubTab] = useState<'topups' | 'withdrawals' | 'payment_info' | 'ledger'>('topups');

  const [users, setUsers] = useState<UserProfile[]>(storage.getUsers());
  const [reports, setReports] = useState<ModerationReport[]>(storage.getReports());
  const [ads, setAds] = useState<Advertisement[]>(storage.getAds());
  const [transactions, setTransactions] = useState<WalletTransaction[]>(storage.getTransactions());
  const [logs, setLogs] = useState<AdminAuditLog[]>(storage.getAuditLogs());

  // Payment Info Form State
  const [paymentInfo, setPaymentInfoState] = useState<PaymentInfoConfig>(storage.getPaymentInfo());
  const [paymentSavedMsg, setPaymentSavedMsg] = useState(false);

  // Screenshot Preview Modal
  const [selectedScreenshot, setSelectedScreenshot] = useState<{ url: string; tx: WalletTransaction } | null>(null);

  // Rejection Dialog State
  const [rejectingTx, setRejectingTx] = useState<{ tx: WalletTransaction; reason: string } | null>(null);

  // Browser notification permission state
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // New Ad Form State
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&auto=format&fit=crop&q=80',
    ctaButtonText: 'Learn More',
    destinationUrl: 'https://judmispark.com',
    advertiserName: 'Local Sponsor',
    targetTowns: ['Bamenda', 'Douala'] as string[]
  });

  const refreshAll = () => {
    setUsers(storage.getUsers());
    setReports(storage.getReports());
    setAds(storage.getAds());
    setTransactions(storage.getTransactions());
    setLogs(storage.getAuditLogs());
    setPaymentInfoState(storage.getPaymentInfo());
  };

  useEffect(() => {
    refreshAll();
    const unsub = storage.onNotificationAdded(() => {
      refreshAll();
    });
    return () => unsub();
  }, []);

  // Request browser desktop notification permission
  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      triggerBrowserNotification(
        '🔔 JudmiSpark Notifications Active',
        'You will now receive desktop alerts for top-up screenshots & cashout requests even when on another tab!'
      );
    }
  };

  const handleTestAlert = () => {
    playChimeSound();
    triggerBrowserNotification(
      '⚡ JudmiSpark Admin Alert Test',
      'This sound and browser alert will trigger automatically whenever a user submits a top-up receipt or withdrawal!'
    );
  };

  // Save Admin Payment Info
  const handleSavePaymentInfo = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setPaymentInfo(paymentInfo);
    storage.addAuditLog({
      id: `log_pay_update_${Date.now()}`,
      action: 'UPDATE_PAYMENT_INFO',
      adminId: currentUser.id,
      adminName: currentUser.displayName,
      targetType: 'system',
      targetId: 'payment_config',
      reason: `Admin ${currentUser.displayName} updated Mobile Money payment instructions & phone numbers.`,
      createdAt: new Date().toISOString()
    });

    setPaymentSavedMsg(true);
    refreshAll();
    setTimeout(() => setPaymentSavedMsg(false), 3000);
  };

  // Grant or Revoke Wallet Approver permission
  const handleToggleApprover = (targetUser: UserProfile) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can grant or revoke approval rights.');
      return;
    }

    const granted = storage.toggleWalletApprover(targetUser.id, currentUser);
    refreshAll();
  };

  // Toggle user ban status
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

  // Approve Top-Up Deposit Request
  const handleApproveTopUp = (txId: string) => {
    const res = storage.approveTopUp(txId, currentUser.displayName);
    if (res.success) {
      playChimeSound();
      refreshAll();
    } else {
      alert(res.message);
    }
  };

  // Confirm Reject Top-Up
  const handleConfirmRejectTopUp = () => {
    if (!rejectingTx) return;
    const res = storage.rejectTopUp(rejectingTx.tx.id, currentUser.displayName, rejectingTx.reason);
    setRejectingTx(null);
    refreshAll();
  };

  // Approve Withdrawal
  const handleApproveWithdrawal = (tx: WalletTransaction) => {
    const ref = prompt(`Enter MoMo Transfer Transaction ID / Reference (optional):`, `MOMO-TX-${Date.now().toString().slice(-6)}`);
    const res = storage.approveWithdrawal(tx.id, currentUser.displayName, ref || undefined);
    if (res.success) {
      playChimeSound();
      refreshAll();
    } else {
      alert(res.message);
    }
  };

  // Confirm Reject Withdrawal
  const handleConfirmRejectWithdrawal = () => {
    if (!rejectingTx) return;
    const res = storage.rejectWithdrawal(rejectingTx.tx.id, currentUser.displayName, rejectingTx.reason);
    setRejectingTx(null);
    refreshAll();
  };

  // Resolve moderation report
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

  // Pending items counts
  const pendingTopUps = transactions.filter(t => t.transactionType === 'DEPOSIT' && t.status === 'PENDING');
  const pendingWithdrawals = transactions.filter(t => t.transactionType === 'WITHDRAWAL' && t.status === 'PENDING');

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-4 space-y-4 pb-24">
      {/* Top Banner & Notification Bar */}
      <div className="bg-white border border-[#EFE3DB] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF4F0] text-[#FF4A70] border border-[#E5D7CE] flex items-center justify-center font-black text-lg shrink-0">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#2D151E]">
                JudmiSpark Admin & Finance Hub
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/20">
                {isSuperAdmin ? 'Super Admin' : 'Wallet Approver'}
              </span>
            </div>
            <p className="text-xs text-[#8A767E] mt-0.5">
              Logged in as <strong className="text-[#2D151E]">{currentUser.displayName}</strong> ({currentUser.email || currentUser.phoneNumber})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Desktop notification permissions toggle */}
          {notifPermission === 'granted' ? (
            <button
              type="button"
              onClick={handleTestAlert}
              className="py-1.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Test chime and browser pop-up"
            >
              <Bell size={13} className="text-emerald-600" />
              <span>Browser Alerts Active (Test)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRequestNotificationPermission}
              className="py-1.5 px-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-rose-500/20"
              title="Enable desktop notifications for top-ups & cashouts"
            >
              <Bell size={13} />
              <span>Enable Browser Alerts</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitAdmin}
            className="py-1.5 px-3 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] text-xs font-semibold border border-[#E5D7CE] transition cursor-pointer"
          >
            ← Back to App
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-white border border-[#EFE3DB] rounded-2xl text-xs font-semibold shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
            activeTab === 'finance' ? 'bg-[#FF4A70] text-white shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <CreditCard size={14} />
          <span>Finances</span>
          {(pendingTopUps.length + pendingWithdrawals.length) > 0 && (
            <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
              activeTab === 'finance' ? 'bg-white text-[#FF4A70]' : 'bg-[#FF4A70] text-white'
            }`}>
              {pendingTopUps.length + pendingWithdrawals.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
            activeTab === 'users' ? 'bg-[#FF4A70] text-white shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <Users size={14} />
          <span>Users & Roles ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voice_reports')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
            activeTab === 'voice_reports' ? 'bg-[#FF4A70] text-white shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <ShieldAlert size={14} />
          <span>Reports ({reports.filter(r => r.status === 'pending').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
            activeTab === 'ads' ? 'bg-[#FF4A70] text-white shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <Megaphone size={14} />
          <span>Ads ({ads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
            activeTab === 'audit' ? 'bg-[#FF4A70] text-white shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'
          }`}
        >
          <FileText size={14} />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB: FINANCES & APPROVAL WORKFLOWS */}
      {/* ============================================================ */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          {/* Sub-tabs for Finance */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#EFE3DB] pb-2">
            <button
              type="button"
              onClick={() => setFinanceSubTab('topups')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeSubTab === 'topups'
                  ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs'
                  : 'bg-white text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
              }`}
            >
              <span>Top-Up Approvals</span>
              {pendingTopUps.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  financeSubTab === 'topups' ? 'bg-white text-[#FF4A70]' : 'bg-[#FF4A70] text-white'
                }`}>
                  {pendingTopUps.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFinanceSubTab('withdrawals')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeSubTab === 'withdrawals'
                  ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs'
                  : 'bg-white text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
              }`}
            >
              <span>Cashout Requests</span>
              {pendingWithdrawals.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  financeSubTab === 'withdrawals' ? 'bg-white text-[#FF4A70]' : 'bg-[#FF4A70] text-white'
                }`}>
                  {pendingWithdrawals.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFinanceSubTab('payment_info')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeSubTab === 'payment_info'
                  ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs'
                  : 'bg-white text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
              }`}
            >
              <Smartphone size={13} />
              <span>Admin MoMo Payment Info</span>
            </button>

            <button
              type="button"
              onClick={() => setFinanceSubTab('ledger')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeSubTab === 'ledger'
                  ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white shadow-xs'
                  : 'bg-white text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE]'
              }`}
            >
              <span>All Ledger Records ({transactions.length})</span>
            </button>
          </div>

          {/* 1. TOP-UP APPROVALS (SCREENSHOTS) */}
          {financeSubTab === 'topups' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8A767E]">
                <span>Review user payment screenshots and approve Spark deposits</span>
                <span className="font-bold text-[#FF4A70]">{pendingTopUps.length} pending top-up requests</span>
              </div>

              {pendingTopUps.length === 0 ? (
                <div className="p-8 bg-white border border-[#EFE3DB] rounded-3xl text-center space-y-2 shadow-2xs">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-sm font-bold text-[#2D151E]">All Top-Ups Caught Up!</p>
                  <p className="text-xs text-[#8A767E] max-w-sm mx-auto">
                    When users make a MoMo deposit and upload their receipt screenshot, it will appear here for verification.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTopUps.map(tx => {
                    const requester = users.find(u => u.id === tx.userId);
                    return (
                      <div 
                        key={tx.id}
                        className="bg-white border border-[#EFE3DB] hover:border-[#E5D7CE] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          {/* Screenshot preview trigger */}
                          {tx.screenshotUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedScreenshot({ url: tx.screenshotUrl!, tx })}
                              className="relative group shrink-0 cursor-pointer"
                              title="Click to view full screenshot"
                            >
                              <img
                                src={tx.screenshotUrl}
                                alt="Payment Proof"
                                className="w-16 h-16 rounded-2xl object-cover border border-[#FF4A70]/40 group-hover:scale-105 transition"
                              />
                              <span className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                                Zoom
                              </span>
                            </button>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-[#FAF4F0] border border-[#E5D7CE] flex items-center justify-center text-[#8A767E] shrink-0">
                              <ImageIcon size={20} />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#2D151E]">
                                {requester?.displayName || requester?.fullName || 'User'} ({tx.userId})
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/20">
                                {tx.provider === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo'}
                              </span>
                            </div>

                            <p className="text-xs text-[#2D151E] mt-1">
                              Sender Phone: <strong className="text-[#FF4A70] font-mono">{tx.providerReference || tx.momoNumber}</strong> • Ref: <span className="font-mono text-[#8A767E]">{tx.reference}</span>
                            </p>

                            <p className="text-[11px] text-[#8A767E] mt-0.5">
                              Submitted {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>

                            {tx.screenshotUrl && (
                              <button
                                type="button"
                                onClick={() => setSelectedScreenshot({ url: tx.screenshotUrl!, tx })}
                                className="text-[11px] text-[#FF4A70] hover:underline font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                              >
                                <ImageIcon size={12} />
                                <span>Inspect Payment Screenshot Proof</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Amount and Action Buttons */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-[#EFE3DB] pt-3 sm:pt-0 gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-base font-black text-[#FF4A70] block">{tx.sparks} SPARKS</span>
                            <span className="text-xs font-bold text-[#2D151E]">{tx.cfaAmount.toLocaleString()} CFA</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRejectingTx({ tx, reason: 'Payment receipt could not be verified on MoMo statement.' })}
                              className="py-1.5 px-3 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition cursor-pointer"
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveTopUp(tx.id)}
                              className="py-1.5 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>Approve & Credit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. WITHDRAWAL CASHOUT APPROVALS */}
          {financeSubTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8A767E]">
                <span>Verify user balance and dispatch cashouts to their Mobile Money number</span>
                <span className="font-bold text-[#FF4A70]">{pendingWithdrawals.length} pending cashout requests</span>
              </div>

              {pendingWithdrawals.length === 0 ? (
                <div className="p-8 bg-white border border-[#EFE3DB] rounded-3xl text-center space-y-2 shadow-2xs">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-sm font-bold text-[#2D151E]">No Pending Withdrawals</p>
                  <p className="text-xs text-[#8A767E] max-w-sm mx-auto">
                    When users request to cash out their Sparks to Mobile Money, their MoMo number and account name will show here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map(tx => {
                    const requester = users.find(u => u.id === tx.userId);
                    return (
                      <div 
                        key={tx.id}
                        className="bg-white border border-[#EFE3DB] hover:border-[#E5D7CE] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center font-bold text-sm shrink-0">
                            💸
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#2D151E]">
                                {requester?.displayName || requester?.fullName || 'User'}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/20">
                                {tx.provider === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo'}
                              </span>
                            </div>

                            <div className="bg-[#FAF4F0] border border-[#EFE3DB] rounded-xl p-2.5 mt-1.5 text-xs space-y-0.5">
                              <p className="text-[#2D151E]">
                                📱 Send to MoMo #: <strong className="text-[#FF4A70] font-mono text-sm">{tx.momoNumber || tx.providerReference}</strong>
                              </p>
                              <p className="text-[#8A767E]">
                                👤 Registered Account Name: <strong className="text-[#2D151E]">{tx.momoAccountName || 'Account Name Unspecified'}</strong>
                              </p>
                            </div>

                            <p className="text-[11px] text-[#8A767E] mt-1">
                              Requested {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Ref: {tx.reference}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-[#EFE3DB] pt-3 sm:pt-0 gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-base font-black text-[#2D151E] block">{tx.cfaAmount.toLocaleString()} CFA</span>
                            <span className="text-xs text-[#8A767E]">({tx.sparks} Sparks deducted)</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRejectingTx({ tx, reason: 'MoMo number or registered account name does not match.' })}
                              className="py-1.5 px-3 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition cursor-pointer"
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveWithdrawal(tx)}
                              className="py-1.5 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>Sent & Approve</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. ADMIN PAYMENT INFO CONFIGURATION */}
          {financeSubTab === 'payment_info' && (
            <form onSubmit={handleSavePaymentInfo} className="bg-white border border-[#EFE3DB] rounded-3xl p-5 space-y-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#2D151E] flex items-center gap-1.5">
                    <Smartphone size={16} className="text-[#FF4A70]" />
                    <span>Configure Platform Payment Information</span>
                  </h3>
                  {paymentSavedMsg && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Check size={12} />
                      <span>Saved Successfully!</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8A767E] mt-1">
                  Users see these phone numbers and instructions on the Top-Up page when transferring money to buy Sparks.
                </p>
              </div>

              {/* MTN Mobile Money Section */}
              <div className="bg-[#FAF4F0] border border-[#EFE3DB] rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                  1. MTN Mobile Money Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#2D151E] font-semibold mb-1">
                      MTN MoMo Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentInfo.mtnMomoNumber}
                      onChange={(e) => setPaymentInfoState({ ...paymentInfo, mtnMomoNumber: e.target.value })}
                      placeholder="e.g. +237 671 234 567"
                      className="w-full bg-white border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#2D151E] font-semibold mb-1">
                      MTN Account Name (Display to users)
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentInfo.mtnMomoName}
                      onChange={(e) => setPaymentInfoState({ ...paymentInfo, mtnMomoName: e.target.value })}
                      placeholder="e.g. JudmiSpark Official (Gabriel N.)"
                      className="w-full bg-white border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                    />
                  </div>
                </div>
              </div>

              {/* Orange Money Section */}
              <div className="bg-[#FAF4F0] border border-[#EFE3DB] rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider block">
                  2. Orange Money Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#2D151E] font-semibold mb-1">
                      Orange Money Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentInfo.orangeMoneyNumber}
                      onChange={(e) => setPaymentInfoState({ ...paymentInfo, orangeMoneyNumber: e.target.value })}
                      placeholder="e.g. +237 690 123 456"
                      className="w-full bg-white border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#2D151E] font-semibold mb-1">
                      Orange Money Account Name
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentInfo.orangeMoneyName}
                      onChange={(e) => setPaymentInfoState({ ...paymentInfo, orangeMoneyName: e.target.value })}
                      placeholder="e.g. JudmiSpark Official"
                      className="w-full bg-white border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                    />
                  </div>
                </div>
              </div>

              {/* Instructions and notes */}
              <div>
                <label className="block text-xs text-[#2D151E] font-semibold mb-1">
                  Payment Instructions Shown to Users
                </label>
                <textarea
                  rows={3}
                  value={paymentInfo.instructionsEn}
                  onChange={(e) => setPaymentInfoState({ ...paymentInfo, instructionsEn: e.target.value })}
                  placeholder="e.g. Send the exact amount via MTN MoMo or Orange Money. Once sent, take a screenshot of the confirmation SMS and upload it below."
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Payment Information</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. ALL TRANSACTIONS LEDGER */}
          {financeSubTab === 'ledger' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8A767E]">
                <span>Complete platform financial transaction records</span>
                <span>Total: {transactions.length}</span>
              </div>

              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-white border border-[#EFE3DB] p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#2D151E]">{tx.note || `${tx.transactionType} Transaction`}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.status === 'COMPLETED' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : tx.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8A767E] mt-0.5">
                        User: {tx.userId} • Ref: {tx.reference} • {new Date(tx.createdAt).toLocaleString()}
                        {tx.reviewedBy && ` • Reviewed by: ${tx.reviewedBy}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-[#FF4A70] block">{tx.sparks} SPK</span>
                        <span className="text-[10px] text-[#8A767E]">{tx.cfaAmount.toLocaleString()} CFA</span>
                      </div>

                      {tx.screenshotUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedScreenshot({ url: tx.screenshotUrl!, tx })}
                          className="p-1.5 rounded-lg bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#FF4A70] border border-[#E5D7CE] transition cursor-pointer"
                          title="View Screenshot"
                        >
                          <ImageIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: USERS & APPROVER ACCESS */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8A767E]">
            <span>Registered platform members & permissions</span>
            <span>Total Users: {users.length}</span>
          </div>

          <div className="space-y-3">
            {users.map(u => {
              const uBalance = storage.calculateSparkBalance(u.id);
              return (
                <div key={u.id} className="bg-white border border-[#EFE3DB] p-4 rounded-3xl space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={u.profilePicture} 
                        alt={u.displayName} 
                        className="w-12 h-12 rounded-2xl object-cover border border-[#E5D7CE] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#2D151E]">{u.fullName} ({u.displayName})</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'banned' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {u.status}
                          </span>
                          {u.role === 'admin' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4A70]/10 text-[#FF4A70] border border-[#FF4A70]/20">
                              Admin
                            </span>
                          )}
                          {u.canApproveWallets && u.role !== 'admin' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Wallet Approver
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8A767E] mt-0.5">
                          ✉️ {u.email || 'No email'} • 📞 {u.phoneNumber} • 📍 {u.town} ({u.nationality}) • Wallet: <span className="text-[#FF4A70] font-mono font-bold">{u.walletId}</span> ({uBalance} SPK)
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE3DB]">
                      {/* Grant/Revoke Wallet Approver Access (Only Super Admin can toggle) */}
                      {isSuperAdmin && u.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleApprover(u)}
                          className={`py-1.5 px-3 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                            u.canApproveWallets 
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] border-[#E5D7CE]'
                          }`}
                          title="Grant or remove rights to view & approve wallet top-ups/cashouts"
                        >
                          {u.canApproveWallets ? <UserCheck size={13} className="text-blue-600" /> : <ShieldCheck size={13} />}
                          <span>{u.canApproveWallets ? 'Approver Granted' : 'Make Approver'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u)}
                        className={`py-1.5 px-3 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          u.status === 'banned'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <Ban size={13} />
                        <span>{u.status === 'banned' ? 'Unban' : 'Ban User'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: VOICE REPORTS */}
      {/* ============================================================ */}
      {activeTab === 'voice_reports' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8A767E]">
            <span>Community moderation voice impersonation tickets</span>
            <span>Pending: {reports.filter(r => r.status === 'pending').length}</span>
          </div>

          <div className="space-y-3">
            {reports.map(report => {
              const targetUser = users.find(u => u.id === report.targetUserId);
              return (
                <div key={report.id} className="bg-white border border-[#EFE3DB] p-4 rounded-3xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#2D151E]">
                        Report against: {targetUser?.displayName || 'Unknown User'}
                      </h4>
                      <p className="text-xs text-[#8A767E]">{report.details}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      report.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#FAF4F0] text-[#8A767E] border border-[#E5D7CE]'
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[11px] font-bold text-[#2D151E] block mb-1">
                        1. Registration Voice Print:
                      </span>
                      <AudioPlayer
                        audioUrl={report.registrationVoiceUrl || ''}
                        duration={report.registrationVoiceDuration || 5}
                        userName="Registration"
                        seed={report.id + '_reg'}
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-[#2D151E] block mb-1">
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
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE3DB]">
                      <button
                        type="button"
                        onClick={() => handleResolveReport(report, 'dismissed')}
                        className="py-1.5 px-3 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] text-xs font-semibold border border-[#E5D7CE] transition cursor-pointer"
                      >
                        Dismiss (Voices Match)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveReport(report, 'resolved_ban')}
                        className="py-1.5 px-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
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

      {/* ============================================================ */}
      {/* TAB: ADS & SPONSORS */}
      {/* ============================================================ */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8A767E]">Discover feed injected advertisements</span>
            <button
              type="button"
              onClick={() => setIsCreatingAd(true)}
              className="py-1.5 px-3.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-md shadow-rose-500/20"
            >
              <Plus size={14} />
              <span>Create Ad</span>
            </button>
          </div>

          {isCreatingAd && (
            <form onSubmit={handleCreateAd} className="bg-white border border-[#EFE3DB] p-4 rounded-3xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b border-[#EFE3DB] pb-2">
                <h4 className="text-xs font-bold text-[#2D151E]">Create New Advertisement</h4>
                <button type="button" onClick={() => setIsCreatingAd(false)} className="text-xs text-[#8A767E] hover:text-[#2D151E] cursor-pointer">Cancel</button>
              </div>

              <div>
                <label className="block text-xs text-[#2D151E] font-semibold mb-1">Ad Title</label>
                <input
                  type="text"
                  required
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  placeholder="e.g. Star Lounge VIP Night"
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#2D151E] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#2D151E] font-semibold mb-1">Advertiser Name</label>
                  <input
                    type="text"
                    value={newAd.advertiserName}
                    onChange={(e) => setNewAd({ ...newAd, advertiserName: e.target.value })}
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#2D151E] font-semibold mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={newAd.ctaButtonText}
                    onChange={(e) => setNewAd({ ...newAd, ctaButtonText: e.target.value })}
                    className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#2D151E] font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  value={newAd.imageUrl}
                  onChange={(e) => setNewAd({ ...newAd, imageUrl: e.target.value })}
                  className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white font-extrabold text-xs rounded-full cursor-pointer shadow-md shadow-rose-500/20"
              >
                Publish Advertisement
              </button>
            </form>
          )}

          <div className="space-y-2">
            {ads.map(ad => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
              return (
                <div key={ad.id} className="bg-white border border-[#EFE3DB] p-4 rounded-3xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <img src={ad.imageUrl} alt={ad.title} className="w-12 h-12 rounded-xl object-cover border border-[#E5D7CE]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#2D151E]">{ad.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ad.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#FAF4F0] text-[#8A767E] border border-[#E5D7CE]'
                        }`}>
                          {ad.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8A767E] truncate mt-0.5">{ad.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#8A767E] mt-1">
                        <span>👁️ {ad.impressions} views</span>
                        <span>🖱️ {ad.clicks} clicks</span>
                        <span className="text-[#FF4A70] font-semibold">CTR: {ctr}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAd(ad)}
                    className="py-1 px-3 rounded-full bg-[#FAF4F0] text-[#2D151E] hover:bg-[#F2E7DF] text-xs font-semibold border border-[#E5D7CE] cursor-pointer"
                  >
                    {ad.active ? 'Pause' : 'Activate'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: AUDIT LOGS */}
      {/* ============================================================ */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8A767E]">
            <span>System audit trail & administrative events</span>
            <span>Records: {logs.length}</span>
          </div>

          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-white border border-[#EFE3DB] p-3 rounded-2xl text-xs flex items-center justify-between shadow-2xs">
                <div>
                  <span className="font-mono text-[#FF4A70] font-bold mr-2">[{log.action}]</span>
                  <span className="text-[#2D151E]">{log.reason}</span>
                </div>
                <span className="text-[10px] text-[#8A767E] shrink-0 ml-3">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: FULL SCREENSHOT PREVIEW */}
      {/* ============================================================ */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3.5 border-b border-[#EFE3DB] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-[#FF4A70]" />
                  <span>MoMo Payment Screenshot Proof</span>
                </span>
                <span className="text-[10px] text-[#8A767E] block font-mono">
                  Ref: {selectedScreenshot.tx.reference} • {selectedScreenshot.tx.sparks} Sparks ({selectedScreenshot.tx.cfaAmount.toLocaleString()} CFA)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                className="p-1 text-[#8A767E] hover:text-[#2D151E] rounded-lg hover:bg-[#FAF4F0] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-[#FAF4F0] min-h-[300px]">
              <img
                src={selectedScreenshot.url}
                alt="Payment Receipt"
                className="max-h-[65vh] max-w-full rounded-2xl object-contain border border-[#E5D7CE] shadow-lg"
              />
            </div>

            <div className="p-3.5 bg-[#FAF4F0] border-t border-[#EFE3DB] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                className="py-2 px-4 rounded-full bg-white hover:bg-[#F2E7DF] text-[#2D151E] font-medium text-xs border border-[#E5D7CE] transition cursor-pointer"
              >
                Close
              </button>

              {selectedScreenshot.tx.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tx = selectedScreenshot.tx;
                      setSelectedScreenshot(null);
                      setRejectingTx({ tx, reason: 'MoMo transaction ID or receipt does not match operator records.' });
                    }}
                    className="py-2 px-3.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const txId = selectedScreenshot.tx.id;
                      setSelectedScreenshot(null);
                      handleApproveTopUp(txId);
                    }}
                    className="py-2 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve Top-Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REJECTION REASON PROMPT */}
      {/* ============================================================ */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" />
                <h3 className="text-sm font-bold text-[#2D151E]">
                  Reject {rejectingTx.tx.transactionType === 'DEPOSIT' ? 'Top-Up' : 'Cashout'} Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingTx(null)}
                className="text-[#8A767E] hover:text-[#2D151E] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8A767E]">
              Provide a clear reason for rejecting this transaction. The user will receive an in-app notification with this reason.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-[#2D151E] mb-1">
                Rejection Reason:
              </label>
              <textarea
                rows={3}
                required
                value={rejectingTx.reason}
                onChange={(e) => setRejectingTx({ ...rejectingTx, reason: e.target.value })}
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectingTx(null)}
                className="py-2 px-3.5 rounded-full bg-[#FAF4F0] text-[#2D151E] text-xs font-semibold border border-[#E5D7CE] hover:bg-[#F2E7DF] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (rejectingTx.tx.transactionType === 'DEPOSIT') {
                    handleConfirmRejectTopUp();
                  } else {
                    handleConfirmRejectWithdrawal();
                  }
                }}
                className="py-2 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
