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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-[#EFE3DB] rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#FAF4F0] border-b border-[#EFE3DB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F73B66] to-[#FF874F] text-white flex items-center justify-center shadow-xs">
              <Sliders size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2D151E]">
                Discovery Algorithm & Filters
              </h3>
              <p className="text-[11px] text-[#8A767E]">
                Tailor how profiles match and appear in your feed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE] transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white">
          {/* Section 1: Matching Algorithm Priority */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#FF4A70]" />
                <span>Display Algorithm</span>
              </label>
              <span className="text-[10px] text-[#FF4A70] font-semibold bg-[#FAF4F0] px-2 py-0.5 rounded-full border border-[#FF4A70]/20">
                Default: Best Match
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Best Match (Default) */}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, sortMode: 'best_match' }))}
                className={`p-3 rounded-2xl border text-left transition relative flex items-start gap-3 cursor-pointer ${
                  filters.sortMode === 'best_match'
                    ? 'bg-[#FAF4F0] border-[#FF4A70] ring-1 ring-[#FF4A70]/30 shadow-2xs'
                    : 'bg-[#FAF4F0] border-[#E5D7CE] hover:border-[#FF4A70]/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  filters.sortMode === 'best_match' 
                    ? 'bg-[#FF4A70] text-white shadow-xs' 
                    : 'bg-white border border-[#E5D7CE] text-[#8A767E]'
                }`}>
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D151E]">
                      Best Match Compatibility (Recommended)
                    </span>
                    {filters.sortMode === 'best_match' && (
                      <Check size={14} className="text-[#FF4A70] shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A767E] leading-snug mt-0.5">
                    Displays matching profiles first: shared hobbies & interests, same relationship intentions, and users in your town ({currentUserTown}).
                  </p>
                </div>
              </button>

              {/* Option 2: Same Town First */}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, sortMode: 'same_town' }))}
                className={`p-3 rounded-2xl border text-left transition relative flex items-start gap-3 cursor-pointer ${
                  filters.sortMode === 'same_town'
                    ? 'bg-[#FAF4F0] border-[#FF4A70] ring-1 ring-[#FF4A70]/30 shadow-2xs'
                    : 'bg-[#FAF4F0] border-[#E5D7CE] hover:border-[#FF4A70]/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  filters.sortMode === 'same_town' 
                    ? 'bg-[#FF4A70] text-white shadow-xs' 
                    : 'bg-white border border-[#E5D7CE] text-[#8A767E]'
                }`}>
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D151E]">
                      Nearest Town First
                    </span>
                    {filters.sortMode === 'same_town' && (
                      <Check size={14} className="text-[#FF4A70] shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A767E] leading-snug mt-0.5">
                    Shows people in your city first before expanding to other regions in Cameroon.
                  </p>
                </div>
              </button>

              {/* Option 3: Most Recent */}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, sortMode: 'most_recent' }))}
                className={`p-3 rounded-2xl border text-left transition relative flex items-start gap-3 cursor-pointer ${
                  filters.sortMode === 'most_recent'
                    ? 'bg-[#FAF4F0] border-[#FF4A70] ring-1 ring-[#FF4A70]/30 shadow-2xs'
                    : 'bg-[#FAF4F0] border-[#E5D7CE] hover:border-[#FF4A70]/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                  filters.sortMode === 'most_recent' 
                    ? 'bg-[#FF4A70] text-white shadow-xs' 
                    : 'bg-white border border-[#E5D7CE] text-[#8A767E]'
                }`}>
                  🕒
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D151E]">
                      Most Recent Members
                    </span>
                    {filters.sortMode === 'most_recent' && (
                      <Check size={14} className="text-[#FF4A70] shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A767E] leading-snug mt-0.5">
                    Explore newest registered members chronologically.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Town Location Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                <MapPin size={13} className="text-[#FF4A70]" />
                <span>Town / Location</span>
              </label>
              <span className="text-[11px] text-[#8A767E]">
                {filters.town === 'All' ? 'All Cameroon' : filters.town}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {CAMEROON_TOWNS.map(town => (
                <button
                  key={town}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, town }))}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition cursor-pointer ${
                    filters.town === town
                      ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white border-transparent shadow-xs'
                      : 'bg-[#FAF4F0] text-[#5C454F] border-[#E5D7CE] hover:bg-[#F2E7DF]'
                  }`}
                >
                  {town === 'All' ? '🇨🇲 All' : town}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Age Limit Range */}
          <div className="space-y-3 bg-[#FAF4F0] p-3.5 rounded-2xl border border-[#E5D7CE]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                <Users size={13} className="text-[#FF4A70]" />
                <span>Age Limit Range</span>
              </label>
              <span className="text-xs font-extrabold text-[#FF4A70] bg-white px-2.5 py-0.5 rounded-full border border-[#E5D7CE]">
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
                    className={`text-[11px] font-semibold py-1 px-2.5 rounded-full border transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white border-transparent shadow-xs'
                        : 'bg-white text-[#8A767E] border-[#E5D7CE] hover:text-[#2D151E] hover:bg-[#F2E7DF]'
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
                <div className="flex justify-between text-[11px] text-[#8A767E] mb-1">
                  <span>Minimum Age: <strong className="text-[#2D151E]">{filters.minAge}</strong></span>
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
                  className="w-full accent-[#FF4A70] bg-[#E5D7CE] h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#8A767E] mb-1">
                  <span>Maximum Age: <strong className="text-[#2D151E]">{filters.maxAge}</strong></span>
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
                  className="w-full accent-[#FF4A70] bg-[#E5D7CE] h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Relationship Intention */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D151E] flex items-center gap-1.5">
                <HeartHandshake size={13} className="text-[#FF4A70]" />
                <span>Relationship Intention</span>
              </label>
              <span className="text-[11px] text-[#8A767E]">
                {filters.intention === 'All' ? 'All Intentions' : filters.intention}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {INTENTIONS.map(intention => (
                <button
                  key={intention}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, intention }))}
                  className={`py-1.5 px-3 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                    filters.intention === intention
                      ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white border-transparent shadow-xs'
                      : 'bg-[#FAF4F0] text-[#5C454F] border-[#E5D7CE] hover:bg-[#F2E7DF]'
                  }`}
                >
                  {intention === 'All' ? '✨ All Intentions' : intention}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF4F0] border-t border-[#EFE3DB] flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-4 rounded-full bg-white hover:bg-[#F2E7DF] text-[#8A767E] hover:text-[#2D151E] border border-[#E5D7CE] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F73B66] via-[#FF5864] to-[#FF874F] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Apply Discovery Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
