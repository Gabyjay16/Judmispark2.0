import { 
  UserProfile, 
  Advertisement, 
  MatchConversation, 
  ChatMessage, 
  LinkUpPost, 
  TalkPost, 
  TalkReply, 
  EventItem, 
  EventChatMessage, 
  WalletTransaction, 
  ReferralRecord, 
  ModerationReport, 
  AdminAuditLog, 
  InAppNotification,
  TownLocation,
  LikeRecord
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'judmispark_current_user',
  USERS: 'judmispark_users',
  ADS: 'judmispark_ads',
  MATCHES: 'judmispark_matches',
  MESSAGES: 'judmispark_messages',
  LINKUPS: 'judmispark_linkups',
  TALK_POSTS: 'judmispark_talk_posts',
  TALK_REPLIES: 'judmispark_talk_replies',
  EVENTS: 'judmispark_events',
  EVENT_MESSAGES: 'judmispark_event_messages',
  TRANSACTIONS: 'judmispark_transactions',
  REFERRALS: 'judmispark_referrals',
  REPORTS: 'judmispark_reports',
  AUDIT_LOGS: 'judmispark_audit_logs',
  NOTIFICATIONS: 'judmispark_notifications',
  SWIPED_PROFILES: 'judmispark_swiped_profiles',
  BLOCKED_USERS: 'judmispark_blocked_users',
  LIKES: 'judmispark_likes',
  EVENT_REMINDERS: 'judmispark_event_reminders',
};

// Initial Registered Current User
const DEFAULT_USER: UserProfile = {
  id: 'usr_me_brandon',
  fullName: 'Brandon Tabi',
  displayName: 'Brandon',
  email: 'gabyjay16@gmail.com',
  phoneNumber: '+237 671 234 567',
  role: 'admin',
  dateOfBirth: '1998-05-14',
  age: 26,
  gender: 'male',
  genderPreference: 'women',
  town: 'Bamenda',
  neighborhood: 'Commercial Avenue',
  profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80'
  ],
  videos: [
    {
      id: 'vid_brandon_1',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-sitting-in-a-park-listening-to-music-40546-small.mp4',
      duration: 24,
      title: 'Acoustic evening in Bamenda',
      createdAt: '2026-09-12T15:00:00Z'
    }
  ],
  bio: 'Product designer & music lover. Always down for live jazz, tech meetups, and local street food.',
  interests: ['Music', 'Technology', 'Travel', 'Art', 'Coffee', 'Basketball'],
  relationshipIntention: 'Relationship',
  isVerified: true,
  status: 'active',
  registrationVoiceUrl: '', // Will play synthetic voice intro
  registrationVoiceDuration: 4,
  registrationVoiceDate: '2026-09-10T14:30:00Z',
  isPremium: false, // Locks until 1 referral activates
  referralCode: 'BRANDON92',
  walletId: 'SPK-827491',
  createdAt: '2026-09-10T14:30:00Z'
};

