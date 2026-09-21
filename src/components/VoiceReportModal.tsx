import React, { useState } from 'react';
import { 
  UserProfile, 
  MatchConversation, 
  ModerationReport 
} from '../types';
import { storage } from '../utils/storage';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface VoiceReportModalProps {
  currentUser: UserProfile;
  reportedUser: UserProfile;
  conversation?: MatchConversation;
  onClose: () => void;
  onSubmitted: () => void;
}

export const VoiceReportModal: React.FC<VoiceReportModalProps> = ({
  currentUser,
  reportedUser,
  conversation,
  onClose,
  onSubmitted
}) => {
  const [reason, setReason] = useState<string>('Voice does not match registration voice introduction');
  const [comments, setComments] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const report: ModerationReport = {
      id: `rep_${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.displayName,
      targetType: 'voice_identity',
      targetId: conversation?.id || reportedUser.id,
      targetUserId: reportedUser.id,
      targetUserName: reportedUser.displayName,
      category: 'Suspicious voice',
      conversationId: conversation?.id,
      registrationVoiceUrl: reportedUser.registrationVoiceUrl,
      conversationVoiceUrl: conversation?.lastMessageText?.includes('voice') ? conversation.id : reportedUser.registrationVoiceUrl,
      reason,
      additionalComments: comments,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    storage.addReport(report);
    setIsSuccess(true);
    setTimeout(() => {
      onSubmitted();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <ShieldAlert size={18} />
            <span>Report Voice Identity</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs"
          >
            <X size={16} />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-neutral-400">
              The moderation team will review both voice recordings to verify this user's identity.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-neutral-300">
              Reporting: <strong className="text-white">{reportedUser.displayName}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Reason for Voice Identity Report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Voice does not match registration voice introduction">
                  Voice sounds different from registration voice
                </option>
                <option value="Voice is robotic, AI-generated, or synthesized">
                  Voice is robotic or synthetic
                </option>
                <option value="Different person speaking in conversation voice notes">
                  Different person in conversation notes
                </option>
                <option value="Voice note contains harassment or threat">
                  Voice note contains harassment or threat
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Additional Observations
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Explain why you believe the voice is unverified or misleading..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <p className="text-[10px] text-neutral-500 leading-normal">
              An admin will compare this user's permanent registration voice against their conversation notes.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
            >
              Submit Report for Admin Review
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
