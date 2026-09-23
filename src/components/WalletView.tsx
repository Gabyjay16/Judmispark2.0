import React, { useState } from 'react';
import { 
  UserProfile, 
  WalletTransaction,
  PaymentInfoConfig
} from '../types';
import { storage } from '../utils/storage';
import { 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeft,
  Send, 
  Download, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertCircle,
  Plus,
  Upload,
  Image as ImageIcon,
  X,
  ExternalLink,
  Info,
  Globe
} from 'lucide-react';

interface WalletViewProps {
  currentUser: UserProfile;
  onRefreshUser: () => void;
  onBack?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ currentUser, onRefreshUser, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'buy' | 'send' | 'withdraw'>('overview');
  const [copiedWalletId, setCopiedWalletId] = useState(false);
  const [copiedAdminMomo, setCopiedAdminMomo] = useState(false);
  const [copiedAdminOrange, setCopiedAdminOrange] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  // Nationality restriction: Mobile money works only for Cameroonians for now
  const isCameroon = Boolean(
    currentUser.nationality?.toLowerCase().includes('cameroon') || 
    currentUser.countryCode === 'CM' ||
    currentUser.nationality === 'Cameroon'
  );

  const paymentInfo: PaymentInfoConfig = storage.getPaymentInfo();

  // Deposit Form State (with screenshot upload)
  const [buySparks, setBuySparks] = useState({
    sparks: 5,
    provider: 'MTN_MOMO' as 'MTN_MOMO' | 'ORANGE_MONEY',
    senderPhone: currentUser.phoneNumber || '',
    reference: '',
    screenshotUrl: '',
    note: ''
  });

  // Send / Transfer Form State
  const [sendSparks, setSendSparks] = useState({
    recipientWalletId: '',
    amount: 2,
    note: ''
  });

  // Withdraw Form State (with MoMo Number and Name)
  const [withdrawSparks, setWithdrawSparks] = useState({
    sparks: 5,
    provider: 'MTN_MOMO' as 'MTN_MOMO' | 'ORANGE_MONEY',
    momoNumber: currentUser.phoneNumber || '',
    momoAccountName: currentUser.fullName || currentUser.displayName || ''
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalBalance = storage.calculateSparkBalance(currentUser.id);
  const availableBalance = storage.calculateAvailableBalance(currentUser.id);
  const transactions = storage.getUserTransactions(currentUser.id);

  const handleCopyWalletId = () => {
    navigator.clipboard.writeText(currentUser.walletId);
    setCopiedWalletId(true);
    setTimeout(() => setCopiedWalletId(false), 2000);
  };

  const handleCopyAdminNumber = (num: string, type: 'momo' | 'orange') => {
    navigator.clipboard.writeText(num);
    if (type === 'momo') {
      setCopiedAdminMomo(true);
      setTimeout(() => setCopiedAdminMomo(false), 2000);
    } else {
      setCopiedAdminOrange(true);
      setTimeout(() => setCopiedAdminOrange(false), 2000);
    }
  };

  // Handle screenshot file upload
  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please upload an image file (PNG, JPG, JPEG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image size should be less than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBuySparks(prev => ({ ...prev, screenshotUrl: result }));
      setFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleScreenshot = () => {
    const sample = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
    setBuySparks(prev => ({ 
      ...prev, 
      screenshotUrl: sample,
      reference: prev.reference || `MOMO-${Math.floor(100000 + Math.random() * 900000)}`
    }));
  };

  // Deposit top-up submit
  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCameroon) {
      setFeedback({ type: 'error', message: 'Mobile Money top-up is currently available only for users in Cameroon.' });
      return;
    }

    if (!buySparks.senderPhone.trim()) {
      setFeedback({ type: 'error', message: 'Please provide your Mobile Money sender phone number.' });
      return;
    }

    if (!buySparks.reference.trim()) {
      setFeedback({ type: 'error', message: 'Please enter the transaction ID or reference from your MoMo SMS.' });
      return;
    }

    if (!buySparks.screenshotUrl) {
      setFeedback({ type: 'error', message: 'Please attach a screenshot of your Mobile Money transfer receipt.' });
      return;
    }

    setIsSubmitting(true);
    const cfaAmount = buySparks.sparks * 500;

    try {
      storage.createTopUpRequest({
        userId: currentUser.id,
        walletId: currentUser.walletId,
        sparks: buySparks.sparks,
        cfaAmount,
        provider: buySparks.provider,
        senderPhone: buySparks.senderPhone.trim(),
        reference: buySparks.reference.trim(),
        screenshotUrl: buySparks.screenshotUrl,
        note: buySparks.note.trim()
      });

      setFeedback({
        type: 'success',
        message: `Top-up request of ${buySparks.sparks} Sparks (${cfaAmount.toLocaleString()} CFA) submitted! Admin will verify your screenshot and approve your balance shortly.`
      });

      // Reset form
      setBuySparks({
        sparks: 5,
        provider: 'MTN_MOMO',
        senderPhone: currentUser.phoneNumber || '',
        reference: '',
        screenshotUrl: '',
        note: ''
      });

      onRefreshUser();
      setTimeout(() => {
        setActiveTab('overview');
        setIsSubmitting(false);
      }, 2000);
    } catch (err: any) {
      setIsSubmitting(false);
      setFeedback({ type: 'error', message: err.message || 'Failed to submit top-up request.' });
    }
  };

  // Transfer Sparks between users
  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sendSparks.amount <= 0) return;