const INITIAL_USERS: UserProfile[] = [
  DEFAULT_USER,
  {
    id: 'usr_sarah_bamenda',
    fullName: 'Sarah Nfor',
    displayName: 'Sarah',
    phoneNumber: '+237 677 889 900',
    role: 'user',
    dateOfBirth: '2000-03-22',
    age: 24,
    gender: 'female',
    genderPreference: 'men',
    town: 'Bamenda',
    neighborhood: 'Up Station',
    profilePicture: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
    ],
    videos: [
      {
        id: 'vid_sarah_1',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-sitting-in-a-park-listening-to-music-40546-small.mp4',
        duration: 24,
        title: 'Acoustic evening in Bamenda',
        createdAt: '2026-09-11T10:00:00Z'
      }
    ],
    bio: 'Afro-soul vocalist & bookworm. Looking for someone with kind energy who loves weekend drives and deep conversations.',
    interests: ['Music', 'Literature', 'Foodie', 'Travel', 'Acoustic'],
    relationshipIntention: 'Relationship',
    isVerified: true,
    status: 'active',
    registrationVoiceUrl: '',
    registrationVoiceDuration: 4,
    registrationVoiceDate: '2026-09-11T10:00:00Z',
    isPremium: true,
    referralCode: 'SARAH_BAM',
    walletId: 'SPK-114920',
    createdAt: '2026-09-11T10:00:00Z'
  },
  {
    id: 'usr_junior_douala',
    fullName: 'Junior Ebongue',
    displayName: 'Junior',
    phoneNumber: '+237 699 112 233',
    role: 'user',
    dateOfBirth: '1997-08-11',
    age: 27,
    gender: 'male',
    genderPreference: 'women',
    town: 'Douala',
    neighborhood: 'Bonapriso',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80'
    ],
    videos: [
      {
        id: 'vid_junior_1',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-an-acoustic-guitar-41132-small.mp4',
        duration: 18,
        title: 'Tech community in Douala',
        createdAt: '2026-09-12T12:00:00Z'
      }
    ],
    bio: 'Software engineer & tech community host in Douala. Always down for good roasted fish at Youpwe.',
    interests: ['Technology', 'Networking', 'Startups', 'Fitness', 'Gaming'],
    relationshipIntention: 'Friendship',
    isVerified: true,
    status: 'active',
    registrationVoiceUrl: '',
    registrationVoiceDuration: 5,
    registrationVoiceDate: '2026-09-12T12:00:00Z',
    isPremium: false,
    referralCode: 'JUNIOR_DLA',
    walletId: 'SPK-992014',
    createdAt: '2026-09-12T12:00:00Z'
  },
  {
    id: 'usr_chloe_yaounde',
    fullName: 'Chloe Bella',
    displayName: 'Chloe',
    phoneNumber: '+237 655 443 322',
    role: 'user',
    dateOfBirth: '2001-11-04',
    age: 23,
    gender: 'female',
    genderPreference: 'men',
    town: 'Yaoundé',
    neighborhood: 'Bastos',
    profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80'
    ],
    videos: [
      {
        id: 'vid_chloe_1',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-sitting-in-a-park-listening-to-music-40546-small.mp4',
        duration: 24,
        title: 'Art gallery & coffee tour',
        createdAt: '2026-09-13T09:00:00Z'
      }
    ],
    bio: 'Law student & amateur photographer. Looking to meet cheerful people for art galleries and weekend tea.',
    interests: ['Photography', 'Law', 'Art', 'Fashion', 'Cafes'],
    relationshipIntention: 'Casual social connection',
    isVerified: true,
    status: 'active',
    registrationVoiceUrl: '',
    registrationVoiceDuration: 3,
    registrationVoiceDate: '2026-09-13T09:00:00Z',
    isPremium: true,
    referralCode: 'CHLOE_YDE',
    walletId: 'SPK-381920',
    createdAt: '2026-09-13T09:00:00Z'
  },
  {
    id: 'usr_kevin_buea',
    fullName: 'Kevin Moki',
    displayName: 'Kevin',
    phoneNumber: '+237 670 998 877',
    role: 'user',
    dateOfBirth: '1998-01-19',
    age: 26,
    gender: 'male',
    genderPreference: 'everyone',
    town: 'Buea',
    neighborhood: 'Molyko',
    profilePicture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'
    ],
    videos: [],
    bio: 'Silicon Mountain Buea developer. Hiking Mount Cameroon, chilled vibes and startup conversations.',
    interests: ['Hiking', 'Startups', 'Nature', 'Podcasts', 'Coding'],
    relationshipIntention: 'Networking',
    isVerified: true,
    status: 'active',
    registrationVoiceUrl: '',
    registrationVoiceDuration: 4,
    registrationVoiceDate: '2026-09-14T15:00:00Z',
    isPremium: false,
    referralCode: 'KEVIN_BUEA',
    walletId: 'SPK-554109',
    createdAt: '2026-09-14T15:00:00Z'
  },
  {
    id: 'usr_brenda_limbe',
    fullName: 'Brenda Eyong',
    displayName: 'Brenda',
    phoneNumber: '+237 674 332 211',
    role: 'user',
    dateOfBirth: '1999-07-30',
    age: 25,
    gender: 'female',
    genderPreference: 'men',
    town: 'Limbe',
    neighborhood: 'Down Beach',
    profilePicture: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
    ],
    videos: [],
    bio: 'Seaside lover, botanical garden explorer, and fashion entrepreneur. Looking for my soulmate.',
    interests: ['Beach', 'Fashion', 'Cooking', 'Travel', 'Entrepreneurship'],
    relationshipIntention: 'Marriage',
    isVerified: true,
    status: 'active',
    registrationVoiceUrl: '',
    registrationVoiceDuration: 4,
    registrationVoiceDate: '2026-09-15T11:00:00Z',
    isPremium: false,
    referralCode: 'BRENDA_LMB',
    walletId: 'SPK-771234',
    createdAt: '2026-09-15T11:00:00Z'
  }
];

const INITIAL_ADS: Advertisement[] = [
  {
    id: 'ad_spice_douala',
    title: 'Spice Lounge Bonapriso',
    description: 'The premier hangout for singles & friend groups. Enjoy 20% off all grills & cocktails this weekend with code SPARK20!',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    ctaButtonText: 'View Special Offer',
    destinationUrl: 'https://spicelounge.cm',
    advertiserName: 'Spice Lounge & Grill Douala',
    targetTowns: ['Douala', 'Buea', 'Limbe'],
    minAge: 20,
    maxAge: 45,
    gender: 'all',
    active: true,
    frequency: 3,
    impressions: 12450,
    clicks: 823,
    startDate: '2026-09-01',
    endDate: '2026-10-15',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'ad_silicon_summit',
    title: 'Silicon Mountain Summit 2026',
    description: 'Connect with 500+ tech founders, designers & creators in Buea. Networking, fireside chats, and after-party.',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
    ctaButtonText: 'Reserve Free Seat',
    destinationUrl: 'https://siliconmountain.cm',
    advertiserName: 'Silicon Mountain Tech Community',
    targetTowns: ['Buea', 'Bamenda', 'Douala', 'Yaoundé'],
    minAge: 18,
    maxAge: 40,
    gender: 'all',
    active: true,
    frequency: 4,
    impressions: 8930,
    clicks: 654,
    startDate: '2026-09-10',
    endDate: '2026-09-30',
    createdAt: '2026-09-10T09:00:00Z'
  }
];

