import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Image as ImageIcon, Plus, Trash2, ArrowRight, ArrowLeft, Upload, X, Loader2 
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step6GallerySchema } from '@/schemas/cardProfileSchema';
import { compressImage } from '@/utils/imageCompressor';
import { 
  getCustomerGallery, 
  saveOrUpdateCustomerGallery,
  parseCustomerGalleryResponse
} from '@/lib/api/customerGalleryApi';

interface Step6Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step6GalleryMedia: React.FC<Step6Props> = ({
  profile,
  onChange,
  onNext,
  onPrev,
  onToast,
  adminId,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch existing photo gallery on mount (GET customers/gallery or superAdmin/admin/:adminId/gallery)
  useEffect(() => {
    let isMounted = true;
    const loadGallery = async () => {
      try {
        const res = await getCustomerGallery(adminId);
        const normalized = parseCustomerGalleryResponse(res);
        if (isMounted && normalized.length > 0 && (!profile.galleryImages || profile.galleryImages.length === 0)) {
          onChange('galleryImages', normalized);
        }
      } catch (err) {
        // Normal if gallery not saved yet
      }
    };
    loadGallery();
    return () => { isMounted = false; };
  }, [adminId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedRawFile(file);
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 1200, 800, 0.82);
      setSelectedFileUrl(compressed);
      if (!photoTitle) {
        setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      onToast('Photo selected and compressed successfully.');
    } catch {
      setSelectedFileUrl(URL.createObjectURL(file));
      if (!photoTitle) {
        setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddPhoto = () => {
    if (!photoTitle.trim()) {
      onToast('Please enter a photo title.');
      return;
    }
    if (!selectedFileUrl) {
      onToast('Please select and upload an image.');
      return;
    }

    const newPhoto = {
      id: `img-${Date.now()}`,
      url: selectedFileUrl,
      image: selectedFileUrl,
      title: photoTitle.trim(),
      description: photoDesc.trim(),
      alt: photoTitle.trim(),
      file: selectedRawFile || undefined,
    };

    onChange('galleryImages', [...profile.galleryImages, newPhoto]);
    setPhotoTitle('');
    setPhotoDesc('');
    setSelectedFileUrl(null);
    setSelectedRawFile(null);
    setShowAddForm(false);
    onToast(`Added photo: "${newPhoto.title}" to gallery.`);
  };

  const handleDeletePhoto = (id: string) => {
    onChange('galleryImages', profile.galleryImages.filter(img => img.id !== id));
    onToast('Photo removed from gallery.');
  };

  const handleSaveAndNext = async () => {
    const result = step6GallerySchema.safeParse({
      galleryImages: (profile.galleryImages || []).map(img => ({
        id: img.id,
        url: img.url,
        image: img.image || img.url,
        title: img.title,
        description: img.description,
        alt: img.alt,
      })),
    });

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Please check gallery entries';
      toast.error(`Validation: ${msg}`, { id: 'save-step6' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Syncing photo gallery to customers/gallery API...');
    onToast('Submitting photos to server...');

    try {
      // Sends array of { title, description, image }
      const res = await saveOrUpdateCustomerGallery(profile.galleryImages || [], adminId);
      const serverMsg = res?.message || 'Step 6: Photo Gallery saved successfully!';
      const displayMsg = `${serverMsg} (customers/gallery)`;

      toast.success(displayMsg, { id: toastId, duration: 4000 });
      onToast(`✅ ${displayMsg}`);
      onNext();
    } catch (error: any) {
      console.error('[Step6GalleryMedia] API Error on customers/gallery:', error);
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
        'Failed to sync gallery to customers/gallery API.';
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
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-none scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E0E0E0] mb-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-[#2196F3]/10 text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            6
          </div>
          <h2 className="text-sm font-semibold text-[#000000DE] leading-tight">
            Photo Gallery
          </h2>
        </div>

        <GenericButton
          type="button"
          onClick={() => setShowAddForm(true)}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] text-white !px-3 !py-1.5 !text-[13px] font-medium rounded flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Photo</span>
        </GenericButton>
      </div>

      {/* Add Photo Inline Form */}
      {showAddForm && (
        <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <GenericInputField
              label="Photo Title"
              value={photoTitle}
              onChange={(e) => setPhotoTitle(e.target.value)}
              placeholder="e.g. Annual Business Conclave Stage / Main Office"
              required
            />

            <GenericInputField
              label="Photo Description"
              value={photoDesc}
              onChange={(e) => setPhotoDesc(e.target.value)}
              placeholder="e.g. Keynote address by founder leaders & members"
            />
          </div>

          {/* Image Upload & Live Preview Area */}
          <div>
            <label className="block text-[12px] font-medium text-[#000000DE] mb-1">
              Photo Upload <span className="text-[#D32F2F]">*</span>
            </label>

            {selectedFileUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[#E0E0E0] aspect-video max-w-md bg-black">
                <img
                  src={selectedFileUrl}
                  alt="Selected Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedFileUrl(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer border border-dashed border-[#C4C4C4] hover:border-[#2196F3] rounded-lg p-3 flex flex-col items-center justify-center text-center bg-white transition-colors max-w-md">
                <Upload className="w-6 h-6 text-[#2196F3] mb-1" />
                <span className="text-[13px] font-medium text-[#000000DE]">
                  {isCompressing ? 'Compressing image...' : 'Click to Upload Image'}
                </span>
                <span className="text-[11px] text-[#757575] mt-0.5">JPG, PNG, WEBP (auto-compressed)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setSelectedFileUrl(null);
                setPhotoTitle('');
                setPhotoDesc('');
              }}
              className="px-3 py-1.5 rounded text-[13px] font-medium text-[#757575] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <GenericButton
              type="button"
              onClick={handleAddPhoto}
              className="!bg-[#2196F3] hover:!bg-[#1E88E5] text-white !px-4 !py-1.5 !text-[13px] font-medium rounded shadow-none"
            >
              Save Photo
            </GenericButton>
          </div>
        </div>
      )}

      {/* Photo Grid List (Identical layout to YouTube Videos list) */}
      {profile.galleryImages.length === 0 ? (
        <div className="p-4 border border-dashed border-[#E0E0E0] rounded-lg text-center flex flex-col items-center justify-center gap-1.5 bg-[#FAFAFA]">
          <ImageIcon className="w-7 h-7 text-[#9E9E9E]" />
          <p className="text-[13px] font-medium text-[#757575]">No photos added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {profile.galleryImages.map((photo) => (
            <div
              key={photo.id}
              className="border border-[#E0E0E0] rounded-lg overflow-hidden bg-white hover:border-[#2196F3]/50 transition-all shadow-none flex flex-col"
            >
              {/* Image Thumbnail Display */}
              <div className="aspect-video w-full bg-slate-900 overflow-hidden relative group">
                <img
                  src={photo.url}
                  alt={photo.title || photo.alt || 'Gallery photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Details Bar */}
              <div className="p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-[13px] font-medium text-[#000000DE] truncate">
                    {photo.title || 'Untitled Photo'}
                  </h4>
                  {photo.description && (
                    <p className="text-[12px] text-[#757575] truncate mt-0.5">
                      {photo.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="p-1.5 text-[#757575] hover:text-[#D32F2F] rounded hover:bg-red-50 transition-colors shrink-0"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
          <span className="hidden sm:inline">Previous: Payment & QR</span>
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
              <span>Saving Gallery...</span>
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
