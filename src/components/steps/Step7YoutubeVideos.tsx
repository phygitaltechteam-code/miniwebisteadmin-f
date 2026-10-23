import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Video, Plus, Trash2, ArrowRight, ArrowLeft, Play, ExternalLink, Loader2 
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step7YoutubeVideosSchema } from '@/schemas/cardProfileSchema';
import { 
  getCustomerVideos, 
  saveOrUpdateCustomerVideos,
  parseCustomerVideosResponse,
  deleteCustomerVideo
} from '@/lib/api/customerVideosApi';

interface Step7Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step7YoutubeVideos: React.FC<Step7Props> = ({
  profile,
  onChange,
  onNext,
  onPrev,
  onToast,
  adminId,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch existing video embeds on mount (GET customers/videos or superAdmin/admin/:adminId/videos)
  useEffect(() => {
    let isMounted = true;
    const loadVideos = async () => {
      try {
        const res = await getCustomerVideos(adminId);
        const normalized = parseCustomerVideosResponse(res);
        if (isMounted && normalized.length > 0 && (!profile.youtubeVideos || profile.youtubeVideos.length === 0)) {
          onChange('youtubeVideos', normalized);
        }
      } catch (err) {
        // Normal if videos not saved yet
      }
    };
    loadVideos();
    return () => { isMounted = false; };
  }, [adminId]);

  // Helper to extract YouTube embed URL
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('embed/')) return url;
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes('watch?v=')) {
        const id = url.split('watch?v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const handleAddVideo = () => {
    if (!videoTitle.trim()) {
      onToast('Please enter a video presentation title.');
      return;
    }
    if (!videoUrl.trim()) {
      onToast('Please enter a valid YouTube video link.');
      return;
    }

    const newVid = {
      id: `vid-${Date.now()}`,
      title: videoTitle.trim(),
      url: videoUrl.trim(),
      videoUrl: videoUrl.trim(),
      link: videoUrl.trim(),
    };

    onChange('youtubeVideos', [...profile.youtubeVideos, newVid]);
    setVideoTitle('');
    setVideoUrl('');
    setShowAddForm(false);
    onToast(`Added video presentation: "${newVid.title}"`);
  };

  const handleDeleteVideo = (id: string) => {
    deleteCustomerVideo(id, adminId);
    onChange('youtubeVideos', profile.youtubeVideos.filter(v => v.id !== id));
    onToast('Video embed removed from gallery.');
  };

  const handleSaveAndNext = async () => {
    const result = step7YoutubeVideosSchema.safeParse({
      youtubeVideos: (profile.youtubeVideos || []).map(v => ({
        id: v.id,
        title: v.title,
        url: v.url || v.link || '',
      })),
    });

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Please check video entries';
      toast.error(`Validation: ${msg}`, { id: 'save-step7' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Syncing YouTube videos to customers/videos API...');
    onToast('Submitting video links to server...');

    try {
      const res = await saveOrUpdateCustomerVideos(profile.youtubeVideos || [], adminId);
      const serverMsg = res?.message || 'Step 7: YouTube Video Gallery saved successfully!';
      const displayMsg = `${serverMsg} (customers/videos)`;

      toast.success(displayMsg, { id: toastId, duration: 4000 });
      onToast(`✅ ${displayMsg}`);
      onNext();
    } catch (error: any) {
      console.error('[Step7YoutubeVideos] API Error on customers/videos:', error);
      const backendErrors = error?.response?.data?.errors;
      let fieldError = '';
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        fieldError = backendErrors
          .map((e: any) => `${e.field ? e.field + ': ' : ''}${e.message}`)
          .join(', ');
      }
      const backendMessage =
        fieldError ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to sync YouTube videos to customers/videos API.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';

      const errText = `API Error${statusCode}: ${backendMessage}`;
      toast.error(errText, { id: toastId, duration: 5000 });
      onToast(`❌ ${errText}`);
      if (error?.response?.status !== 400) {
        onNext();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-[#c5c6cd]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs scroll-mt-28" id="sec-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-[#c5c6cd]/40 mb-3.5 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            7
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
              YouTube Video Gallery
            </h2>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#2563EB] text-white font-bold shrink-0">
              {profile.youtubeVideos.length}
            </span>
          </div>
        </div>

        <GenericButton
          type="button"
          onClick={() => setShowAddForm(true)}
          className="!px-2.5 sm:!px-4 !py-1 sm:!py-2 !text-xs font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-md shadow-[#2563EB]/20"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add YouTube Video</span>
          <span className="sm:hidden">Add Video</span>
        </GenericButton>
      </div>

      {/* Add Video Inline Form */}
      {showAddForm && (
        <div className="mb-4 sm:mb-6 p-3.5 sm:p-5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] space-y-3.5 sm:space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <h4 className="text-xs font-bold text-[#091426] uppercase tracking-wider">
            Add YouTube Video Embed
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GenericInputField
              label="Video Title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="e.g. MEA Vision & Sangli Industrial Conclave Teaser"
              required
            />

            <GenericInputField
              label="YouTube Video Link"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              required
            />
          </div>

          {/* Live Preview if valid link */}
          {videoUrl.trim() && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider block mb-2">
                Live Embed Preview
              </span>
              <div className="rounded-xl overflow-hidden border border-stroke aspect-video max-w-md bg-black">
                <iframe
                  src={getEmbedUrl(videoUrl)}
                  title="YouTube Preview"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#BFDBFE]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#45474c] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <GenericButton
              type="button"
              onClick={handleAddVideo}
              className="!px-5 !py-2 !text-xs font-bold"
            >
              Save Video
            </GenericButton>
          </div>
        </div>
      )}

      {/* Video List */}
      {profile.youtubeVideos.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-stroke rounded-2xl text-center flex flex-col items-center justify-center gap-3 bg-[#f8f9ff]">
          <Video className="w-10 h-10 text-gray-300" />
          <div>
            <p className="text-xs font-bold text-gray-700">No YouTube videos added yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Click "+ Add YouTube Video" to embed presentations into your digital card</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.youtubeVideos.map((video) => {
            const embed = video.embedUrl || getEmbedUrl(video.url || video.videoUrl || '');
            return (
              <div
                key={video.id}
                className="border border-stroke rounded-2xl overflow-hidden bg-white hover:border-[#2563EB]/40 transition-all shadow-2xs flex flex-col"
              >
                {/* Embedded Player */}
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={embed}
                    title={video.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>

                {/* Details Bar */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#091426] truncate">
                      {video.title}
                    </h4>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{video.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="p-2 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                    title="Delete Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step Navigation Buttons */}
      <div className="mt-5 pt-4 sm:mt-8 sm:pt-5 border-t border-[#c5c6cd]/40 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#f8f9ff] flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous: Photo Gallery</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!px-6 !py-2.5 !text-xs !font-bold flex items-center gap-2 shadow-md shadow-[#2563EB]/25 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Videos...</span>
            </>
          ) : (
            <>
              <span>Save & Next</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GenericButton>
      </div>
    </section>
  );
};
