import React, { useState, useRef } from 'react';
import { UserProfile, ProfileVideo } from '../types';
import { 
  Camera, 
  Video as VideoIcon, 
  Plus, 
  Trash2, 
  Star, 
  Play, 
  Pause, 
  X, 
  AlertCircle, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface MediaGalleryProps {
  user: UserProfile;
  isEditable?: boolean;
  onUpdateMedia: (newPhotos: string[], newVideos: ProfileVideo[], newProfilePic?: string) => void;
}

// Curated high-quality presets for testing or quick photo selection
const SAMPLE_PHOTO_PRESETS = [
  { label: 'Yaoundé Cafe', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { label: 'Douala Fashion', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80' },
  { label: 'Buea Mountain View', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { label: 'Bamenda Studio', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80' },
  { label: 'Limbe Beach Sunset', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' }
];

const SAMPLE_VIDEO_PRESETS = [
  {
    title: 'Weekend in Limbe (24s)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-sitting-in-a-park-listening-to-music-40546-small.mp4',
    duration: 24
  },
  {
    title: 'Acoustic Guitar Intro (18s)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-an-acoustic-guitar-41132-small.mp4',
    duration: 18
  }
];

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  user,
  isEditable = true,
  onUpdateMedia
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  
  // Upload modal states
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fullscreen Viewer states
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<ProfileVideo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const photos = user.photos || (user.profilePicture ? [user.profilePicture] : []);
  const videos = user.videos || [];

  // ================= PHOTOS LOGIC (UP TO 7) =================
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 7) {
      setErrorMessage('You can only have up to 7 photos. Please delete one before adding another.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updatedPhotos = [...photos, dataUrl];
        onUpdateMedia(updatedPhotos, videos);
        setIsAddPhotoOpen(false);
        setIsLoading(false);
        setStatusMessage('Photo uploaded successfully.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try another image.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (photoFileInputRef.current) photoFileInputRef.current.value = '';
  };

  const handleAddPhotoByUrl = (urlToAdd: string) => {
    if (!urlToAdd.trim()) return;
    if (photos.length >= 7) {
      setErrorMessage('You can only have up to 7 photos. Please delete one before adding another.');
      return;
    }

    const updatedPhotos = [...photos, urlToAdd.trim()];
    onUpdateMedia(updatedPhotos, videos);
    setPhotoUrlInput('');
    setIsAddPhotoOpen(false);
    setErrorMessage(null);
    setStatusMessage('Photo added successfully.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeletePhoto = (indexToDelete: number) => {
    const photoToDelete = photos[indexToDelete];
    const updatedPhotos = photos.filter((_, idx) => idx !== indexToDelete);
    
    // If the deleted photo was the user's primary profile picture, update profile picture to another photo
    let newProfilePic = user.profilePicture;
    if (user.profilePicture === photoToDelete || !updatedPhotos.includes(user.profilePicture)) {
      newProfilePic = updatedPhotos[0] || '';
    }

    onUpdateMedia(updatedPhotos, videos, newProfilePic);
    if (previewPhotoIndex !== null) {
      setPreviewPhotoIndex(null);
    }
    setStatusMessage('Photo removed from your profile.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSetAsPrimary = (photoUrl: string) => {
    onUpdateMedia(photos, videos, photoUrl);
    setStatusMessage('Set as main profile picture.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // ================= VIDEOS LOGIC (UP TO 2, MAX 1 MIN) =================
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videos.length >= 2) {
      setErrorMessage('You can only upload up to 2 videos. Please remove an existing video first.');
      return;
    }

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Create temporary video to check duration strictly (max 60 seconds / 1 min)
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const rawDuration = tempVideo.duration;

      // Allow a small 0.5s tolerance for encoder rounding
      if (rawDuration > 60.5) {
        setIsLoading(false);
        setErrorMessage(
          `Video is ${Math.round(rawDuration)} seconds long. Videos must be maximum 1 minute (60 seconds) in length.`
        );
        return;
      }

      // Valid video! Convert to base64 or object URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newVideo: ProfileVideo = {
          id: `vid_${Date.now()}`,
          url: dataUrl || objectUrl,
          duration: Math.round(rawDuration),
          title: videoTitleInput.trim() || `Video #${videos.length + 1}`,
          createdAt: new Date().toISOString()
        };

        const updatedVideos = [...videos, newVideo];
        onUpdateMedia(photos, updatedVideos);
        setIsAddVideoOpen(false);
        setVideoTitleInput('');
        setIsLoading(false);
      };
      reader.onerror = () => {
        setErrorMessage('Failed to process video file.');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setErrorMessage('Could not determine video length. Please verify it is a standard video format.');
      setIsLoading(false);
    };

    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  };

  const handleAddVideoByPreset = (preset: { title: string; url: string; duration: number }) => {
    if (videos.length >= 2) {
      setErrorMessage('You can only upload up to 2 videos.');
      return;
    }

    const newVideo: ProfileVideo = {
      id: `vid_${Date.now()}`,
      url: preset.url,
      duration: preset.duration,
      title: preset.title,
      createdAt: new Date().toISOString()
    };

    onUpdateMedia(photos, [...videos, newVideo]);
    setIsAddVideoOpen(false);
    setErrorMessage(null);
  };

  const handleAddVideoByUrl = () => {
    if (!videoUrlInput.trim()) return;
    if (videos.length >= 2) {
      setErrorMessage('You can only upload up to 2 videos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Verify duration of the URL
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = videoUrlInput.trim();

    tempVideo.onloadedmetadata = () => {
      const rawDuration = tempVideo.duration;
      if (rawDuration > 60.5) {
        setIsLoading(false);
        setErrorMessage(
          `Video is ${Math.round(rawDuration)} seconds long. Maximum length is 1 minute (60s).`
        );
        return;
      }

      const newVideo: ProfileVideo = {
        id: `vid_${Date.now()}`,
        url: videoUrlInput.trim(),
        duration: Math.round(rawDuration) || 30,
        title: videoTitleInput.trim() || `Video #${videos.length + 1}`,
        createdAt: new Date().toISOString()
      };

      onUpdateMedia(photos, [...videos, newVideo]);
      setIsAddVideoOpen(false);
      setVideoUrlInput('');
      setVideoTitleInput('');
      setIsLoading(false);
    };

    tempVideo.onerror = () => {
      // If CORS prevents metadata check on remote URL, still allow adding but flag default
      const newVideo: ProfileVideo = {
        id: `vid_${Date.now()}`,
        url: videoUrlInput.trim(),
        duration: 30,
        title: videoTitleInput.trim() || `Video #${videos.length + 1}`,
        createdAt: new Date().toISOString()
      };
      onUpdateMedia(photos, [...videos, newVideo]);
      setIsAddVideoOpen(false);
      setVideoUrlInput('');
      setVideoTitleInput('');
      setIsLoading(false);
    };
  };

  const handleDeleteVideo = (videoId: string) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    onUpdateMedia(photos, updatedVideos);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white border border-[#EFE3DB] rounded-3xl p-5 space-y-4 shadow-sm">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[#FAF4F0] rounded-2xl border border-[#E5D7CE]">
            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white shadow-xs'
                  : 'text-[#8A767E] hover:text-[#2D151E]'
              }`}
            >
              <Camera size={14} />
              <span>Photos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'photos' ? 'bg-white/25 text-white' : 'bg-white text-[#8A767E] border border-[#E5D7CE]'
              }`}>
                {photos.length}/7
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white shadow-xs'
                  : 'text-[#8A767E] hover:text-[#2D151E]'
              }`}
            >
              <VideoIcon size={14} />
              <span>Videos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'videos' ? 'bg-white/25 text-white' : 'bg-white text-[#8A767E] border border-[#E5D7CE]'
              }`}>
                {videos.length}/2
              </span>
            </button>
          </div>
        </div>

        {/* Action Button for Current Tab */}
        {isEditable && (
          <div>
            {activeTab === 'photos' ? (
              photos.length < 7 ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsAddPhotoOpen(true);
                  }}
                  className="py-1.5 px-3 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] border border-[#E5D7CE] text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <Plus size={14} className="text-[#FF4A70]" />
                  <span>Add Photo</span>
                </button>
              ) : (
                <span className="text-[10px] font-bold text-[#8A767E] bg-[#FAF4F0] px-2 py-1 rounded-full border border-[#E5D7CE]">
                  Max 7 Photos
                </span>
              )
            ) : (
              videos.length < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsAddVideoOpen(true);
                  }}
                  className="py-1.5 px-3 rounded-full bg-[#FAF4F0] hover:bg-[#F2E7DF] text-[#2D151E] border border-[#E5D7CE] text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <Plus size={14} className="text-[#FF4A70]" />
                  <span>Add Video (≤1m)</span>
                </button>
              ) : (
                <span className="text-[10px] font-bold text-[#8A767E] bg-[#FAF4F0] px-2 py-1 rounded-full border border-[#E5D7CE]">
                  Max 2 Videos
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* ================= PHOTOS TAB CONTENT ================= */}
      {activeTab === 'photos' && (
        <div className="space-y-3">
          {/* Status feedback message */}
          {statusMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#8A767E]">
            <span>Showcase your personality, hobbies & daily life in Cameroon.</span>
            <span className="font-semibold text-[#FF4A70]">{7 - photos.length} slots free</span>
          </div>

          {/* Empty state when 0 photos */}
          {photos.length === 0 ? (
            <div className="py-8 px-4 text-center bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#FF4A70] flex items-center justify-center mx-auto border border-[#E5D7CE] shadow-2xs">
                <Camera size={24} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D151E]">No Photos Added Yet</h4>
                <p className="text-[11px] text-[#8A767E] max-w-xs mx-auto mt-0.5">
                  Upload up to 7 photos to showcase your lifestyle, vibes, and authentic personality!
                </p>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsAddPhotoOpen(true);
                  }}
                  className="py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F73B66] to-[#FF874F] hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Upload First Photo</span>
                </button>
              )}
            </div>
          ) : (
            /* Photos Grid */
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {photos.map((photoUrl, idx) => {
                const isPrimary = photoUrl === user.profilePicture;
                return (
                  <div
                    key={`photo_${idx}_${photoUrl.slice(-15)}`}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF4F0] border border-[#E5D7CE] hover:border-[#FF4A70]/60 transition shadow-xs"
                  >
                    <img
                      src={photoUrl}
                      alt={`User photo ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewPhotoIndex(idx)}
                    />

                    {/* Top-Left: Primary Avatar Star */}
                    {isPrimary ? (
                      <div 
                        title="Primary Profile Picture" 
                        className="absolute top-1.5 left-1.5 z-20 w-6 h-6 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center shadow-md pointer-events-none"
                      >
                        <Star size={12} className="fill-current" />
                      </div>
                    ) : isEditable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetAsPrimary(photoUrl);
                        }}
                        title="Set as Main Profile Picture"
                        aria-label="Set as Main Profile Picture"
                        className="absolute top-1.5 left-1.5 z-20 w-6 h-6 rounded-lg bg-black/60 hover:bg-amber-400 hover:text-neutral-950 text-white flex items-center justify-center transition shadow-md cursor-pointer"
                      >
                        <Star size={12} />
                      </button>
                    ) : null}

                    {/* Top-Right: ALWAYS VISIBLE DELETE BUTTON FOR EDITABLE PROFILE */}
                    {isEditable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(idx);
                        }}
                        title="Delete this photo"
                        aria-label="Delete this photo"
                        className="absolute top-1.5 right-1.5 z-20 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition transform active:scale-90 cursor-pointer backdrop-blur-xs"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    {/* Bottom bar: View / Photo number */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-1.5 flex items-center justify-between pointer-events-none">
                      <span className="text-[9px] text-white/90 font-mono font-medium px-1">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPhotoIndex(idx);
                        }}
                        className="pointer-events-auto text-[9px] text-white/90 bg-black/50 hover:bg-black/80 px-1.5 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer"
                      >
                        <Maximize2 size={9} />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty upload slot if < 7 photos */}
              {isEditable && photos.length < 7 && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsAddPhotoOpen(true);
                  }}
                  className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[#E5D7CE] hover:border-[#FF4A70] bg-[#FAF4F0] hover:bg-[#F2E7DF] transition flex flex-col items-center justify-center gap-1.5 text-[#8A767E] hover:text-[#FF4A70] group p-2 text-center cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E5D7CE] group-hover:border-[#FF4A70]/50 flex items-center justify-center transition shadow-2xs">
                    <Plus size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-[#2D151E]">Add Photo</span>
                  <span className="text-[9px] text-[#8A767E]">Slot {photos.length + 1}/7</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= VIDEOS TAB CONTENT (MAX 2, ≤1 MIN) ================= */}
      {activeTab === 'videos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#8A767E]">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-amber-600" />
              <span>Record or upload personal intro videos (max 1 minute / 60s long).</span>
            </span>
            <span className="font-semibold text-[#FF4A70]">{2 - videos.length} slots free</span>
          </div>

          {videos.length === 0 ? (
            <div className="py-8 px-4 text-center bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#FF4A70] flex items-center justify-center mx-auto border border-[#E5D7CE] shadow-2xs">
                <VideoIcon size={24} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D151E]">No Profile Videos Added Yet</h4>
                <p className="text-[11px] text-[#8A767E] max-w-xs mx-auto mt-0.5">
                  Show your authentic vibe! Users with a short 30-60 second video get 3x more Spark replies and matches.
                </p>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsAddVideoOpen(true);
                  }}
                  className="py-2 px-4 rounded-full bg-gradient-to-r from-[#F73B66] to-[#FF874F] text-white font-bold text-xs shadow-md shadow-rose-500/20 inline-flex items-center gap-1.5 transition cursor-pointer hover:opacity-95"
                >
                  <Plus size={14} />
                  <span>Upload Video (Max 1 min)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl overflow-hidden flex flex-col group relative shadow-2xs"
                >
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video
                      src={vid.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />

                    {/* Play button overlay */}
                    <button
                      type="button"
                      onClick={() => setActiveVideoModal(vid)}
                      className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FF4A70] text-white flex items-center justify-center shadow-xl transition group-hover:scale-110">
                        <Play size={20} className="fill-current ml-1" />
                      </div>
                    </button>

                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white flex items-center gap-1 border border-white/10">
                      <Clock size={10} className="text-amber-400" />
                      <span>{formatSeconds(vid.duration)} / 1:00</span>
                    </div>

                    {/* Delete button */}
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(vid.id)}
                        title="Delete Video"
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 hover:bg-rose-600 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-[#2D151E] truncate max-w-[200px]">
                        {vid.title || 'Profile Video'}
                      </h5>
                      <span className="text-[10px] text-[#8A767E]">
                        Max 1 min duration enforced
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveVideoModal(vid)}
                      className="text-xs font-bold text-[#FF4A70] hover:opacity-80 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Play</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Slot to add second video if 1/2 */}
              {isEditable && videos.length === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsAddVideoOpen(true);
                  }}
                  className="aspect-video rounded-2xl border-2 border-dashed border-[#E5D7CE] hover:border-[#FF4A70] bg-[#FAF4F0] hover:bg-[#F2E7DF] transition flex flex-col items-center justify-center gap-1.5 text-[#8A767E] hover:text-[#FF4A70] group p-3 text-center cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-white border border-[#E5D7CE] group-hover:border-[#FF4A70]/50 flex items-center justify-center transition shadow-2xs">
                    <Plus size={18} />
                  </div>
                  <span className="text-xs font-bold text-[#2D151E]">Add 2nd Video</span>
                  <span className="text-[10px] text-[#8A767E]">Max 1 minute (60 seconds)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= ADD PHOTO MODAL ================= */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-2">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-[#FF4A70]" />
                <h3 className="text-sm font-bold text-[#2D151E]">Add Photo (Up to 7)</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddPhotoOpen(false);
                  setErrorMessage(null);
                }}
                className="text-[#8A767E] hover:text-[#2D151E] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Upload from device */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#2D151E] block">
                Option 1: Upload from Device / Camera
              </span>
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-[#FAF4F0] border border-[#E5D7CE] hover:border-[#FF4A70] hover:bg-[#F2E7DF] text-[#2D151E] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload size={16} className="text-[#FF4A70]" />
                <span>{isLoading ? 'Processing Photo...' : 'Choose Photo File or Snap Camera'}</span>
              </button>
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-2 border-t border-[#EFE3DB] pt-3">
              <span className="text-xs font-bold text-[#2D151E] block">
                Option 2: Add by Web URL
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="flex-1 bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
                />
                <button
                  type="button"
                  onClick={() => handleAddPhotoByUrl(photoUrlInput)}
                  className="py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F73B66] to-[#FF874F] hover:opacity-95 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Option 3: Presets */}
            <div className="space-y-1.5 border-t border-[#EFE3DB] pt-3">
              <span className="text-[11px] font-bold text-[#8A767E] uppercase tracking-wider block">
                Quick Cameroon Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_PHOTO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPhotoByUrl(p.url)}
                    className="p-1.5 rounded-xl bg-[#FAF4F0] hover:bg-[#F2E7DF] border border-[#E5D7CE] text-[11px] text-[#5C454F] hover:text-[#2D151E] text-left truncate transition cursor-pointer"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD VIDEO MODAL (MAX 1 MIN) ================= */}
      {isAddVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-white border border-[#EFE3DB] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE3DB] pb-2">
              <div className="flex items-center gap-2">
                <VideoIcon size={16} className="text-[#FF4A70]" />
                <h3 className="text-sm font-bold text-[#2D151E]">Add Video (Max 1 Minute)</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddVideoOpen(false);
                  setErrorMessage(null);
                }}
                className="text-[#8A767E] hover:text-[#2D151E] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <div className="bg-[#FAF4F0] border border-[#E5D7CE] rounded-2xl p-3 text-[11px] text-[#8A767E] flex items-center gap-2">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong className="text-[#2D151E]">1-Minute Limit:</strong> Videos longer than 60 seconds are automatically detected and rejected to ensure fast loading for everyone.
              </span>
            </div>

            {/* Video Title */}
            <div>
              <label className="block text-xs font-semibold text-[#2D151E] mb-1">
                Video Title / Caption (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. My Sunday cooking vibe in Douala"
                value={videoTitleInput}
                onChange={(e) => setVideoTitleInput(e.target.value)}
                className="w-full bg-[#FAF4F0] border border-[#E5D7CE] rounded-xl p-2.5 text-xs text-[#2D151E] placeholder-[#8A767E] focus:outline-none focus:border-[#FF4A70]"
              />
            </div>

            {/* Option 1: File Upload */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#2D151E] block">
                Upload Video File
              </span>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-[#FAF4F0] border border-[#E5D7CE] hover:border-[#FF4A70] hover:bg-[#F2E7DF] text-[#2D151E] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload size={16} className="text-[#FF4A70]" />
                <span>{isLoading ? 'Checking Duration & Loading...' : 'Choose Video (≤ 60s)'}</span>
              </button>
            </div>

            {/* Option 2: Presets for instant test */}
            <div className="space-y-1.5 border-t border-[#EFE3DB] pt-3">
              <span className="text-[11px] font-bold text-[#8A767E] uppercase tracking-wider block">
                Sample Verified Short Videos (Under 1 min)
              </span>
              <div className="space-y-1.5">
                {SAMPLE_VIDEO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddVideoByPreset(preset)}
                    className="w-full p-2 rounded-xl bg-[#FAF4F0] hover:bg-[#F2E7DF] border border-[#E5D7CE] text-xs text-[#2D151E] flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{preset.title}</span>
                    <span className="text-[10px] text-amber-600 font-mono font-bold">
                      {preset.duration}s ✓
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= FULLSCREEN PHOTO LIGHTBOX ================= */}
      {previewPhotoIndex !== null && photos[previewPhotoIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <button
            type="button"
            onClick={() => setPreviewPhotoIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition z-50 cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Left Arrow */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => setPreviewPhotoIndex((previewPhotoIndex - 1 + photos.length) % photos.length)}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition z-50 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Image */}
          <div className="max-w-3xl max-h-[80vh] flex flex-col items-center">
            <img
              src={photos[previewPhotoIndex]}
              alt={`Full photo ${previewPhotoIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs font-bold text-white">
                Photo {previewPhotoIndex + 1} of {photos.length}
              </span>
              {isEditable && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSetAsPrimary(photos[previewPhotoIndex])}
                    className="py-1.5 px-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Star size={12} className="fill-current" />
                    <span>Set as Avatar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(previewPhotoIndex)}
                    className="py-1.5 px-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Delete Photo</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Arrow */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => setPreviewPhotoIndex((previewPhotoIndex + 1) % photos.length)}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition z-50 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}

      {/* ================= FULLSCREEN VIDEO MODAL PLAYER ================= */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative max-w-lg w-full bg-white border border-[#EFE3DB] rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#EFE3DB]">
              <div className="flex items-center gap-2">
                <VideoIcon size={16} className="text-[#FF4A70]" />
                <h4 className="text-sm font-bold text-[#2D151E] truncate max-w-[240px]">
                  {activeVideoModal.title || 'Profile Video'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="text-[#8A767E] hover:text-[#2D151E] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-[#FAF4F0] flex items-center justify-between text-xs text-[#8A767E]">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-amber-600" />
                <span>Duration: {formatSeconds(activeVideoModal.duration)} (Limit: 1m)</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="px-4 py-1.5 bg-[#FAF4F0] hover:bg-[#F2E7DF] border border-[#E5D7CE] text-[#2D151E] rounded-full text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
