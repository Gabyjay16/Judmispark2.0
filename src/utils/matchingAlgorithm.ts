import { UserProfile, TownLocation, RelationshipIntention } from '../types';

export type MatchingSortMode = 'best_match' | 'same_town' | 'most_recent';

export interface DiscoverFilterOptions {
  sortMode: MatchingSortMode;
  town: TownLocation | 'All';
  minAge: number;
  maxAge: number;
  intention: RelationshipIntention | 'All';
}

export interface MatchScoreResult {
  score: number; // 0 - 100
  matchPercentage: number;
  reasons: string[];
  sharedInterests: string[];
  isSameTown: boolean;
  isSameIntention: boolean;
  isAgeCompatible: boolean;
}

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilterOptions = {
  sortMode: 'best_match',
  town: 'All',
  minAge: 18,
  maxAge: 55,
  intention: 'All'
};

/**
 * Calculates a matching compatibility score between the current user and a candidate.
 * Factors:
 * 1. Same Town / Proximity (35%)
 * 2. Shared Hobbies / Interests (30%)
 * 3. Relationship Intentions (25%)
 * 4. Age Proximity & Verification (10%)
 */
export function calculateMatchScore(currentUser: UserProfile, candidate: UserProfile): MatchScoreResult {
  let score = 42; // baseline foundation
  const reasons: string[] = [];

  // 1. Same Town / Location Proximity
  const isSameTown = candidate.town.toLowerCase() === currentUser.town.toLowerCase();
  if (isSameTown) {
    score += 30;
    reasons.push(`Same town (${candidate.town})`);
  }

  // 2. Shared Hobbies & Interests Overlap
  const userInterestsLower = (currentUser.interests || []).map(i => i.toLowerCase().trim());
  const sharedInterests = (candidate.interests || []).filter(interest => 
    userInterestsLower.includes(interest.toLowerCase().trim())
  );

  if (sharedInterests.length > 0) {
    const interestPoints = Math.min(25, sharedInterests.length * 8);
    score += interestPoints;
    const highlightInterests = sharedInterests.slice(0, 2).join(', ');
    reasons.push(`${sharedInterests.length} shared hobby${sharedInterests.length > 1 ? 's' : ''} (${highlightInterests}${sharedInterests.length > 2 ? '...' : ''})`);
  }

  // 3. Relationship Intentions
  const isSameIntention = candidate.relationshipIntention === currentUser.relationshipIntention;
  if (isSameIntention) {
    score += 20;
    reasons.push(`Same intention (${candidate.relationshipIntention})`);
  } else {
    // Compatible intentions
    const compatiblePairs = [
      ['Relationship', 'Marriage'],
      ['Marriage', 'Relationship'],
      ['Friendship', 'Casual social connection'],
      ['Casual social connection', 'Just meeting people'],
      ['Networking', 'Just meeting people']
    ];
    const isCompatible = compatiblePairs.some(
      ([a, b]) => candidate.relationshipIntention === a && currentUser.relationshipIntention === b
    );
    if (isCompatible) {
      score += 10;
      reasons.push(`Compatible goal`);
    }
  }

  // 4. Age Proximity
  let isAgeCompatible = false;
  if (candidate.age && currentUser.age) {
    const ageDiff = Math.abs(candidate.age - currentUser.age);
    if (ageDiff <= 3) {
      score += 8;
      isAgeCompatible = true;
      reasons.push('Similar age');
    } else if (ageDiff <= 6) {
      score += 4;
      isAgeCompatible = true;
    }
  }

  // 5. Verification Bonus
  if (candidate.isVerified) {
    score += 5;
  }

  // Normalization to 45% - 99%
  const matchPercentage = Math.min(99, Math.max(45, Math.round(score)));

  return {
    score: matchPercentage,
    matchPercentage,
    reasons,
    sharedInterests,
    isSameTown,
    isSameIntention,
    isAgeCompatible
  };
}

/**
 * Filters and sorts profiles according to active filters and matching algorithm.
 */
export function filterAndRankProfiles(
  allProfiles: UserProfile[],
  currentUser: UserProfile,
  filters: DiscoverFilterOptions,
  swipedIds: Set<string>,
  blockedIds: Set<string>
): { profile: UserProfile; match: MatchScoreResult }[] {
  // 1. Basic eligibility filter (exclude self, swiped, blocked)
  let eligible = allProfiles.filter(p => {
    if (p.id === currentUser.id) return false;
    if (blockedIds.has(p.id)) return false;
    if (swipedIds.has(p.id)) return false;

    // Town filter
    if (filters.town !== 'All' && p.town !== filters.town) {
      return false;
    }

    // Age limit filter
    const age = p.age || 20;
    if (age < filters.minAge || age > filters.maxAge) {
      return false;
    }

    // Relationship intention filter
    if (filters.intention !== 'All' && p.relationshipIntention !== filters.intention) {
      return false;
    }

    return true;
  });

  // 2. Compute match scores for each profile
  const scored = eligible.map(profile => ({
    profile,
    match: calculateMatchScore(currentUser, profile)
  }));

  // 3. Sort based on selected algorithm mode
  if (filters.sortMode === 'best_match') {
    // Highest compatibility score first
    scored.sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);
  } else if (filters.sortMode === 'same_town') {
    // Same town first, then score
    scored.sort((a, b) => {
      if (a.match.isSameTown && !b.match.isSameTown) return -1;
      if (!a.match.isSameTown && b.match.isSameTown) return 1;
      return b.match.matchPercentage - a.match.matchPercentage;
    });
  } else if (filters.sortMode === 'most_recent') {
    // Newest join date first
    scored.sort((a, b) => {
      const dateA = new Date(a.profile.createdAt || 0).getTime();
      const dateB = new Date(b.profile.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  return scored;
}