const INITIAL_MATCHES: MatchConversation[] = [
  {
    id: 'match_sarah_brandon',
    participants: ['usr_me_brandon', 'usr_sarah_bamenda'],
    matchedAt: '2026-09-19T16:00:00Z',
    lastMessageAt: '2026-09-20T19:40:00Z',
    lastMessageText: 'Hey Brandon! Loved your voice note introduction.',
    lastMessageSenderId: 'usr_sarah_bamenda',
    userMessageCounts: {
      'usr_me_brandon': 2,
      'usr_sarah_bamenda': 3
    },
    userHasSentVoiceNote: {
      'usr_me_brandon': false, // Notice Brandon hasn't sent a voice note yet in this chat!
      'usr_sarah_bamenda': true
    },
    isVoiceVerified: false,
    isIdentityRevealed: {
      'usr_me_brandon': false,
      'usr_sarah_bamenda': false
    },
    unreadCountByUser: {
      'usr_me_brandon': 0,
      'usr_sarah_bamenda': 0
    },
    status: 'active'
  },
  {
    id: 'match_chloe_brandon',
    participants: ['usr_me_brandon', 'usr_chloe_yaounde'],
    matchedAt: '2026-09-21T08:00:00Z',
    lastMessageAt: '2026-09-21T08:15:00Z',
    lastMessageText: 'Hello 👋 Saw your profile and loved your passion for jazz!',
    lastMessageSenderId: 'usr_chloe_yaounde',
    userMessageCounts: {
      'usr_me_brandon': 0, // Awaiting reply!
      'usr_chloe_yaounde': 1
    },
    userHasSentVoiceNote: {
      'usr_me_brandon': false,
      'usr_chloe_yaounde': false
    },
    isVoiceVerified: false,
    isIdentityRevealed: {
      'usr_me_brandon': false,
      'usr_chloe_yaounde': false
    },
    unreadCountByUser: {
      'usr_me_brandon': 1,
      'usr_chloe_yaounde': 0
    },
    status: 'active'
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'match_sarah_brandon',
    senderId: 'usr_sarah_bamenda',
    receiverId: 'usr_me_brandon',
    text: 'Hey Brandon! Loved your voice note introduction. The energy was so genuine!',
    isVoiceNote: false,
    createdAt: '2026-09-19T16:05:00Z',
    read: true
  },
  {
    id: 'msg_2',
    conversationId: 'match_sarah_brandon',
    senderId: 'usr_me_brandon',
    receiverId: 'usr_sarah_bamenda',
    text: 'Thank you Sarah! Your acoustic covers must be amazing. What are you listening to today?',
    isVoiceNote: false,
    createdAt: '2026-09-19T16:20:00Z',
    read: true
  },
  {
    id: 'msg_3',
    conversationId: 'match_sarah_brandon',
    senderId: 'usr_sarah_bamenda',
    receiverId: 'usr_me_brandon',
    text: 'I recorded a quick hello snippet so you hear my acoustic setup!',
    isVoiceNote: false,
    createdAt: '2026-09-20T19:35:00Z',
    read: true
  },
  {
    id: 'msg_4',
    conversationId: 'match_sarah_brandon',
    senderId: 'usr_sarah_bamenda',
    receiverId: 'usr_me_brandon',
    voiceUrl: '', // playable
    voiceDuration: 5,
    isVoiceNote: true,
    createdAt: '2026-09-20T19:36:00Z',
    read: true
  },
  {
    id: 'msg_5',
    conversationId: 'match_sarah_brandon',
    senderId: 'usr_me_brandon',
    receiverId: 'usr_sarah_bamenda',
    text: 'That sounds delightful! Do you ever play at Up Station lounges?',
    isVoiceNote: false,
    createdAt: '2026-09-20T19:40:00Z',
    read: true
  },
  {
    id: 'msg_chloe_1',
    conversationId: 'match_chloe_brandon',
    senderId: 'usr_chloe_yaounde',
    receiverId: 'usr_me_brandon',
    text: 'Hello 👋 Saw your profile and loved your passion for jazz!',
    isVoiceNote: false,
    createdAt: '2026-09-21T08:15:00Z',
    read: false
  }
];

const INITIAL_LINKUPS: LinkUpPost[] = [
  {
    id: 'link_1',
    userId: 'usr_sarah_bamenda',
    userDisplayName: 'Anonymous Spark User',
    userPhoto: '',
    userAge: 24,
    userGender: 'female',
    isAnonymous: true,
    town: 'Bamenda',
    availability: 'Tonight',
    time: '7:30 PM',
    message: "I'm free tonight. Anyone wants to hang out for hot tea and live acoustic music near Up Station?",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 3600 * 1000).toISOString(),
    replyCount: 3,
    status: 'active'
  },
  {
    id: 'link_2',
    userId: 'usr_junior_douala',
    userDisplayName: 'Junior',
    userPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    userAge: 28,
    userGender: 'male',
    isAnonymous: false,
    town: 'Douala',
    availability: 'This Afternoon',
    time: '4:00 PM',
    message: "Working remotely from a cafe in Bonapriso. Come co-work or grab fresh fruit juice!",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
    replyCount: 5,
    status: 'active'
  },
  {
    id: 'link_3',
    userId: 'usr_kevin_buea',
    userDisplayName: 'Anonymous Spark User',
    userPhoto: '',
    userAge: 25,
    userGender: 'male',
    isAnonymous: true,
    town: 'Buea',
    availability: 'Right Now',
    time: 'Right Now',
    message: "Brisk walk around Molyko track. Who's up for some light jogging and casual chat?",
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
    replyCount: 1,
    status: 'active'
  },
  {
    id: 'link_4',
    userId: 'usr_brenda_limbe',
    userDisplayName: 'Brenda',
    userPhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
    userAge: 23,
    userGender: 'female',
    isAnonymous: false,
    town: 'Limbe',
    availability: 'Tonight',
    time: '6:30 PM',
    message: "Sunset sea breeze by Down Beach! Who wants roasted fish and plantains?",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
    replyCount: 4,
    status: 'active'
  }
];

