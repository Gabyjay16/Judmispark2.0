export type TownLocation = 'Bamenda' | 'Douala' | 'Yaoundé' | 'Buea' | 'Limbe' | 'Bafoussam' | 'Garoua' | 'Kumba';

export type RelationshipIntention = 
  | 'Relationship' 
  | 'Marriage' 
  | 'Friendship' 
  | 'Casual social connection' 
  | 'Networking' 
  | 'Just meeting people';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  displayName: string;
  phoneNumber: string;
  role: UserRole;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  genderPreference: 'everyone' | 'women' | 'men';
  town: TownLocation;
  neighborhood?: string;
  profilePicture: string;
  photos: string[];
  bio: string;
  interests: string[];
  relationshipIntention: RelationshipIntention;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'banned';
  // Mandatory permanent registration voice recording
  registrationVoiceUrl: string;
  registrationVoiceDuration: number;
  registrationVoiceDate: string;
  // Wallet and Premium
  isPremium: boolean;
  referralCode: string;
  walletId: string; // e.g. SPK-827491
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaButtonText: string;
  destinationUrl: string;
  advertiserName: string;
  targetTowns: TownLocation[];
  minAge: number;
  maxAge: number;
  gender: 'all' | 'male' | 'female';
  active: boolean;
  frequency: number; // e.g. 3 or 4
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface MatchConversation {
  id: string;
  participants: [string, string]; // User IDs
  matchedAt: string;
  lastMessageAt: string;
  lastMessageText: string;
  lastMessageSenderId: string;
  userMessageCounts: Record<string, number>; // e.g. { user1: 4, user2: 3 }
  userHasSentVoiceNote: Record<string, boolean>; // e.g. { user1: true, user2: false }
  isVoiceVerified: boolean; // true once BOTH users have exchanged voice notes
  isIdentityRevealed: Record<string, boolean>; // { user1: true, user2: false }
  identityRevealRequestedBy?: string;
  unreadCountByUser: Record<string, number>;
  status: 'active' | 'blocked';
  blockedBy?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  imageUrl?: string;
  isVoiceNote: boolean;
  createdAt: string;
  read: boolean;
  isSystemMessage?: boolean;
}

export interface LinkUpPost {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhoto: string;
  isAnonymous: boolean; // Location still visible!
  town: TownLocation;
  availability: 'Today' | 'Tonight' | 'Right Now' | 'This Afternoon';
  time: string;
  message: string;
  createdAt: string; // Expires in 24 hours
  expiresAt: string;
  replyCount: number;
  status: 'active' | 'expired';
}

export interface TalkPost {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhoto: string;
  isAnonymous: boolean;
  category: 'Depressed / Lonely' | 'Need Advice';
  title: string;
  content: string;
  voiceUrl?: string;
  voiceDuration?: number;
  imageUrl?: string;
  repliesCount: number;
  createdAt: string;
  likesCount: number;
  status: 'active' | 'removed';
}

export interface TalkReply {
  id: string;
  talkPostId: string;
  userId: string;
  userDisplayName: string;
  userPhoto: string;
  isAnonymous: boolean;
  content: string;
  voiceUrl?: string;
  voiceDuration?: number;
  imageUrl?: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
  title: string;
  description: string;
  date: string;
  time: string;
  town: TownLocation;
  neighborhood: string;
  venue?: string;
  photos: string[]; // Up to 3 photos
  chatMode: 'Open Chat' | 'Creator Only' | 'Disabled';
  joinedUserIds: string[];
  createdAt: string;
  eventDateTime: string; // ISO
  expiresAt: string; // eventDateTime + 3 hours
  status: 'upcoming' | 'expired';
}

export interface EventChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  text?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  imageUrl?: string;
  createdAt: string;
}

export type TransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'TRANSFER' 
  | 'GIFT' 
  | 'REFUND' 
  | 'ADMIN_ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  transactionType: TransactionType;
  sparks: number; // 1 Spark = 500 CFA
  cfaAmount: number;
  senderId?: string;
  receiverId?: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  reference: string;
  provider?: 'MTN_MOMO' | 'ORANGE_MONEY' | 'INTERNAL';
  providerReference?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REJECTED';
  note?: string;
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  referralCode: string;
  status: 'pending' | 'activated';
  createdAt: string;
  activatedAt?: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'voice_identity' | 'talk_post' | 'event' | 'link_up';
  targetId: string;
  targetUserId: string;
  targetUserName: string;
  category: 
    | 'Spam' 
    | 'Fake identity' 
    | 'Harassment' 
    | 'Scam' 
    | 'Inappropriate content' 
    | 'Impersonation' 
    | 'Suspicious voice' 
    | 'Offensive content' 
    | 'Other';
  reason: string;
  additionalComments?: string;
  conversationId?: string;
  // Specific voice comparison evidence for Voice Identity reports
  registrationVoiceUrl?: string;
  conversationVoiceUrl?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  outcome?: 'No violation' | 'Warning' | 'Temporary restriction' | 'Voice verification required' | 'Account suspension' | 'Account ban';
  adminNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 
    | 'match' 
    | 'message' 
    | 'voice_requirement' 
    | 'talk_reply' 
    | 'linkup_reply' 
    | 'event_join' 
    | 'spark_received' 
    | 'withdrawal_status' 
    | 'premium_unlocked' 
    | 'system';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}
