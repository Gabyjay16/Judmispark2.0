import React, { useState } from 'react';
import { 
  TownLocation, 
  RelationshipIntention, 
  UserProfile 
} from '../types';
import { AudioRecorder } from './AudioRecorder';
import { RecordedAudioData } from '../utils/audio';
import { storage } from '../utils/storage';
import { 
  User, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Lock, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Upload,
  Heart
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (user: UserProfile) => void;
}

const CAMEROON_TOWNS: TownLocation[] = [
  'Bamenda',
  'Douala',
  'Yaoundé',
  'Buea',
  'Limbe',
  'Bafoussam',
  'Garoua',
  'Kumba'
];

const RELATIONSHIP_INTENTIONS: RelationshipIntention[] = [
  'Relationship',
  'Marriage',
  'Friendship',
  'Casual social connection',
  'Networking',
  'Just meeting people'
];

const INTEREST_OPTIONS = [
  'Music', 'Acoustic', 'Technology', 'Startups', 'Travel', 
  'Foodie', 'Art', 'Fashion', 'Fitness', 'Hiking', 
  'Photography', 'Gaming', 'Books', 'Coffee', 'Basketball'
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80'
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    phoneNumber: '',
    pin: '',
    dateOfBirth: '2000-01-01',
    gender: 'female' as 'male' | 'female' | 'non-binary' | 'other',
    genderPreference: 'everyone' as 'everyone' | 'women' | 'men',
    town: 'Bamenda' as TownLocation,
    neighborhood: '',
    profilePicture: AVATAR_PRESETS[0],
    bio: '',
    interests: ['Music', 'Travel'] as string[],
    relationshipIntention: 'Relationship' as RelationshipIntention
  });

  const [recordedVoice, setRecordedVoice] = useState<RecordedAudioData | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculateAge = (dob: string): number => {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const handleInterestToggle = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      if (formData.interests.length < 6) {
        setFormData({
          ...formData,
          interests: [...formData.interests, interest]
        });
      }
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.displayName.trim()) {
      setError('Please fill in your full name and display name');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Please enter your mobile phone number');
      return;
    }
    if (!formData.pin.trim() || formData.pin.length < 4) {
      setError('Please enter a 4+ digit security PIN');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleVoiceCompleted = (voiceData: RecordedAudioData) => {
    setRecordedVoice(voiceData);
  };

  const handleFinalSubmit = () => {
    if (!recordedVoice) {
      setError('A permanent registration voice recording is required before completing registration.');
      return;
    }

    const age = calculateAge(formData.dateOfBirth);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const newUserId = `usr_${Date.now()}`;
    const cleanDisplayName = formData.displayName.replace(/\s+/g, '').toUpperCase();

    const newUser: UserProfile = {
      id: newUserId,
      fullName: formData.fullName,
      displayName: formData.displayName,
      phoneNumber: formData.phoneNumber,
      role: 'user',
      dateOfBirth: formData.dateOfBirth,
      age: age || 22,
      gender: formData.gender,
      genderPreference: formData.genderPreference,
      town: formData.town,
      neighborhood: formData.neighborhood || undefined,
      profilePicture: formData.profilePicture,
      photos: [formData.profilePicture],
      bio: formData.bio || 'New member on JudmiSpark! Looking to connect.',
      interests: formData.interests.length > 0 ? formData.interests : ['Music', 'Travel'],
      relationshipIntention: formData.relationshipIntention,
      isVerified: true,
      status: 'active',
      registrationVoiceUrl: recordedVoice.blobUrl,
      registrationVoiceDuration: recordedVoice.duration,
      registrationVoiceDate: new Date().toISOString(),
      isPremium: false,
      referralCode: `${cleanDisplayName}${Math.floor(10 + Math.random() * 89)}`,
      walletId: `SPK-${randomSuffix}`,
      createdAt: new Date().toISOString()
    };

    // Save user to storage
    storage.setCurrentUser(newUser);

    // Give welcome notification
    storage.addNotification({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      title: 'Welcome to JudmiSpark! ✨',
      message: 'Your permanent voice identity has been registered. Discover people in ' + newUser.town + '!',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    onRegistered(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="registration-modal-card" 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-rose-500/30">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                Join JudmiSpark
              </h2>
              <p className="text-xs text-neutral-400">
                Step {step} of 2: {step === 1 ? 'Profile & Preferences' : 'Permanent Voice Note'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        {/* STEP 1: Details */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            {/* Avatar picker */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Choose Profile Photo
              </label>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {AVATAR_PRESETS.map((pic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, profilePicture: pic })}
                    className={`relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                      formData.profilePicture === pic 
                        ? 'border-rose-500 ring-2 ring-rose-500/40 scale-105' 
                        : 'border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={pic} alt="Avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Sarah Nfor"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. Sarah"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+237 671 234 567"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Password / Security PIN
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="password"
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="4-digit PIN"
                    maxLength={8}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Town / City (Location)
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <select
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value as TownLocation })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-rose-500 appearance-none"
                  >
                    {CAMEROON_TOWNS.map(t => (
                      <option key={t} value={t}>{t}, Cameroon</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="female">Woman</option>
                  <option value="male">Man</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Looking For
                </label>
                <select
                  value={formData.genderPreference}
                  onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value as any })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="everyone">Everyone</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Relationship Intention
              </label>
              <select
                value={formData.relationshipIntention}
                onChange={(e) => setFormData({ ...formData, relationshipIntention: e.target.value as RelationshipIntention })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {RELATIONSHIP_INTENTIONS.map(intent => (
                  <option key={intent} value={intent}>{intent}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Short Bio
              </label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="What makes you spark? Passions, hobbies, weekend vibes..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Interests (Select up to 6)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map(interest => {
                  const selected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                        selected
                          ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/40'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xl shadow-rose-500/25 transition"
              >
                <span>Continue to Mandatory Voice Registration</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Mandatory Voice Registration */}
        {step === 2 && (
          <div className="space-y-5">
            <AudioRecorder
              isRegistration={true}
              userName={formData.displayName || 'You'}
              onRecordingComplete={handleVoiceCompleted}
              title="Record Your Registration Voice"
              description="JudmiSpark uses permanent voice introductions to verify real people and eliminate bots."
            />

            {recordedVoice && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Permanent voice note ready! Duration: {recordedVoice.duration}s.</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              
              <button
                id="submit-registration-btn"
                type="button"
                disabled={!recordedVoice}
                onClick={handleFinalSubmit}
                className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
                  recordedVoice
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl shadow-rose-500/25 cursor-pointer'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                }`}
              >
                <Sparkles size={14} />
                Complete Registration & Discover
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