const INITIAL_TALK_POSTS: TalkPost[] = [
  {
    id: 'talk_1',
    userId: 'usr_anon_1',
    userDisplayName: 'Anonymous Spark User',
    userPhoto: '',
    isAnonymous: true,
    category: 'Lonely',
    title: 'Feeling isolated in a new city after moving for work',
    content: "I recently relocated to Douala for a new job. During working hours everything is okay, but by 7 PM when I get to my apartment, the silence feels overwhelming. I haven't made any real friends yet and don't know where to start.",
    repliesCount: 4,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    likesCount: 18,
    status: 'active'
  },
  {
    id: 'talk_depressed_1',
    userId: 'usr_anon_depressed',
    userDisplayName: 'Anonymous Spark User',
    userPhoto: '',
    isAnonymous: true,
    category: 'Depressed',
    title: 'Waking up with heavy emotional exhaustion and no motivation',
    content: "Lately it feels like carrying a heavy backpack all day. Even simple tasks like replying to family messages or cooking feel huge. Just putting this here because holding it in makes it harder.",
    repliesCount: 7,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    likesCount: 29,
    status: 'active'
  },
  {
    id: 'talk_2',
    userId: 'usr_me_brandon',
    userDisplayName: 'Brandon',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    isAnonymous: false,
    category: 'Need Advice',
    title: 'How do you keep genuine friendships alive in your late twenties?',
    content: "Between careers, family expectations, and financial pressures, it feels like people disappear into their own bubbles. What practical habits help you stay connected with people you genuinely care about?",
    repliesCount: 6,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    likesCount: 24,
    status: 'active'
  },
  {
    id: 'talk_3',
    userId: 'usr_anon_3',
    userDisplayName: 'Anonymous Spark User',
    userPhoto: '',
    isAnonymous: true,
    category: 'Need Advice',
    title: 'Navigating relationship intentions when you are not ready for marriage yet',
    content: "In our community, once you cross 25, every family member asks when you're tying the knot. How do you communicate healthy dating boundaries without feeling guilty or rushed?",
    repliesCount: 9,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    likesCount: 31,
    status: 'active'
  }
];

