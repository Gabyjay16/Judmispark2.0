import React, { useState } from 'react';
import { 
  UserProfile, 
  WalletTransaction 
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
  Plus
} from 'lucide-react';

interface WalletViewProps {
  currentUser: UserProfile;
  onRefreshUser: () => void;
  onBack?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ currentUser, onRefreshUser, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'buy' | 'send' | 'withdraw'>('overview');
  const [copiedWalletId, setCopiedWalletId] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Forms
  const [buySparks, setBuySparks] = useState({
    sparks: 5,
    method: 'MTN Mobile Money' as 'MTN Mobile Money' | 'Orange Money',
    phone: currentUser.phoneNumber || '671234567'
  });

  const [sendSparks, setSendSparks] = useState({
    recipientWalletId: '',
    amount: 2,
    note: ''
  });

  const [withdrawSparks, setWithdrawSparks] = useState({
    amount: 5,
    method: 'MTN Mobile Money' as 'MTN Mobile Money' | 'Orange Money',
    phone: currentUser.phoneNumber || '671234567'
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const balance = storage.calculateUserBalance(currentUser.id);
  const transactions = storage.getUserTransactions(currentUser.id);

  const handleCopyWalletId = () => {
    navigator.clipboard.writeText(currentUser.walletId);
    setCopiedWalletId(true);
    setTimeout(() => setCopiedWalletId(false), 2000);
  };

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cfaAmount = buySparks.sparks * 500;
    const txId = `tx_buy_${Date.now()}`;

    const newTx: WalletTransaction = {
      id: txId,
      walletId: currentUser.walletId,
      userId: currentUser.id,
      transactionType: 'DEPOSIT',
      sparks: buySparks.sparks,
      cfaAmount: cfaAmount,
      reference: `MOMO-${Date.now()}`,
      provider: buySparks.method === 'Orange Money' ? 'ORANGE_MONEY' : 'MTN_MOMO',
      providerReference: `MOMO-REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      note: `Purchased ${buySparks.sparks} Sparks via ${buySparks.method} (${buySparks.phone})`
    };

    storage.addTransaction(newTx);
    setFeedback({ type: 'success', message: `Successfully purchased ${buySparks.sparks} Sparks (${cfaAmount.toLocaleString()} CFA)!` });
    onRefreshUser();
    setTimeout(() => {
      setFeedback(null);
      setActiveTab('overview');
    }, 1500);
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sendSparks.amount <= 0) return;

    if (balance < sendSparks.amount) {
      setFeedback({ type: 'error', message: 'Insufficient Sparks balance.' });
      return;
    }

    const allUsers = storage.getUsers();
    const recipient = allUsers.find(u => 
      u.walletId.toLowerCase() === sendSparks.recipientWalletId.trim().toLowerCase() ||
      u.phoneNumber === sendSparks.recipientWalletId.trim()
    );

    if (!recipient) {
      setFeedback({ type: 'error', message: 'Recipient wallet ID or phone number not found.' });
      return;
    }

    if (recipient.id === currentUser.id) {
      setFeedback({ type: 'error', message: 'You cannot transfer Sparks to yourself.' });
      return;
    }

    // Transfer transactions: debit sender, credit recipient
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

    // Notify recipient
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

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawSparks.amount < 5) {
      setFeedback({ type: 'error', message: 'Minimum withdrawal is 5 Sparks (2,500 CFA).' });
      return;
    }

    if (balance < withdrawSparks.amount) {
      setFeedback({ type: 'error', message: 'Insufficient Sparks balance.' });
      return;
    }

    const cfaGross = withdrawSparks.amount * 500;
    const feeCfa = Math.round(cfaGross * 0.05);
    const netCfa = cfaGross - feeCfa;

    const withdrawTx: WalletTransaction = {
      id: `tx_wth_${Date.now()}`,
      walletId: currentUser.walletId,
      userId: currentUser.id,
      transactionType: 'WITHDRAWAL',
      sparks: withdrawSparks.amount,
      cfaAmount: netCfa,
      reference: `MOMO-WTH-${Date.now()}`,
      provider: withdrawSparks.method === 'Orange Money' ? 'ORANGE_MONEY' : 'MTN_MOMO',
      providerReference: withdrawSparks.phone,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      note: `Withdrawal of ${withdrawSparks.amount} Sparks to ${withdrawSparks.method} (${withdrawSparks.phone})`
    };

    storage.addTransaction(withdrawTx);
    setFeedback({ type: 'success', message: `Withdrawal request submitted! ${netCfa.toLocaleString()} CFA will be sent to ${withdrawSparks.phone}.` });
    onRefreshUser();
    setTimeout(() => {
      setFeedback(null);
      setActiveTab('overview');
    }, 1800);
  };

  const filteredTransactions = transactions.filter((t: WalletTransaction) => {
    if (filterType === 'all') return true;
    if (filterType === 'purchase') return t.transactionType === 'DEPOSIT';
    if (filterType === 'transfer') return t.transactionType === 'TRANSFER' || t.transactionType === 'GIFT';
    if (filterType === 'withdrawal') return t.transactionType === 'WITHDRAWAL';
    return true;
  });

  return (
    <div id="wallet-page-view" className="max-w-md mx-auto w-full px-4 py-3 space-y-4 pb-24">
      {/* Back button to Profile if navigated from Profile */}
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-xl transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Profile</span>
          </button>
          <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            1 Spark = 500 CFA
          </span>
        </div>
      )}

      {/* Spark Balance Card */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-rose-600 rounded-3xl p-6 text-neutral-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-950/20 backdrop-blur-md flex items-center justify-center font-black">
              ⚡
            </div>
            <span className="text-xs font-black tracking-wider uppercase opacity-90">
              JudmiSpark Wallet
            </span>
          </div>

          <div 
            onClick={handleCopyWalletId}
            className="flex items-center gap-1.5 bg-neutral-950/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono cursor-pointer hover:bg-neutral-950/30 transition"
          >
            <span>{currentUser.walletId}</span>
            {copiedWalletId ? <Check size={12} /> : <Copy size={12} />}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold opacity-80">Available Balance</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h1 className="text-4xl font-black tracking-tight">
              {balance}
            </h1>
            <span className="text-lg font-bold">SPARKS</span>
          </div>
          <p className="text-sm font-bold opacity-90 mt-1">
            ≈ {(balance * 500).toLocaleString()} CFA
          </p>
        </div>

        {/* Quick action buttons on card */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-black/10">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className="py-2 rounded-xl bg-neutral-950 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md hover:bg-neutral-900 transition"
          >
            <Plus size={13} className="text-amber-400" />
            <span>Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className="py-2 rounded-xl bg-neutral-950/20 hover:bg-neutral-950/30 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 transition"
          >
            <Send size={13} />
            <span>Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdraw')}
            className="py-2 rounded-xl bg-neutral-950/20 hover:bg-neutral-950/30 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 transition"
          >
            <Download size={13} />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2 rounded-xl transition ${activeTab === 'overview' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400'}`}
        >
          Ledger
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('buy')}
          className={`py-2 rounded-xl transition ${activeTab === 'buy' ? 'bg-neutral-800 text-amber-400 shadow' : 'text-neutral-400'}`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('send')}
          className={`py-2 rounded-xl transition ${activeTab === 'send' ? 'bg-neutral-800 text-amber-400 shadow' : 'text-neutral-400'}`}
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className={`py-2 rounded-xl transition ${activeTab === 'withdraw' ? 'bg-neutral-800 text-amber-400 shadow' : 'text-neutral-400'}`}
        >
          Withdraw
        </button>
      </div>

      {/* TAB 1: OVERVIEW / LEDGER */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Immutable Transaction Ledger
            </h3>
            <div className="flex items-center gap-1 text-[11px]">
              {['all', 'purchase', 'transfer', 'withdrawal'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-0.5 rounded-lg capitalize ${
                    filterType === type ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 bg-neutral-900/60 border border-neutral-800 rounded-3xl text-center text-xs text-neutral-500">
                No transactions yet in this filter.
              </div>
            ) : (
              filteredTransactions.map((tx: WalletTransaction) => {
                const isCredit = tx.transactionType === 'DEPOSIT' || 
                  (tx.transactionType === 'TRANSFER' && tx.receiverId === currentUser.id) ||
                  (tx.transactionType === 'GIFT' && tx.receiverId === currentUser.id);

                return (
                  <div
                    key={tx.id}
                    className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {tx.note || `${tx.transactionType} Transaction`}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                          <span>{new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span className={tx.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-xs font-extrabold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.sparks)} SPK
                      </div>
                      <span className="text-[10px] text-neutral-500 block">
                        {tx.cfaAmount.toLocaleString()} CFA
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUY SPARKS (Mobile Money) */}
      {activeTab === 'buy' && (
        <form onSubmit={handleBuySubmit} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Deposit & Buy Sparks</h3>
            <p className="text-xs text-neutral-400">
              Rate: 1 Spark = 500 CFA. Pay securely with Cameroon Mobile Money.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Select Spark Package
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
                  className={`p-3 rounded-2xl border text-left transition ${
                    buySparks.sparks === pkg.sparks 
                      ? 'bg-amber-500/10 border-amber-500 text-white' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-base font-black text-amber-400">{pkg.sparks} Sparks</div>
                  <div className="text-xs font-medium text-neutral-300 mt-0.5">{pkg.cfa.toLocaleString()} CFA</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Payment Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['MTN Mobile Money', 'Orange Money'] as const).map(provider => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setBuySparks({ ...buySparks, method: provider })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    buySparks.method === provider 
                      ? 'bg-amber-500 text-neutral-950 border-amber-500' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>{provider}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Mobile Money Phone Number
            </label>
            <input
              type="tel"
              required
              value={buySparks.phone}
              onChange={(e) => setBuySparks({ ...buySparks, phone: e.target.value })}
              placeholder="671 234 567"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            Pay {(buySparks.sparks * 500).toLocaleString()} CFA for {buySparks.sparks} Sparks
          </button>
        </form>
      )}

      {/* TAB 3: TRANSFER SPARKS */}
      {activeTab === 'send' && (
        <form onSubmit={handleSendSubmit} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Transfer Sparks</h3>
            <p className="text-xs text-neutral-400">
              Send Sparks instantly to another JudmiSpark user.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Recipient Wallet ID or Phone Number
            </label>
            <input
              type="text"
              required
              value={sendSparks.recipientWalletId}
              onChange={(e) => setSendSparks({ ...sendSparks, recipientWalletId: e.target.value })}
              placeholder="e.g. SPK-104928 or +237 6..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Amount (Sparks)
            </label>
            <input
              type="number"
              min={1}
              max={balance}
              required
              value={sendSparks.amount}
              onChange={(e) => setSendSparks({ ...sendSparks, amount: parseInt(e.target.value) || 1 })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Value: {(sendSparks.amount * 500).toLocaleString()} CFA • Balance: {balance} Sparks
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={sendSparks.note}
              onChange={(e) => setSendSparks({ ...sendSparks, note: e.target.value })}
              placeholder="e.g. Thanks for the meetup drinks!"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={balance < sendSparks.amount}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            Confirm & Send {sendSparks.amount} Sparks
          </button>
        </form>
      )}

      {/* TAB 4: WITHDRAW */}
      {activeTab === 'withdraw' && (
        <form onSubmit={handleWithdrawSubmit} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Withdraw Sparks to Cash</h3>
            <p className="text-xs text-neutral-400">
              Min withdrawal: 5 Sparks (2,500 CFA). 5% service fee applies.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Sparks to Withdraw (Min: 5)
            </label>
            <input
              type="number"
              min={5}
              max={balance}
              required
              value={withdrawSparks.amount}
              onChange={(e) => setWithdrawSparks({ ...withdrawSparks, amount: parseInt(e.target.value) || 5 })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl mt-2 text-[11px] space-y-1 text-neutral-400">
              <div className="flex justify-between">
                <span>Gross Value:</span>
                <span className="text-white">{(withdrawSparks.amount * 500).toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between">
                <span>5% Platform Fee:</span>
                <span className="text-rose-400">-{Math.round(withdrawSparks.amount * 500 * 0.05).toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between font-bold border-t border-neutral-800 pt-1 text-amber-400">
                <span>Net You Receive:</span>
                <span>{Math.round(withdrawSparks.amount * 500 * 0.95).toLocaleString()} CFA</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Payout Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['MTN Mobile Money', 'Orange Money'] as const).map(provider => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setWithdrawSparks({ ...withdrawSparks, method: provider })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    withdrawSparks.method === provider 
                      ? 'bg-amber-500 text-neutral-950 border-amber-500' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>{provider}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Your Mobile Money Number
            </label>
            <input
              type="tel"
              required
              value={withdrawSparks.phone}
              onChange={(e) => setWithdrawSparks({ ...withdrawSparks, phone: e.target.value })}
              placeholder="671 234 567"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={balance < withdrawSparks.amount || withdrawSparks.amount < 5}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            Submit Cashout Request
          </button>
        </form>
      )}
    </div>
  );
};
