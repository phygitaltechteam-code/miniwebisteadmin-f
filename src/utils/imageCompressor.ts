/**
 * Utility to compress client-side images before uploading/storing
 */

/** Image types re-encoded before upload (SVG, GIF and non-images are sent as they are) */
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Compressed copy of an image File for upload: at most maxSide px on the longer side,
 * JPEG/WebP re-encoded at `quality`, PNG kept as PNG (only resized).
 * Returns the original file when it isn't a compressible image or the result isn't smaller.
 */
export async function compressImageFile(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) return file;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    }).finally(() => URL.revokeObjectURL(url));

    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const outType = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outType, quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name, { type: outType, lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** FormData with every image File compressed (same field names, order and file names); other entries unchanged */
export async function compressFormDataImages(data: FormData): Promise<FormData> {
  const entries = Array.from(data.entries());
  if (!entries.some(([, v]) => v instanceof File && COMPRESSIBLE_TYPES.includes(v.type))) return data;
  const out = new FormData();
  for (const [key, value] of entries) {
    if (value instanceof File && COMPRESSIBLE_TYPES.includes(value.type)) {
      const compressed = await compressImageFile(value);
      out.append(key, compressed, compressed.name);
    } else {
      out.append(key, value);
    }
  }
  return out;
}
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG or non-image, return object URL
    if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) {
      resolve(URL.createObjectURL(file));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp or jpeg for high efficiency compression
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
