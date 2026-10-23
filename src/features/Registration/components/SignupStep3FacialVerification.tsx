// components/SignupStep3FacialVerification.tsx
import type {FC} from 'react';
import {useState, useRef} from 'react';

interface SignupStep3FacialVerificationProps {
  onComplete: (image: File | null) => void;
  onBack: () => void;
}

const SignupStep3FacialVerification: FC<SignupStep3FacialVerificationProps> = ({
  onComplete,
  onBack,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Simulate upload/processing
      setTimeout(() => {
        setUploadedImage(file);
        setIsUploading(false);
      }, 1000);
    }
  };

  const handleContinueWithoutPhoto = () => {
    onComplete(null);
  };

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleComplete = () => {
    if (uploadedImage) {
      onComplete(uploadedImage);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="dark:bg-gray-950 flex min-h-screen w-full justify-center bg-white font-['Inter'] antialiased selection:bg-[#2563EB]/30 md:p-6">
      <div className="relative mx-auto w-full max-w-[min(390px,95vw,500px)] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 md:min-h-[700px] md:max-w-[800px]">
        {/* Hidden file input for photo upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Background elements - simplified for white theme */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="from-[#2563EB]/3 absolute -right-40 -top-40 size-[400px] rounded-full bg-gradient-to-br to-transparent blur-3xl" />
          <div className="from-[#2563EB]/3 absolute -bottom-40 -left-40 size-[400px] rounded-full bg-gradient-to-tr to-transparent blur-3xl" />
        </div>

        {/* Sticky header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white/95 p-4 pb-2 backdrop-blur-sm dark:bg-slate-900/95 md:p-6 md:pb-3">
          <button
            onClick={onBack}
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-[#0d131c] transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800 md:size-14"
          >
            <span className="material-symbols-outlined text-2xl md:text-[26px]">
              arrow_back
            </span>
          </button>
          <h2 className="flex-1 pr-12 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-[#0d131c] dark:text-white md:text-xl">
            Verify Identity
          </h2>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-2 px-6 py-4 md:px-8 md:py-6">
          <div className="flex w-full flex-row items-center justify-center gap-2 md:gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-[#2563EB]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#2563EB]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#2563EB]" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 md:text-sm">
            Step 3 of 3 • Facial Verification
          </p>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-6 pb-32 pt-2 md:px-8 md:pb-8 md:pt-4">
          <div className="text-center">
            <h2 className="pb-3 text-[28px] font-bold leading-tight tracking-tight text-[#0d131c] dark:text-white md:text-[32px]">
              Facial Verification
            </h2>
            <p className="pb-6 text-base font-normal leading-normal text-slate-600 dark:text-slate-300 md:pb-8 md:text-lg">
              Upload a clear photo of your face. This helps prevent fraud and
              keep your account secure.
            </p>
          </div>

          {/* Image upload area - tablet responsive */}
          <div className="mb-10 flex flex-col items-center justify-center md:mb-12">
            <div className="relative mx-auto h-[340px] w-[280px] md:h-[400px] md:w-[320px]">
              {/* Upload overlay frame */}
              <div
                className={`absolute inset-0 rounded-[40%] border-2 border-[#2563EB] ${
                  isUploading ? 'animate-pulse' : ''
                } pointer-events-none z-20 opacity-70`}
              />

              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[40%] border-4 border-[#2563EB] bg-white shadow-xl dark:bg-slate-900">
                {previewUrl ? (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Uploaded face"
                      className="h-full w-full rounded-[40%] object-cover"
                    />
                    <div className="absolute top-6 rounded-full bg-black/50 px-4 py-1.5 backdrop-blur-md md:top-8 md:px-5">
                      <p className="text-sm font-medium text-white md:text-base">
                        {isUploading ? 'Processing...' : 'Uploaded'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleUploadClick}
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="material-symbols-outlined text-7xl text-[#2563EB] md:text-8xl">
                      upload
                    </span>
                    <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-300 md:text-base">
                      Click to upload a photo
                    </p>
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 md:text-sm">
                      JPG, PNG or GIF • Max 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status message */}
            {isUploading ? (
              <p className="mt-6 animate-pulse text-base font-semibold text-[#2563EB] md:text-lg">
                Uploading and verifying...
              </p>
            ) : uploadedImage ? (
              <p className="mt-6 text-base font-semibold text-green-600 md:text-lg">
                ✓ Photo uploaded successfully!
              </p>
            ) : (
              <p className="mt-6 text-base font-semibold text-slate-600 md:text-lg">
                Please upload a clear photo of your face
              </p>
            )}
          </div>

          {/* Action buttons - tablet responsive */}
          <div className="mb-8 flex flex-col gap-4 md:mb-10">
            {uploadedImage ? (
              <div className="flex gap-3 md:gap-4">
                <button
                  onClick={handleRemovePhoto}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#2563EB] text-base font-semibold text-[#2563EB] transition-colors hover:bg-[#2563EB]/10 md:h-16 md:text-lg"
                >
                  <span className="material-symbols-outlined text-[20px] md:text-[22px]">
                    delete
                  </span>
                  Remove Photo
                </button>
                <button
                  onClick={handleComplete}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-base font-semibold text-white shadow-[#2563EB]/20 transition-colors hover:bg-[#1D4ED8] md:h-16 md:text-lg"
                >
                  Continue
                  <span className="material-symbols-outlined text-[20px] md:text-[22px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-base font-semibold text-white shadow-[#2563EB]/20 transition-colors ${
                  isUploading
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-[#1D4ED8]'
                } md:h-16 md:text-lg`}
              >
                <span className="material-symbols-outlined text-[20px] md:text-[22px]">
                  upload
                </span>
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            )}
          </div>

          {/* Continue without photo */}
          <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800 md:mt-10">
            <p className="mb-4 text-center text-slate-600 dark:text-slate-400 md:text-lg">
              Don't have a photo ready?
            </p>
            <button
              onClick={handleContinueWithoutPhoto}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50 md:h-16 md:text-lg"
            >
              <span className="material-symbols-outlined text-[20px] md:text-[22px]">
                arrow_forward
              </span>
              Continue Without Photo
              <span className="ml-1 text-xs text-slate-500 dark:text-slate-400 md:text-sm">
                (Optional)
              </span>
            </button>
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400 md:text-sm">
              You can complete verification later in your account settings
            </p>
          </div>

          {/* Tips - tablet responsive */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-3 md:gap-4">
            <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-800/50 md:p-5">
              <span className="material-symbols-outlined mb-2 text-2xl text-[#2563EB] md:text-3xl">
                light_mode
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 md:text-base">
                Good Lighting
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 md:text-sm">
                Well-lit, clear photo
              </p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-800/50 md:p-5">
              <span className="material-symbols-outlined mb-2 text-2xl text-[#2563EB] md:text-3xl">
                face
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 md:text-base">
                Face Forward
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 md:text-sm">
                Look directly at camera
              </p>
            </div>
            <div className="col-span-2 flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-800/50 md:col-span-1 md:p-5">
              <span className="material-symbols-outlined mb-2 text-2xl text-[#2563EB] md:text-3xl">
                photo_size_select_actual
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 md:text-base">
                Recent Photo
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 md:text-sm">
                Taken in last 6 months
              </p>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar - tablet responsive */}
        <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto w-full max-w-[min(390px,95vw,500px)] border-t border-slate-100 bg-white/95 p-6 backdrop-blur-md dark:border-slate-800 dark:bg-[#221610]/80 md:relative md:mt-6 md:max-w-[800px] md:border-t-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="flex flex-col items-center gap-4 md:px-8 md:pb-6">
            {/* Helper text for tablet */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Upload a clear, recent photo of your face for best results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupStep3FacialVerification;
