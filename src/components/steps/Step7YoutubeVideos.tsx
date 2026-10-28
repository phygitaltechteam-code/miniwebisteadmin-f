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
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-none scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E0E0E0] mb-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-[#2196F3]/10 text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            7
          </div>
          <h2 className="text-sm font-semibold text-[#000000DE] leading-tight">
            YouTube Video Gallery
          </h2>
        </div>

        <GenericButton
          type="button"
          onClick={() => setShowAddForm(true)}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] text-white !px-3 !py-1.5 !text-[13px] font-medium rounded flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add YouTube Video</span>
          <span className="sm:hidden">Add Video</span>
        </GenericButton>
      </div>

      {/* Add Video Inline Form */}
      {showAddForm && (
        <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
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
            <div>
              <div className="rounded-lg overflow-hidden border border-[#E0E0E0] aspect-video max-w-md bg-black">
                <iframe
                  src={getEmbedUrl(videoUrl)}
                  title="YouTube Preview"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded text-[13px] font-medium text-[#757575] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <GenericButton
              type="button"
              onClick={handleAddVideo}
              className="!bg-[#2196F3] hover:!bg-[#1E88E5] text-white !px-4 !py-1.5 !text-[13px] font-medium rounded shadow-none"
            >
              Save Video
            </GenericButton>
          </div>
        </div>
      )}

      {/* Video List */}
      {profile.youtubeVideos.length === 0 ? (
        <div className="p-4 border border-dashed border-[#E0E0E0] rounded-lg text-center flex flex-col items-center justify-center gap-1.5 bg-[#FAFAFA]">
          <Video className="w-7 h-7 text-[#9E9E9E]" />
          <p className="text-[13px] font-medium text-[#757575]">No YouTube videos added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {profile.youtubeVideos.map((video) => {
            const embed = video.embedUrl || getEmbedUrl(video.url || video.videoUrl || '');
            return (
              <div
                key={video.id}
                className="border border-[#E0E0E0] rounded-lg overflow-hidden bg-white hover:border-[#2196F3]/50 transition-all shadow-none flex flex-col"
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
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-medium text-[#000000DE] truncate">
                      {video.title}
                    </h4>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#2196F3] hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{video.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="p-1.5 text-[#757575] hover:text-[#D32F2F] rounded hover:bg-red-50 transition-colors shrink-0"
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
      <div className="mt-3.5 pt-2.5 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 sm:px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[13px] sm:text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous: Photo Gallery</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-4 sm:!px-6 !py-2 !text-[13px] sm:!text-[14px] !font-medium rounded flex items-center gap-2 whitespace-nowrap text-white shadow-none disabled:opacity-60"
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
