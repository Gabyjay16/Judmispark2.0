import React, { useState } from 'react';
import { UserProfile, WalletTransaction } from '../types';
import { storage } from '../utils/storage';
import { Gift, Zap, X, CheckCircle2 } from 'lucide-react';

interface GiftSparkModalProps {
  currentUser: UserProfile;
  recipient: UserProfile;
  onClose: () => void;
  onGiftSent: () => void;
}

export const GiftSparkModal: React.FC<GiftSparkModalProps> = ({
  currentUser,
  recipient,
  onClose,
  onGiftSent
}) => {
  const [amount, setAmount] = useState(2);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const balance = storage.calculateUserBalance(currentUser.id);

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (balance < amount) {
      alert('Insufficient Spark balance. Please purchase Sparks in your Spark Wallet.');
      return;
    }

    const debitTx: WalletTransaction = {
      id: `tx_gft_deb_${Date.now()}`,
      walletId: currentUser.walletId,
      userId: currentUser.id,
      transactionType: 'GIFT',
      sparks: amount,
      cfaAmount: amount * 500,
      senderId: currentUser.id,
      receiverId: recipient.id,
      senderWalletId: currentUser.walletId,
      receiverWalletId: recipient.walletId,
      reference: `SPK-GIFT-${Date.now()}`,
      provider: 'INTERNAL',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      note: `Gifted ${amount} Sparks to ${recipient.displayName} (${note || 'Gift'})`
    };

    const creditTx: WalletTransaction = {
      id: `tx_gft_crd_${Date.now()}`,
      walletId: recipient.walletId,
      userId: recipient.id,
      transactionType: 'GIFT',
      sparks: amount,
      cfaAmount: amount * 500,
      senderId: currentUser.id,
      receiverId: recipient.id,
      senderWalletId: currentUser.walletId,
      receiverWalletId: recipient.walletId,
      reference: `SPK-GIFT-${Date.now()}`,
      provider: 'INTERNAL',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      note: `Received a gift of ${amount} Sparks from ${currentUser.displayName}`
    };

    storage.addTransaction(debitTx);
    storage.addTransaction(creditTx);

    // Notify recipient
    storage.addNotification({
      id: `notif_${Date.now()}`,
      userId: recipient.id,
      title: 'You received a Spark Gift! 🎁⚡',
      message: `${currentUser.displayName} gifted you ${amount} Sparks (${(amount * 500).toLocaleString()} CFA).`,
      type: 'spark_received',
      read: false,
      createdAt: new Date().toISOString()
    });

    setSuccess(true);
    setTimeout(() => {
      onGiftSent();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
          <div className="flex items-center gap-2 text-[#FF4A70] font-bold text-sm">
            <Gift size={18} />
            <span>Gift Sparks to {recipient.displayName}</span>
          </div>
          <button type="button" onClick={onClose} className="text-[#8A767E] hover:text-[#2D151E] text-xs cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-[#2D151E]">Gift Sent!</h4>
            <p className="text-xs text-[#8A767E]">
              {amount} Sparks ({(amount * 500).toLocaleString()} CFA) gifted to {recipient.displayName}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendGift} className="space-y-4">
            <div className="flex items-center gap-3 bg-[#FAF4F0] p-3 rounded-2xl border border-[#E5D7CE]">
              <img 
                src={recipient.profilePicture} 
                alt={recipient.displayName} 
                className="w-12 h-12 rounded-xl object-cover border border-[#FF4A70]" 
              />
              <div>
                <h4 className="text-xs font-bold text-[#2D151E]">{recipient.displayName}</h4>
                <span className="text-[11px] text-[#8A767E]">📍 {recipient.town}</span>
                <span className="text-[11px] text-[#FF4A70] font-semibold block mt-0.5">Your balance: {balance} Sparks</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D151E] mb-2">
                Choose Gift Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 5, 10].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      amount === val 
                        ? 'bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] text-white border-transparent shadow-xs' 
                        : 'bg-[#FAF4F0] border-[#E5D7CE] text-[#8A767E] hover:text-[#2D151E]'
                    }`}
                  >
                    ⚡ {val}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-[#8A767E] mt-1 block text-center">
                Value: {(amount * 500).toLocaleString()} CFA
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                Warm Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. For great conversation!"
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] focus:outline-none focus:border-[#FF4A70]"
              />
            </div>

            <button
              type="submit"
              disabled={balance < amount}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition cursor-pointer"
            >
              Send {amount} Sparks Gift
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
