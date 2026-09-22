import React, { useState } from 'react';
import { TownLocation, RelationshipIntention } from '../types';
import { 
  DiscoverFilterOptions, 
  MatchingSortMode 
} from '../utils/matchingAlgorithm';
import { 
  X, 
  Sparkles, 
  MapPin, 
  Users, 
  HeartHandshake, 
  RotateCcw, 
  Check, 
  Sliders,
  Compass
} from 'lucide-react';

interface DiscoverFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: DiscoverFilterOptions;
  onApplyFilters: (newFilters: DiscoverFilterOptions) => void;
  currentUserTown: TownLocation;
  totalMatchingCount?: number;
}

const CAMEROON_TOWNS: (TownLocation | 'All')[] = [
  'All',
  'Bamenda',
  'Douala',
  'Yaoundé',
  'Buea',
  'Limbe',
  'Bafoussam',
  'Garoua',
  'Kumba'
];

const INTENTIONS: (RelationshipIntention | 'All')[] = [
  'All',
  'Relationship',
  'Marriage',
  'Friendship',
  'Casual social connection',
  'Networking',
  'Just meeting people'
];

const AGE_PRESETS = [
  { label: '18 - 25', min: 18, max: 25 },
  { label: '20 - 30', min: 20, max: 30 },
  { label: '25 - 35', min: 25, max: 35 },
  { label: '30 - 45', min: 30, max: 45 },
  { label: 'All (18 - 60+)', min: 18, max: 60 }
];

export const DiscoverFilterModal: React.FC<DiscoverFilterModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
  currentUserTown,
  totalMatchingCount
}) => {
  const [filters, setFilters] = useState<DiscoverFilterOptions>({ ...currentFilters });

  if (!isOpen) return null;

  const handleReset = () => {
    setFilters({
      sortMode: 'best_match',
      town: 'All',
      minAge: 18,
      maxAge: 55,
      intention: 'All'
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <div 
      id="discover-filter-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Sliders size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Discovery Algorithm & Filters
              </h3>
              <p className="text-[11px] text-neutral-400">
                Tailor how profiles match and appear in your feed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-neutral-900/50">
          {/* Section 1: Matching Algorithm Priority */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles size={13} className="text-rose-400" />
                <span>Display Algorithm</span>
              </label>
              <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                Default: Best Match
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Best Match (Default) */}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, sortMode: 'best_match' }))}
                className={`p-3 rounded-2xl border text-left transition relative flex items-start gap-3 ${
                  filters.sortMode === 'best_match'
                    ? 'bg-rose-500/15 border-rose-500/60 ring-1 ring-rose-500/30'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  filters.sortMode === 'best_match' 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Best Match Compatibility (Recommended)
                    </span>
                    {filters.sortMode === 'best_match' && (
                      <Check size={14} className="text-rose-400 shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                    Displays matching profiles first: shared hobbies & interests, same relationship intentions, and users in your town ({currentUserTown}).
                  </p>
                </div>
              </button>

              {/* Option 2: Same Town First */}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, sortMode: 'same_town' }))}
                className={`p-3 rounded-2xl border text-left transition relative flex items-start gap-3 ${
                  filters.sortMode === 'same_town'
                    ? 'bg-rose-500/15 border-rose-500/60 ring-1 ring-rose-500/30'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  filters.sortMode === 'same_town' 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Nearest Town First
                    </span>
                    {filters.sortMode === 'same_town' && (
                      <Check size={14} className="text-rose-400 shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                    Shows people in your city first before expanding to other regions in Cameroon.
                  </p>
                </div>
              </button>

              {/* Option 3: Most Recent */}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, sortMode: 'most_recent' }))}
                className={`p-3 rounded-2xl border text-left transition relative flex items-start gap-3 ${
                  filters.sortMode === 'most_recent'
                    ? 'bg-rose-500/15 border-rose-500/60 ring-1 ring-rose-500/30'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  filters.sortMode === 'most_recent' 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  🕒
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Most Recent Members
                    </span>
                    {filters.sortMode === 'most_recent' && (
                      <Check size={14} className="text-rose-400 shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                    Explore newest registered members chronologically.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Town Location Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin size={13} className="text-rose-400" />
                <span>Town / Location</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                {filters.town === 'All' ? 'All Cameroon' : filters.town}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {CAMEROON_TOWNS.map(town => (
                <button
                  key={town}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, town }))}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition ${
                    filters.town === town
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  {town === 'All' ? '🇨🇲 All' : town}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Age Limit Range */}
          <div className="space-y-3 bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users size={13} className="text-rose-400" />
                <span>Age Limit Range</span>
              </label>
              <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                {filters.minAge} – {filters.maxAge} years
              </span>
            </div>

            {/* Quick Age Presets */}
            <div className="flex flex-wrap gap-1.5">
              {AGE_PRESETS.map(preset => {
                const isSelected = filters.minAge === preset.min && filters.maxAge === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, minAge: preset.min, maxAge: preset.max }))}
                    className={`text-[11px] font-semibold py-1 px-2.5 rounded-lg border transition ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Sliders */}
            <div className="space-y-2 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Minimum Age: <strong className="text-white">{filters.minAge}</strong></span>
                  <span>18</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={filters.maxAge - 1}
                  value={filters.minAge}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFilters(prev => ({ ...prev, minAge: Math.min(val, prev.maxAge - 1) }));
                  }}
                  className="w-full accent-rose-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Maximum Age: <strong className="text-white">{filters.maxAge}</strong></span>
                  <span>60+</span>
                </div>
                <input
                  type="range"
                  min={filters.minAge + 1}
                  max={65}
                  value={filters.maxAge}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFilters(prev => ({ ...prev, maxAge: Math.max(val, prev.minAge + 1) }));
                  }}
                  className="w-full accent-rose-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Relationship Intention */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <HeartHandshake size={13} className="text-rose-400" />
                <span>Relationship Intention</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                {filters.intention === 'All' ? 'All Intentions' : filters.intention}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {INTENTIONS.map(intention => (
                <button
                  key={intention}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, intention }))}
                  className={`py-1.5 px-3 rounded-xl text-[11px] font-semibold border transition ${
                    filters.intention === intention
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {intention === 'All' ? '✨ All Intentions' : intention}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Sparkles size={14} />
            <span>Apply Discovery Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
