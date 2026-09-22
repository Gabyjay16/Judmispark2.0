import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  Crown, 
  Sparkles, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Zap, 
  Eye, 
  Infinity as InfinityIcon, 
  Mic, 
  Calendar, 
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ReferralPromoModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onNavigateToProfile?: () => void;
}

export const ReferralPromoModal: React.FC<ReferralPromoModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onNavigateToProfile
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralCode = currentUser.referralCode || `SPARK${currentUser.id.slice(-4).toUpperCase()}`;
  const inviteLink = `https://judmispark.com/join?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    const shareText = `Hey! Join me on JudmiSpark Cameroon — the verified voice dating & community app. Use my code "${referralCode}" to connect with local singles and friends: ${inviteLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join JudmiSpark Cameroon',
          text: shareText,
          url: inviteLink
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const premiumServices = [
    {
      icon: <Crown className="text-amber-400" size={18} />,
      title: 'Golden VIP Badge & Profile Crown',
      desc: 'Exclusive verified golden badge on your profile so everyone knows you are a VIP member.'
    },
    {
      icon: <InfinityIcon className="text-amber-400" size={18} />,
      title: 'Unlimited Discover Swipes',
      desc: 'Browse, match, and like as many profiles as you want across Cameroon with zero daily limits.'
    },
    {
      icon: <Eye className="text-amber-400" size={18} />,
      title: 'See Who Liked You',
      desc: 'View all people who tapped like on your profile and match with them instantly.'
    },
    {
      icon: <Zap className="text-amber-400" size={18} />,
      title: 'Top Priority Feed Visibility',
      desc: 'Your profile and Link Up posts get boosted to the top of Discover and city feeds.'
    },
    {
      icon: <Mic className="text-amber-400" size={18} />,
      title: 'Unlimited Voice Messaging',
      desc: 'Send high-definition voice notes and audio replies without message throttling.'
    },
    {
      icon: <Calendar className="text-amber-400" size={18} />,
      title: 'VIP Event Gatherings & Hangouts',
      desc: 'Access exclusive local gatherings, event group chats, and real-world meetups.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[92vh] flex flex-col relative overflow-hidden">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        {/* Header with Close */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25 shrink-0">
              <Crown size={22} className="fill-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Special First-Time Offer
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Get Free Premium VIP! 👑
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700/80 transition shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 relative z-10">
          {/* Promo Explainer Card */}
          <div className="bg-gradient-to-br from-amber-950/40 via-neutral-950 to-neutral-950 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
            <p className="text-xs text-neutral-200 leading-relaxed font-medium">
              Invite your friends or singles to <strong className="text-white">JudmiSpark</strong>. When someone registers with your invite code, your account <strong className="text-amber-300">instantly unlocks 100% Free Premium VIP Service</strong> (Worth 5,000 CFA / month)!
            </p>

            {/* Referral Code Box */}
            <div className="bg-neutral-900 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2 mt-2">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Your Personal Invite Code
                </span>
                <span className="text-sm font-mono font-extrabold text-amber-300 tracking-wider">
                  {referralCode}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow cursor-pointer"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="py-1.5 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-neutral-700 flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  title="Share Invite"
                >
                  <Share2 size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Premium Services List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>Premium Services You Will Receive:</span>
              </h4>
              <span className="text-[10px] font-bold text-amber-400">All Included</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {premiumServices.map((service, idx) => (
                <div 
                  key={idx}
                  className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-2.5 flex items-start gap-3 hover:border-amber-500/30 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    {service.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{service.title}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        FREE
                      </span>
                    </h5>
                    <p className="text-[11px] text-neutral-400 leading-normal mt-0.5">
                      {service.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-neutral-800 flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={() => {
              handleShare();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
          >
            <Share2 size={15} />
            <span>Share Invite & Unlock VIP</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs border border-neutral-700 transition active:scale-95 cursor-pointer"
          >
            <span>Explore App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