    if (availableBalance < sendSparks.amount) {
      setFeedback({ type: 'error', message: `Insufficient available Sparks. You have ${availableBalance} Sparks available.` });
      return;
    }

    const allUsers = storage.getUsers();
    const recipient = allUsers.find(u => 
      u.walletId.toLowerCase() === sendSparks.recipientWalletId.trim().toLowerCase() ||
      u.phoneNumber === sendSparks.recipientWalletId.trim() ||
      (u.email && u.email.toLowerCase() === sendSparks.recipientWalletId.trim().toLowerCase())
    );

    if (!recipient) {
      setFeedback({ type: 'error', message: 'Recipient wallet ID, email, or phone number not found.' });
      return;
    }

    if (recipient.id === currentUser.id) {
      setFeedback({ type: 'error', message: 'You cannot transfer Sparks to yourself.' });
      return;
    }

    const debitTx: WalletTransaction = {
      id: `tx_snd_${Date.now()}`,
      walletId: currentUser.walletId,
      userId: currentUser.id,
      transactionType: 'TRANSFER',
      sparks: sendSparks.amount,
      cfaAmount: sendSparks.amount * 500,
      senderId: currentUser.id,
      receiverId: recipient.id,
      senderWalletId: currentUser.walletId,
      receiverWalletId: recipient.walletId,
      reference: `SPK-TRF-${Date.now()}`,
      provider: 'INTERNAL',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      note: `Sent ${sendSparks.amount} Sparks to ${recipient.displayName} (${sendSparks.note || 'Transfer'})`
    };

    const creditTx: WalletTransaction = {
      id: `tx_rcv_${Date.now()}`,
      walletId: recipient.walletId,
      userId: recipient.id,
      transactionType: 'TRANSFER',
      sparks: sendSparks.amount,
      cfaAmount: sendSparks.amount * 500,
      senderId: currentUser.id,
      receiverId: recipient.id,
      senderWalletId: currentUser.walletId,
      receiverWalletId: recipient.walletId,
      reference: `SPK-TRF-${Date.now()}`,
      provider: 'INTERNAL',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      note: `Received ${sendSparks.amount} Sparks from ${currentUser.displayName}`
    };

    storage.addTransaction(debitTx);
    storage.addTransaction(creditTx);

    storage.addNotification({
      id: `notif_${Date.now()}`,
      userId: recipient.id,
      title: 'You received Sparks! ⚡',
      message: `${currentUser.displayName} sent you ${sendSparks.amount} Sparks (${(sendSparks.amount * 500).toLocaleString()} CFA).`,
      type: 'spark_received',
      read: false,
      createdAt: new Date().toISOString()
    });