const INITIAL_TALK_REPLIES: TalkReply[] = [
  {
    id: 'reply_1',
    talkPostId: 'talk_1',
    userId: 'usr_junior_douala',
    userDisplayName: 'Junior',
    userPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    isAnonymous: false,
    content: "Bro, Douala can definitely feel fast and cold initially! Check out weekend morning runs at Bonamoussadi or open community events on JudmiSpark. You're never truly alone, reach out whenever.",
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
  },
  {
    id: 'reply_2',
    talkPostId: 'talk_1',
    userId: 'usr_chloe_yaounde',
    userDisplayName: 'Anonymous Spark User',
    userPhoto: '',
    isAnonymous: true,
    content: "Sending you warmth! Moving is one of the top emotional stressors. Be kind to yourself this month. One connection at a time.",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  }
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt_friday_hangout',
    creatorId: 'usr_junior_douala',
    creatorName: 'Junior Ebongue',
    creatorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    title: 'Friday Night Hangout',
    description: 'Come chill, enjoy board games, soft afrobeat tunes, and meet friendly locals in a relaxed vibe. Everyone is welcome!',
    date: '25 September 2026',
    time: '8:00 PM',
    town: 'Douala',
    neighborhood: 'Bonapriso',
    venue: 'Green Terrace Lounge',
    photos: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80'
    ],
    chatMode: 'Open Chat',
    joinedUserIds: ['usr_junior_douala', 'usr_me_brandon', 'usr_sarah_bamenda', 'usr_brenda_limbe'],
    createdAt: '2026-09-18T10:00:00Z',
    eventDateTime: '2026-09-25T20:00:00Z',
    expiresAt: '2026-09-25T23:00:00Z', // +3 hours
    status: 'upcoming'
  },
  {
    id: 'evt_acoustic_night',
    creatorId: 'usr_sarah_bamenda',
    creatorName: 'Sarah Nfor',
    creatorPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
    title: 'Up Station Sunset Walk & Picnic',
    description: 'Fresh mountain breeze, acoustic guitar jam, and sunset watching from the hill. Bring snacks and positive vibes!',
    date: '26 September 2026',
    time: '5:00 PM',
    town: 'Bamenda',
    neighborhood: 'Up Station',
    venue: 'Scenic Hillside Overlook',
    photos: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80'
    ],
    chatMode: 'Open Chat',
    joinedUserIds: ['usr_sarah_bamenda', 'usr_me_brandon'],
    createdAt: '2026-09-19T14:00:00Z',
    eventDateTime: '2026-09-26T17:00:00Z',
    expiresAt: '2026-09-26T20:00:00Z',
    status: 'upcoming'
  },
  {
    id: 'evt_tech_buea',
    creatorId: 'usr_kevin_buea',
    creatorName: 'Kevin Moki',
    creatorPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
    title: 'Silicon Mountain Saturday Code & Coffee',
    description: 'Casual morning coworking and project feedback session for makers, designers, and students.',
    date: '27 September 2026',
    time: '10:00 AM',
    town: 'Buea',
    neighborhood: 'Molyko',
    venue: 'Tech Hub Cafe Molyko',
    photos: [
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop&q=80'
    ],
    chatMode: 'Creator Only',
    joinedUserIds: ['usr_kevin_buea'],
    createdAt: '2026-09-20T08:00:00Z',
    eventDateTime: '2026-09-27T10:00:00Z',
    expiresAt: '2026-09-27T13:00:00Z',
    status: 'upcoming'
  }
];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_init_1',
    walletId: 'SPK-827491',
    userId: 'usr_me_brandon',
    transactionType: 'DEPOSIT',
    sparks: 10,
    cfaAmount: 5000,
    reference: 'TX-DEP-99120',
    provider: 'MTN_MOMO',
    providerReference: 'MTN-CAM-882910',
    status: 'COMPLETED',
    note: 'Mobile Money Top Up (MTN MoMo)',
    createdAt: '2026-09-18T11:00:00Z'
  },
  {
    id: 'tx_init_2',
    walletId: 'SPK-827491',
    userId: 'usr_me_brandon',
    transactionType: 'GIFT',
    sparks: 2,
    cfaAmount: 1000,
    senderId: 'usr_sarah_bamenda',
    senderWalletId: 'SPK-114920',
    reference: 'TX-GIFT-44102',
    provider: 'INTERNAL',
    status: 'COMPLETED',
    note: 'Spark Gift from Sarah',
    createdAt: '2026-09-19T18:30:00Z'
  }
];

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif_1',
    userId: 'usr_me_brandon',
    title: 'New Match on JudmiSpark!',
    message: 'You and Sarah Nfor liked each other. Say hello with a voice note!',
    type: 'match',
    relatedId: 'match_sarah_brandon',
    read: false,
    createdAt: '2026-09-21T16:00:00Z'
  },
  {
    id: 'notif_2',
    userId: 'usr_me_brandon',
    title: 'Voice Verification Required 🎙️',
    message: 'Sarah sent a voice note! Send a voice note back to unlock unlimited chatting.',
    type: 'voice_requirement',
    relatedId: 'match_sarah_brandon',
    read: false,
    createdAt: '2026-09-22T04:36:00Z'
  },
  {
    id: 'notif_3',
    userId: 'usr_me_brandon',
    title: 'Spark Gift Received ⚡',
    message: 'You received 2 Sparks (1,000 CFA value) from Sarah Nfor!',
    type: 'spark_received',
    relatedId: 'tx_init_2',
    read: false,
    createdAt: '2026-09-22T03:30:00Z'
  },
  {
    id: 'notif_4',
    userId: 'usr_me_brandon',
    title: 'New Reply on Talk Forum 💬',
    message: 'Junior and Chloe replied to "Feeling isolated in a new city after moving for work". Tap to join the conversation.',
    type: 'talk_reply',
    relatedId: 'talk_1',
    read: false,
    createdAt: '2026-09-22T02:15:00Z'
  },
  {
    id: 'notif_5',
    userId: 'usr_me_brandon',
    title: 'Upcoming Event: Friday Night Hangout 🎉',
    message: 'Junior Ebongue and 3 others are meeting at Bonapriso. Tap to view details and live event chat.',
    type: 'event_join',
    relatedId: 'evt_friday_hangout',
    read: false,
    createdAt: '2026-09-22T01:00:00Z'
  },
  {
    id: 'notif_6',
    userId: 'usr_me_brandon',
    title: 'New Link Up in Bamenda ⚡',
    message: 'Someone is free tonight for hot tea & acoustic music near Up Station. Tap to connect!',
    type: 'linkup_reply',
    relatedId: 'link_1',
    read: true,
    createdAt: '2026-09-21T18:30:00Z'
  }
];

