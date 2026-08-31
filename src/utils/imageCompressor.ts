/**
 * Image compression utility using HTML5 Canvas to ensure images are lightweight,
 * fast-loading, and within localStorage quota limits (~30KB-70KB instead of 5MB-10MB).
 */

/**
 * Image compression utility using HTML5 Canvas to ensure images are lightweight,
 * fast-loading, and within localStorage quota limits (~30KB-70KB instead of 5MB-10MB).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Compresses an image File or Blob to an optimized WebP or JPEG Base64 Data URL.
 * Supports both options object: compressImageFile(file, { maxWidth, maxHeight, quality })
 * and positional parameters: compressImageFile(file, maxWidth, maxHeight, quality)
 */
export async function compressImageFile(
  file: File | Blob,
  optionsOrMaxWidth?: CompressionOptions | number,
  maxHeightParam?: number,
  qualityParam?: number
): Promise<any> {
  const originalSize = file.size;

  let maxWidth = 800;
  let maxHeight = 800;
  let quality = 0.82;
  const isOptionsObject = typeof optionsOrMaxWidth === 'object' && optionsOrMaxWidth !== null;

  if (isOptionsObject) {
    const opts = optionsOrMaxWidth as CompressionOptions;
    if (opts.maxWidth !== undefined) maxWidth = opts.maxWidth;
    if (opts.maxHeight !== undefined) maxHeight = opts.maxHeight;
    if (opts.quality !== undefined) quality = opts.quality;
  } else if (typeof optionsOrMaxWidth === 'number') {
    maxWidth = optionsOrMaxWidth;
    if (maxHeightParam !== undefined) maxHeight = maxHeightParam;
    if (qualityParam !== undefined) quality = qualityParam;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate new dimensions preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const rawUrl = readerEvent.target?.result as string;
            if (isOptionsObject) {
              resolve(rawUrl);
            } else {
              resolve({
                dataUrl: rawUrl,
                originalSize,
                compressedSize: originalSize,
                width: img.width,
                height: img.height,
                mimeType: file.type || 'image/jpeg',
              });
            }
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP if supported, fallback to JPEG
          let mimeType = 'image/webp';
          let dataUrl = canvas.toDataURL(mimeType, quality);

          // Check if WebP is supported (browsers that don't support return image/png)
          if (!dataUrl.startsWith('data:image/webp')) {
            mimeType = 'image/jpeg';
            dataUrl = canvas.toDataURL(mimeType, quality);
          }

          // Calculate approximate compressed size from base64 string
          const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          const compressedSize = Math.round((base64Length * 3) / 4);

          if (isOptionsObject) {
            resolve(dataUrl);
          } else {
            resolve({
              dataUrl,
              originalSize,
              compressedSize,
              width,
              height,
              mimeType,
            });
          }
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('เกิดข้อผิดพลาดในการโหลดไฟล์'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (e.g. "45 KB", "1.2 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