    setFeedback({ type: 'success', message: `Sent ${sendSparks.amount} Sparks to ${recipient.displayName}!` });
    onRefreshUser();
    setTimeout(() => {
      setFeedback(null);
      setActiveTab('overview');
    }, 1500);
  };

  // Withdraw submit
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCameroon) {
      setFeedback({ type: 'error', message: 'Mobile Money withdrawal is currently available only for users in Cameroon.' });
      return;
    }

    if (withdrawSparks.sparks < 5) {
      setFeedback({ type: 'error', message: 'Minimum withdrawal is 5 Sparks (2,500 CFA).' });
      return;
    }

    if (availableBalance < withdrawSparks.sparks) {
      setFeedback({ type: 'error', message: `Insufficient available Sparks. You have ${availableBalance} available.` });
      return;
    }

    if (!withdrawSparks.momoNumber.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your Mobile Money phone number.' });
      return;
    }

    if (!withdrawSparks.momoAccountName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your full registered account name on your MoMo SIM.' });
      return;
    }

    const cfaGross = withdrawSparks.sparks * 500;
    const feeCfa = Math.round(cfaGross * 0.05);
    const netCfa = cfaGross - feeCfa;

    const res = storage.createWithdrawalRequest({
      userId: currentUser.id,
      walletId: currentUser.walletId,
      sparks: withdrawSparks.sparks,
      cfaAmount: netCfa,
      provider: withdrawSparks.provider,
      momoNumber: withdrawSparks.momoNumber.trim(),
      momoAccountName: withdrawSparks.momoAccountName.trim()
    });

    if (res.success) {
      setFeedback({ 
        type: 'success', 
        message: `Withdrawal request for ${netCfa.toLocaleString()} CFA sent to admin! Funds will be dispatched to ${withdrawSparks.momoNumber} (${withdrawSparks.momoAccountName}) once approved.` 
      });
      onRefreshUser();
      setTimeout(() => {
        setFeedback(null);
        setActiveTab('overview');
      }, 2000);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to submit withdrawal request.' });
    }
  };

  const filteredTransactions = transactions.filter((t: WalletTransaction) => {
    if (filterType === 'all') return true;
    if (filterType === 'pending') return t.status === 'PENDING';
    if (filterType === 'purchase') return t.transactionType === 'DEPOSIT';
    if (filterType === 'transfer') return t.transactionType === 'TRANSFER' || t.transactionType === 'GIFT';
    if (filterType === 'withdrawal') return t.transactionType === 'WITHDRAWAL';
    return true;
  });

  return (
    <div id="wallet-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-24">
      {/* Top Bar with Back button */}
      <div className="flex items-center justify-between pb-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Profile</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            1 Spark = 500 CFA
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isCameroon 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {isCameroon ? '🇨🇲 Cameroon (MoMo Active)' : `🌍 ${currentUser.nationality || 'International'}`}
          </span>
        </div>
      </div>

      {/* Cameroon MoMo Notice if not Cameroonian */}
      {!isCameroon && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2.5">
          <Info size={16} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-bold">Mobile Money Restriction Notice</p>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              Mobile money top-ups and cashouts work strictly for Cameroonians (MTN MoMo & Orange Money) at this time. International card & PayPal integration will be enabled soon. You can still transfer and receive Sparks!
            </p>
          </div>
        </div>
      )}

      {/* Spark Balance Card */}
      <div className="bg-gradient-to-r from-[#FA4468] via-[#FF586E] to-[#FF7558] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/15 rounded-full blur-2xl -mr-10 -mt-10" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white">
              ⚡
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-white/95">
              JudmiSpark Wallet
            </span>
          </div>

          <button 
            type="button"
            onClick={handleCopyWalletId}
            className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono cursor-pointer hover:bg-white/30 transition text-white"
            title="Copy Wallet ID"
          >
            <span>{currentUser.walletId}</span>
            {copiedWalletId ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/90">Available Sparks</span>
            {totalBalance !== availableBalance && (
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
                {totalBalance - availableBalance} SPK on hold
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="text-4xl font-black tracking-tight text-white">
              {availableBalance}
            </h1>
            <span className="text-lg font-bold text-white/90">SPARKS</span>
          </div>
          <p className="text-sm font-bold text-white/95 mt-1">
            ≈ {(availableBalance * 500).toLocaleString()} CFA
          </p>
        </div>

        {/* Quick action buttons on card */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/20 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className="py-2.5 rounded-xl bg-[#2D151E] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md hover:bg-black transition cursor-pointer"
          >
            <Plus size={13} className="text-[#FF7B60]" />
            <span>Top Up</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className="py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <Send size={13} />
            <span>Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdraw')}
            className="py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <Download size={13} />
            <span>Cashout</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#F2E7DF] border border-[#E9DDD5] rounded-2xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2 rounded-xl transition cursor-pointer ${activeTab === 'overview' ? 'bg-white text-[#2D151E] font-bold shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'}`}
        >
          Ledger
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('buy')}
          className={`py-2 rounded-xl transition cursor-pointer ${activeTab === 'buy' ? 'bg-white text-[#FF4A70] font-bold shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'}`}
        >
          Top Up
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('send')}
          className={`py-2 rounded-xl transition cursor-pointer ${activeTab === 'send' ? 'bg-white text-[#FF4A70] font-bold shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'}`}
        >
          Transfer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className={`py-2 rounded-xl transition cursor-pointer ${activeTab === 'withdraw' ? 'bg-white text-[#FF4A70] font-bold shadow-xs' : 'text-[#8A767E] hover:text-[#2D151E]'}`}
        >
          Withdraw
        </button>
      </div>

      {/* TAB 1: OVERVIEW / LEDGER */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#8A767E] uppercase tracking-wider">
              Transaction History
            </h3>
            <div className="flex items-center gap-1 text-[11px] overflow-x-auto">
              {['all', 'pending', 'purchase', 'transfer', 'withdrawal'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-0.5 rounded-lg capitalize transition cursor-pointer ${
                    filterType === type ? 'bg-white text-[#2D151E] font-bold shadow-2xs' : 'text-[#8A767E] hover:text-[#2D151E]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 bg-white border border-[#EFE3DB] rounded-3xl text-center text-xs text-[#8A767E]">
                No transactions found in this view.
              </div>
            ) : (
              filteredTransactions.map((tx: WalletTransaction) => {
                const isCredit = tx.transactionType === 'DEPOSIT' || 
                  (tx.transactionType === 'TRANSFER' && tx.receiverId === currentUser.id) ||
                  (tx.transactionType === 'GIFT' && tx.receiverId === currentUser.id);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-white border border-[#EFE3DB] rounded-2xl flex flex-col gap-2 transition hover:border-[#E5D7CE] shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCredit 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#2D151E]">
                              {tx.transactionType === 'DEPOSIT' 
                                ? 'MoMo Deposit Top-Up'
                                : tx.transactionType === 'WITHDRAWAL'
                                ? 'MoMo Cashout'
                                : 'Transfer'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              tx.status === 'COMPLETED' 
                                ? 'bg-emerald-100 text-emerald-700'
                                : tx.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700 animate-pulse'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8A767E] block mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Ref: {tx.reference}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-xs font-black ${isCredit ? 'text-emerald-600' : 'text-[#2D151E]'}`}>
                          {isCredit ? '+' : '-'}{tx.sparks} SPK
                        </div>
                        <span className="text-[10px] text-[#8A767E] block">
                          {tx.cfaAmount.toLocaleString()} CFA
                        </span>
                      </div>
                    </div>

                    {/* Screenshot proof or notes */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#F2E7DF] text-[11px] text-[#8A767E]">
                      <span className="truncate max-w-[220px]">
                        {tx.note || (tx.provider ? `Via ${tx.provider}` : '')}
                      </span>
                      {tx.screenshotUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingScreenshot(tx.screenshotUrl!)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#FF4A70] hover:text-[#E03A60] bg-[#FF4A70]/10 hover:bg-[#FF4A70]/20 px-2 py-0.5 rounded-md border border-[#FF4A70]/20 transition cursor-pointer shrink-0"
                        >
                          <ImageIcon size={11} />
                          <span>View Proof Screenshot</span>
                        </button>
                      )}
                    </div>

                    {/* Admin Rejection Reason if any */}
                    {tx.status === 'REJECTED' && tx.adminRejectionReason && (
                      <div className="text-[11px] bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-xl">
                        <strong>Reason:</strong> {tx.adminRejectionReason}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUY / TOP UP SPARKS (MoMo with Admin Payment Info & Screenshot Upload) */}
      {activeTab === 'buy' && (
        <form onSubmit={handleBuySubmit} className="bg-white border border-[#EFE3DB] rounded-3xl p-5 space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2D151E]">Top Up Sparks</h3>
              <span className="text-[11px] font-bold text-[#FF4A70] bg-[#FF4A70]/10 px-2 py-0.5 rounded-full border border-[#FF4A70]/20">
                1 Spark = 500 CFA
              </span>
            </div>
            <p className="text-xs text-[#8A767E] mt-1">
              Send MoMo payment to admin, upload your transfer screenshot, and receive Sparks once approved.
            </p>
          </div>

          {/* STEP 1: Select Spark Package */}
          <div>
            <label className="block text-xs font-semibold text-[#8A767E] mb-2">
              1. Select Spark Package
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { sparks: 2, cfa: 1000 },
                { sparks: 5, cfa: 2500 },
                { sparks: 10, cfa: 5000 },
                { sparks: 20, cfa: 10000 }
              ].map(pkg => (
                <button
                  key={pkg.sparks}
                  type="button"
                  onClick={() => setBuySparks({ ...buySparks, sparks: pkg.sparks })}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    buySparks.sparks === pkg.sparks 
                      ? 'bg-[#FF4A70]/10 border-[#FF4A70] text-[#2D151E] ring-1 ring-[#FF4A70]' 
                      : 'bg-[#FAF4F0] border-[#E5D7CE] text-[#8A767E] hover:text-[#2D151E]'
                  }`}
                >
                  <div className="text-base font-black text-[#FF4A70]">{pkg.sparks} Sparks</div>
                  <div className="text-xs font-medium text-[#8A767E] mt-0.5">{pkg.cfa.toLocaleString()} CFA</div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Admin MoMo Payment Details */}
          <div className="bg-[#FAF4F0] border border-[#E9DDD5] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                <Smartphone size={14} className="text-[#FF4A70]" />
                <span>2. Official Admin Payment Details</span>
              </span>
              <span className="text-[10px] text-[#8A767E] font-mono">Tap to copy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* MTN MoMo */}
              <div 
                onClick={() => handleCopyAdminNumber(paymentInfo.mtnMomoNumber, 'momo')}
                className="bg-white hover:bg-[#F8EFEA] border border-[#E5D7CE] p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-600 block">MTN Mobile Money</span>
                  <span className="font-mono font-bold text-[#2D151E] text-xs">{paymentInfo.mtnMomoNumber}</span>
                  <span className="text-[10px] text-[#8A767E] block">{paymentInfo.mtnMomoName}</span>
                </div>
                <button type="button" className="p-1 rounded bg-[#F2E7DF] text-[#2D151E]">
                  {copiedAdminMomo ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>

              {/* Orange Money */}
              <div 
                onClick={() => handleCopyAdminNumber(paymentInfo.orangeMoneyNumber, 'orange')}
                className="bg-white hover:bg-[#F8EFEA] border border-[#E5D7CE] p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-orange-600 block">Orange Money</span>
                  <span className="font-mono font-bold text-[#2D151E] text-xs">{paymentInfo.orangeMoneyNumber}</span>
                  <span className="text-[10px] text-[#8A767E] block">{paymentInfo.orangeMoneyName}</span>
                </div>
                <button type="button" className="p-1 rounded bg-[#F2E7DF] text-[#2D151E]">
                  {copiedAdminOrange ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {paymentInfo.instructionsEn && (
              <p className="text-[10px] text-[#8A767E] italic pt-1 border-t border-[#E5D7CE]">
                📌 {paymentInfo.instructionsEn}
              </p>
            )}
          </div>

          {/* STEP 3: Payment Method Used */}
          <div>
            <label className="block text-xs font-semibold text-[#8A767E] mb-1.5">
              3. You paid via:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBuySparks({ ...buySparks, provider: 'MTN_MOMO' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  buySparks.provider === 'MTN_MOMO' 
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                    : 'bg-[#FAF4F0] border-[#E5D7CE] text-[#8A767E]'
                }`}
              >
                <Smartphone size={13} />
                <span>MTN Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => setBuySparks({ ...buySparks, provider: 'ORANGE_MONEY' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  buySparks.provider === 'ORANGE_MONEY' 
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                    : 'bg-[#FAF4F0] border-[#E5D7CE] text-[#8A767E]'
                }`}
              >
                <Smartphone size={13} />
                <span>Orange Money</span>
              </button>
            </div>
          </div>

          {/* Sender Phone & Transaction Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8A767E] mb-1">
                Your Sender Phone Number
              </label>
              <input
                type="tel"
                required
                value={buySparks.senderPhone}
                onChange={(e) => setBuySparks({ ...buySparks, senderPhone: e.target.value })}
                placeholder="e.g. 671234567"
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8A767E] mb-1">
                MoMo Transaction ID / Reference
              </label>
              <input
                type="text"
                required
                value={buySparks.reference}
                onChange={(e) => setBuySparks({ ...buySparks, reference: e.target.value })}
                placeholder="e.g. MP240922..."
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70] font-mono"
              />
            </div>
          </div>

          {/* STEP 4: Screenshot Upload Proof */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                4. Attach Payment Screenshot Receipt <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseSampleScreenshot}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Use sample receipt proof
              </button>
            </div>

            {buySparks.screenshotUrl ? (
              <div className="relative border border-amber-500/40 rounded-2xl overflow-hidden bg-neutral-950 p-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={buySparks.screenshotUrl}
                    alt="Payment Proof"
                    className="w-14 h-14 object-cover rounded-xl border border-neutral-800 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Receipt Screenshot Ready</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewingScreenshot(buySparks.screenshotUrl)}
                      className="text-[11px] text-amber-400 hover:underline block mt-0.5 cursor-pointer"
                    >
                      Click to preview full image
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBuySparks(prev => ({ ...prev, screenshotUrl: '' }))}
                  className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                  title="Remove screenshot"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#E5D7CE] hover:border-[#FF4A70] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-[#FAF4F0] cursor-pointer transition">
                <Upload size={22} className="text-[#8A767E]" />
                <span className="text-xs font-semibold text-[#2D151E]">
                  Tap to upload MoMo transfer screenshot
                </span>
                <span className="text-[10px] text-[#8A767E]">
                  PNG, JPG or JPEG from your Mobile Money SMS or App
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isCameroon}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Sending Request...' : `Submit ${(buySparks.sparks * 500).toLocaleString()} CFA Top-Up for Approval`}
          </button>
        </form>
      )}

      {/* TAB 3: TRANSFER SPARKS */}
      {activeTab === 'send' && (
        <form onSubmit={handleSendSubmit} className="bg-white border border-[#EFE3DB] rounded-3xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-[#2D151E] mb-1">Transfer Sparks</h3>
            <p className="text-xs text-[#8A767E]">
              Send Sparks instantly to another JudmiSpark member anywhere.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8A767E] mb-1">
              Recipient Wallet ID, Email, or Phone
            </label>
            <input
              type="text"
              required
              value={sendSparks.recipientWalletId}
              onChange={(e) => setSendSparks({ ...sendSparks, recipientWalletId: e.target.value })}
              placeholder="e.g. SPK-104928, sarah.bda@gmail.com or 671..."
              className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8A767E] mb-1">
              Amount (Sparks)
            </label>
            <input
              type="number"
              min={1}
              max={availableBalance}
              required
              value={sendSparks.amount}
              onChange={(e) => setSendSparks({ ...sendSparks, amount: parseInt(e.target.value) || 1 })}
              className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
            />
            <span className="text-[11px] text-[#8A767E] mt-1 block">
              Value: {(sendSparks.amount * 500).toLocaleString()} CFA • Available: {availableBalance} Sparks
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8A767E] mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={sendSparks.note}
              onChange={(e) => setSendSparks({ ...sendSparks, note: e.target.value })}
              placeholder="e.g. Thanks for the meetup drinks!"
              className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
            />
          </div>

          <button
            type="submit"
            disabled={availableBalance < sendSparks.amount || sendSparks.amount <= 0}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition cursor-pointer disabled:opacity-50"
          >
            Confirm & Send {sendSparks.amount} Sparks
          </button>
        </form>
      )}

      {/* TAB 4: WITHDRAW (MoMo Cashout with MoMo Number and Name) */}
      {activeTab === 'withdraw' && (
        <form onSubmit={handleWithdrawSubmit} className="bg-white border border-[#EFE3DB] rounded-3xl p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-[#2D151E] mb-1">Withdraw Sparks to Mobile Money</h3>
            <p className="text-xs text-[#8A767E]">
              Min withdrawal: 5 Sparks (2,500 CFA). 5% service fee applies. Funds are sent directly to your MoMo after admin approval.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8A767E] mb-1">
              Sparks to Withdraw (Min: 5)
            </label>
            <input
              type="number"
              min={5}
              max={availableBalance}
              required
              value={withdrawSparks.sparks}
              onChange={(e) => setWithdrawSparks({ ...withdrawSparks, sparks: parseInt(e.target.value) || 5 })}
              className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
            />
            <div className="p-2.5 bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl mt-2 text-[11px] space-y-1 text-[#8A767E]">
              <div className="flex justify-between">
                <span>Gross Value:</span>
                <span className="text-[#2D151E] font-bold">{(withdrawSparks.sparks * 500).toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between">
                <span>5% Platform Fee:</span>
                <span className="text-rose-600 font-bold">-{Math.round(withdrawSparks.sparks * 500 * 0.05).toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between font-bold border-t border-[#E5D7CE] pt-1 text-[#FF4A70]">
                <span>Net You Receive:</span>
                <span>{Math.round(withdrawSparks.sparks * 500 * 0.95).toLocaleString()} CFA</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8A767E] mb-1.5">
              Payout Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWithdrawSparks({ ...withdrawSparks, provider: 'MTN_MOMO' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  withdrawSparks.provider === 'MTN_MOMO' 
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                    : 'bg-[#FAF4F0] border-[#E5D7CE] text-[#8A767E]'
                }`}
              >
                <Smartphone size={14} />
                <span>MTN Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawSparks({ ...withdrawSparks, provider: 'ORANGE_MONEY' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  withdrawSparks.provider === 'ORANGE_MONEY' 
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                    : 'bg-[#FAF4F0] border-[#E5D7CE] text-[#8A767E]'
                }`}
              >
                <Smartphone size={14} />
                <span>Orange Money</span>
              </button>
            </div>
          </div>

          {/* MoMo Number and Name */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#8A767E] mb-1">
                Your Mobile Money Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={withdrawSparks.momoNumber}
                onChange={(e) => setWithdrawSparks({ ...withdrawSparks, momoNumber: e.target.value })}
                placeholder="e.g. 671234567"
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8A767E] mb-1">
                Registered MoMo Account Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={withdrawSparks.momoAccountName}
                onChange={(e) => setWithdrawSparks({ ...withdrawSparks, momoAccountName: e.target.value })}
                placeholder="e.g. Sarah Nfor (Full name on SIM card)"
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
              />
              <span className="text-[10px] text-[#8A767E] mt-0.5 block">
                Admin will verify this name matches the MoMo transfer confirmation before releasing funds.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={availableBalance < withdrawSparks.sparks || withdrawSparks.sparks < 5 || !isCameroon}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition cursor-pointer disabled:opacity-50"
          >
            Submit Cashout Request to Admin
          </button>
        </form>
      )}

      {/* Screenshot Preview Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3.5 border-b border-[#F2E7DF] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#FF4A70]" />
                <span>Payment Screenshot Proof</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingScreenshot(null)}
                className="w-7 h-7 rounded-full bg-[#F2E7DF] text-[#7A666F] hover:text-[#2D151E] flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-[#FAF4F0]">
              <img
                src={viewingScreenshot}
                alt="MoMo Payment Receipt"
                className="max-h-[60vh] max-w-full rounded-2xl object-contain border border-[#E5D7CE]"
              />
            </div>
            <div className="p-3 bg-white border-t border-[#F2E7DF] text-center">
              <button
                type="button"
                onClick={() => setViewingScreenshot(null)}
                className="py-2.5 px-6 rounded-full bg-[#2D151E] hover:bg-black text-white font-bold text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