const INITIAL_REPORTS: ModerationReport[] = [
  {
    id: 'rep_voice_1',
    reporterId: 'usr_junior_douala',
    reporterName: 'Junior Ebongue',
    targetType: 'voice_identity',
    targetId: 'usr_brenda_limbe',
    targetUserId: 'usr_brenda_limbe',
    targetUserName: 'Brenda Eyong',
    category: 'Suspicious voice',
    reason: 'Voice tone in chat note sounds like a completely different person than the permanent registration voice note.',
    conversationId: 'conv_sample_voice_rep',
    status: 'pending',
    createdAt: '2026-09-20T14:15:00Z'
  },
  {
    id: 'rep_spam_2',
    reporterId: 'usr_chloe_yaounde',
    reporterName: 'Chloe Bella',
    targetType: 'talk_post',
    targetId: 'talk_spam_sample',
    targetUserId: 'usr_anon_scam',
    targetUserName: 'Suspicious Account',
    category: 'Spam',
    reason: 'Posting unsolicited third-party financial scheme links.',
    status: 'reviewed',
    outcome: 'Warning',
    adminNotes: 'Post removed and user issued warning.',
    reviewedBy: 'Admin_Master',
    createdAt: '2026-09-19T09:10:00Z',
    resolvedAt: '2026-09-19T10:00:00Z'
  }
];

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_1',
    adminId: 'adm_root',
    adminName: 'Super Admin',
    action: 'PLATFORM_BOOTSTRAP',
    targetType: 'system',
    targetId: 'sys_judmispark',
    reason: 'Initial production system verification and security parameters applied.',
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'log_2',
    adminId: 'adm_root',
    adminName: 'Super Admin',
    action: 'APPROVE_ADVERT',
    targetType: 'advertisement',
    targetId: 'ad_spice_douala',
    reason: 'Verified business credentials and approved sponsored placement.',
    createdAt: '2026-09-01T08:15:00Z'
  }
];

class StorageManager {
  private notifListeners: ((notif: InAppNotification) => void)[] = [];

  public onNotificationAdded(callback: (notif: InAppNotification) => void): () => void {
    this.notifListeners.push(callback);
    return () => {
      this.notifListeners = this.notifListeners.filter(cb => cb !== callback);
    };
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to persist to storage', e);
    }
  }

  getCurrentUser(): UserProfile {
    const user = this.getItem<UserProfile>(STORAGE_KEYS.CURRENT_USER, DEFAULT_USER);
    // Ensure gabyjay16@gmail.com is designated as Admin
    if (user.id === DEFAULT_USER.id || user.email === 'gabyjay16@gmail.com' || !user.email) {
      user.email = 'gabyjay16@gmail.com';
      user.role = 'admin';
    }
    if (!Array.isArray(user.photos) || user.photos.length === 0) {
      user.photos = user.profilePicture ? [user.profilePicture] : DEFAULT_USER.photos;
    }
    if (!Array.isArray(user.videos)) {
      user.videos = DEFAULT_USER.videos || [];
    }
    return user;
  }

  setCurrentUser(user: UserProfile): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    // Also update in users array
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  getUsers(): UserProfile[] {
    const users = this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    return users.map(u => {
      const photos = Array.isArray(u.photos) && u.photos.length > 0 
        ? u.photos 
        : (u.profilePicture ? [u.profilePicture] : []);
      const videos = Array.isArray(u.videos) ? u.videos : [];
      return {
        ...u,
        photos,
        videos
      };
    });
  }

  getAds(): Advertisement[] {
    return this.getItem(STORAGE_KEYS.ADS, INITIAL_ADS);
  }

  setAds(ads: Advertisement[]): void {
    this.setItem(STORAGE_KEYS.ADS, ads);
  }

  recordAdImpression(adId: string): void {
    const ads = this.getAds();
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      ad.impressions = (ad.impressions || 0) + 1;
      this.setAds(ads);
    }
  }

  recordAdClick(adId: string): void {
    const ads = this.getAds();
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      ad.clicks = (ad.clicks || 0) + 1;
      this.setAds(ads);
    }
  }

  getMatches(): MatchConversation[] {
    return this.getItem(STORAGE_KEYS.MATCHES, INITIAL_MATCHES);
  }

  setMatches(matches: MatchConversation[]): void {
    this.setItem(STORAGE_KEYS.MATCHES, matches);
  }

  getMessages(): ChatMessage[] {
    return this.getItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  }

  setMessages(messages: ChatMessage[]): void {
    this.setItem(STORAGE_KEYS.MESSAGES, messages);
  }

  getLinkUps(): LinkUpPost[] {
    // Filter out posts that expired (> 24 hours)
    const all = this.getItem<LinkUpPost[]>(STORAGE_KEYS.LINKUPS, INITIAL_LINKUPS);
    const now = Date.now();
    return all.map(post => {
      const exp = new Date(post.expiresAt).getTime();
      if (now > exp && post.status === 'active') {
        return { ...post, status: 'expired' };
      }
      return post;
    });
  }

  setLinkUps(linkups: LinkUpPost[]): void {
    this.setItem(STORAGE_KEYS.LINKUPS, linkups);
  }

  getTalkPosts(): TalkPost[] {
    return this.getItem(STORAGE_KEYS.TALK_POSTS, INITIAL_TALK_POSTS);
  }

  setTalkPosts(posts: TalkPost[]): void {
    this.setItem(STORAGE_KEYS.TALK_POSTS, posts);
  }

  getTalkReplies(): TalkReply[] {
    return this.getItem(STORAGE_KEYS.TALK_REPLIES, INITIAL_TALK_REPLIES);
  }

  setTalkReplies(replies: TalkReply[]): void {
    this.setItem(STORAGE_KEYS.TALK_REPLIES, replies);
  }

  getEvents(): EventItem[] {
    const all = this.getItem<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const now = Date.now();
    return all.map(event => {
      const exp = new Date(event.expiresAt).getTime();
      if (now > exp && event.status === 'upcoming') {
        return { ...event, status: 'expired' };
      }
      return event;
    });
  }

  setEvents(events: EventItem[]): void {
    this.setItem(STORAGE_KEYS.EVENTS, events);
  }

  getEventMessages(eventId: string): EventChatMessage[] {
    const all = this.getItem<EventChatMessage[]>(STORAGE_KEYS.EVENT_MESSAGES, []);
    return all.filter(m => m.eventId === eventId);
  }

  addEventMessage(msg: EventChatMessage): void {
    const all = this.getItem<EventChatMessage[]>(STORAGE_KEYS.EVENT_MESSAGES, []);
    all.push(msg);
    this.setItem(STORAGE_KEYS.EVENT_MESSAGES, all);
  }

  getTransactions(): WalletTransaction[] {
    return this.getItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  addTransaction(tx: WalletTransaction): void {
    const all = this.getTransactions();
    all.unshift(tx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, all);
  }

  getReferrals(): ReferralRecord[] {
    return this.getItem(STORAGE_KEYS.REFERRALS, [
      {
        id: 'ref_sample_1',
        referrerId: 'usr_me_brandon',
        referredUserId: 'usr_sample_prospect',
        referredUserName: 'Emmanuel K.',
        referralCode: 'BRANDON92',
        status: 'pending',
        createdAt: '2026-09-20T12:00:00Z'
      }
    ]);
  }

  setReferrals(refs: ReferralRecord[]): void {
    this.setItem(STORAGE_KEYS.REFERRALS, refs);
  }

  getReports(): ModerationReport[] {
    return this.getItem(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  }

  setReports(reports: ModerationReport[]): void {
    this.setItem(STORAGE_KEYS.REPORTS, reports);
  }

  getAuditLogs(): AdminAuditLog[] {
    return this.getItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  addAuditLog(log: AdminAuditLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  getNotifications(): InAppNotification[] {
    return this.getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  setNotifications(notifs: InAppNotification[]): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  addNotification(notif: InAppNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    this.setNotifications(list);
    this.notifListeners.forEach(cb => {
      try {
        cb(notif);
      } catch (e) {
        console.warn('Error in notification listener', e);
      }
    });
  }

  getSwipedIds(): string[] {
    return this.getItem(STORAGE_KEYS.SWIPED_PROFILES, []);
  }

  addSwipedId(id: string): void {
    const set = new Set(this.getSwipedIds());
    set.add(id);
    this.setItem(STORAGE_KEYS.SWIPED_PROFILES, Array.from(set));
  }

  getBlockedIds(): string[] {
    return this.getItem(STORAGE_KEYS.BLOCKED_USERS, []);
  }

  addBlockedId(id: string): void {
    const set = new Set(this.getBlockedIds());
    set.add(id);
    this.setItem(STORAGE_KEYS.BLOCKED_USERS, Array.from(set));
  }

  // Calculate current Spark balance strictly from the immutable ledger!
  calculateSparkBalance(userId: string): number {
    const txs = this.getTransactions();
    let sparks = 0;
    for (const tx of txs) {
      if (tx.status !== 'COMPLETED') continue;
      if (tx.transactionType === 'DEPOSIT' && tx.userId === userId) {
        sparks += tx.sparks;
      } else if (tx.transactionType === 'WITHDRAWAL' && tx.userId === userId) {
        sparks -= tx.sparks;
      } else if (tx.transactionType === 'TRANSFER') {
        if (tx.receiverId === userId) sparks += tx.sparks;
        if (tx.senderId === userId) sparks -= tx.sparks;
      } else if (tx.transactionType === 'GIFT') {
        if (tx.receiverId === userId) sparks += tx.sparks;
        if (tx.senderId === userId) sparks -= tx.sparks;
      } else if (tx.transactionType === 'ADMIN_ADJUSTMENT' && tx.userId === userId) {
        sparks += tx.sparks; // Can be positive or negative
      }
    }
    return Math.max(0, sparks);
  }

  calculateUserBalance(userId: string): number {
    return this.calculateSparkBalance(userId);
  }

  updateUser(user: UserProfile): void {
    this.setCurrentUser(user);
  }

  setTransactions(txs: WalletTransaction[]): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
  }

  getUserTransactions(userId: string): WalletTransaction[] {
    return this.getTransactions().filter(t => 
      t.userId === userId || t.senderId === userId || t.receiverId === userId
    );
  }

  getUserNotifications(userId: string): InAppNotification[] {
    return this.getNotifications().filter(n => n.userId === userId);
  }

  markNotificationAsRead(notifId: string): void {
    const all = this.getNotifications();
    const updated = all.map(n => n.id === notifId ? { ...n, read: true } : n);
    this.setNotifications(updated);
  }

  clearNotifications(userId: string): void {
    const all = this.getNotifications();
    const remaining = all.filter(n => n.userId !== userId);
    this.setNotifications(remaining);
  }

  getUserReferrals(userId: string): ReferralRecord[] {
    return this.getReferrals().filter(r => r.referrerId === userId);
  }

  // Activate referral and automatically unlock Premium features for the referrer!
  processReferralRegistration(newUserId: string, newUserName: string, referralCodeUsed: string): { referrerFound: boolean; referrerName?: string } {
    if (!referralCodeUsed || !referralCodeUsed.trim()) return { referrerFound: false };
    const cleanCode = referralCodeUsed.trim().toUpperCase();

    // Find user who owns this referral code
    const allUsers = this.getUsers();
    const referrer = allUsers.find(u => u.referralCode && u.referralCode.toUpperCase() === cleanCode && u.id !== newUserId);

    if (!referrer) {
      return { referrerFound: false };
    }

    // 1. Record the referral entry
    const allReferrals = this.getReferrals();
    const newRefRecord: ReferralRecord = {
      id: `ref_${Date.now()}`,
      referrerId: referrer.id,
      referredUserId: newUserId,
      referredUserName: newUserName,
      referralCode: cleanCode,
      status: 'activated',
      createdAt: new Date().toISOString(),
      activatedAt: new Date().toISOString()
    };
    allReferrals.unshift(newRefRecord);
    this.setReferrals(allReferrals);

    // 2. Automatically grant Premium to the referrer!
    referrer.isPremium = true;
    const userIdx = allUsers.findIndex(u => u.id === referrer.id);
    if (userIdx >= 0) {
      allUsers[userIdx] = referrer;
      this.setItem(STORAGE_KEYS.USERS, allUsers);
    }

    // Also update if currentUser is this referrer
    const curr = this.getCurrentUser();
    if (curr.id === referrer.id) {
      curr.isPremium = true;
      this.setItem(STORAGE_KEYS.CURRENT_USER, curr);
    }

    // 3. Send congratulatory In-App notification to the referrer about their new Premium VIP status
    this.addNotification({
      id: `notif_premium_ref_${Date.now()}`,
      userId: referrer.id,
      title: '👑 JudmiSpark Premium Unlocked!',
      message: `${newUserName} just registered with your referral link! You have automatically been granted JudmiSpark Premium VIP with unlimited swipes and priority matches!`,
      type: 'premium_unlocked',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { referrerFound: true, referrerName: referrer.displayName };
  }

  addReport(report: ModerationReport): void {
    const all = this.getReports();
    all.unshift(report);
    this.setReports(all);
  }

  // LIKES MANAGEMENT
  getLikes(): LikeRecord[] {
    return this.getItem<LikeRecord[]>(STORAGE_KEYS.LIKES, [
      // Pre-seed some likes so user can see how incoming likes appear
      {
        id: 'like_chloe_me',
        fromUserId: 'usr_chloe_yaounde',
        toUserId: 'usr_me_brandon',
        createdAt: '2026-09-21T08:00:00Z',
        type: 'single_tap_like'
      },
      {
        id: 'like_sarah_me',
        fromUserId: 'usr_sarah_bamenda',
        toUserId: 'usr_me_brandon',
        createdAt: '2026-09-20T12:30:00Z',
        type: 'single_tap_like'
      }
    ]);
  }

  setLikes(likes: LikeRecord[]): void {
    this.setItem(STORAGE_KEYS.LIKES, likes);
  }

  addLike(fromUserId: string, toUserId: string, type: 'single_tap_like' | 'greeting' = 'single_tap_like'): LikeRecord {
    const likes = this.getLikes();
    const existing = likes.find(l => l.fromUserId === fromUserId && l.toUserId === toUserId);
    if (existing) {
      existing.createdAt = new Date().toISOString();
      existing.type = type;
      this.setLikes(likes);
      return existing;
    }

    const newLike: LikeRecord = {
      id: `like_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromUserId,
      toUserId,
      createdAt: new Date().toISOString(),
      type
    };

    likes.unshift(newLike);
    this.setLikes(likes);
    return newLike;
  }

  getLikesSentBy(userId: string): LikeRecord[] {
    return this.getLikes().filter(l => l.fromUserId === userId);
  }

  getLikesReceivedBy(userId: string): LikeRecord[] {
    return this.getLikes().filter(l => l.toUserId === userId);
  }

  hasUserLiked(fromUserId: string, toUserId: string): boolean {
    return this.getLikes().some(l => l.fromUserId === fromUserId && l.toUserId === toUserId);
  }

  // EVENT NOTIFICATION REMINDERS
  getEventReminders(userId: string): string[] {
    const map = this.getItem<Record<string, string[]>>(STORAGE_KEYS.EVENT_REMINDERS, {});
    return map[userId] || [];
  }

  setEventReminders(userId: string, eventIds: string[]): void {
    const map = this.getItem<Record<string, string[]>>(STORAGE_KEYS.EVENT_REMINDERS, {});
    map[userId] = eventIds;
    this.setItem(STORAGE_KEYS.EVENT_REMINDERS, map);
  }

  isEventReminderSet(userId: string, eventId: string): boolean {
    const reminders = this.getEventReminders(userId);
    return reminders.includes(eventId);
  }

  toggleEventReminder(userId: string, eventId: string): boolean {
    const reminders = this.getEventReminders(userId);
    const index = reminders.indexOf(eventId);
    let isNowReminded = false;
    if (index >= 0) {
      reminders.splice(index, 1);
      isNowReminded = false;
    } else {
      reminders.push(eventId);
      isNowReminded = true;
    }
    this.setEventReminders(userId, reminders);
    return isNowReminded;
  }
}

export const storage = new StorageManager();
