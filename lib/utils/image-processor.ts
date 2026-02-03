/**
 * Image processing utilities
 * Provides resize functionality for PNG/JPEG images
 */

// formatFileSizeを共通ユーティリティから再エクスポート
export { formatFileSize } from "./format";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number; // File size in bytes
}

/**
 * Resize an image
 * Maintains aspect ratio and resizes to fit specified width or height
 */
export async function resizeImage(
  file: File,
  targetWidth?: number,
  targetHeight?: number
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const originalWidth = img.width;
      const originalHeight = img.height;
      const aspectRatio = originalWidth / originalHeight;

      let newWidth: number;
      let newHeight: number;

      if (targetWidth && targetHeight) {
        // If both are specified, maintain aspect ratio and fit to the smaller one
        const widthRatio = targetWidth / originalWidth;
        const heightRatio = targetHeight / originalHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        newWidth = Math.round(originalWidth * ratio);
        newHeight = Math.round(originalHeight * ratio);
      } else if (targetWidth) {
        // Only width specified
        newWidth = targetWidth;
        newHeight = Math.round(targetWidth / aspectRatio);
      } else if (targetHeight) {
        // Only height specified
        newHeight = targetHeight;
        newWidth = Math.round(targetHeight * aspectRatio);
      } else {
        // Neither specified, use original size
        newWidth = originalWidth;
        newHeight = originalHeight;
      }

      resolve({ width: newWidth, height: newHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Process an image by resizing (without compression)
 */
export async function processImage(
  file: File,
  targetWidth?: number,
  targetHeight?: number
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const originalWidth = img.width;
      const originalHeight = img.height;
      const aspectRatio = originalWidth / originalHeight;

      let newWidth: number;
      let newHeight: number;

      if (targetWidth && targetHeight) {
        // If both are specified, maintain aspect ratio and fit to the smaller one
        const widthRatio = targetWidth / originalWidth;
        const heightRatio = targetHeight / originalHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        newWidth = Math.round(originalWidth * ratio);
        newHeight = Math.round(originalHeight * ratio);
      } else if (targetWidth) {
        // Only width specified
        newWidth = targetWidth;
        newHeight = Math.round(targetWidth / aspectRatio);
      } else if (targetHeight) {
        // Only height specified
        newHeight = targetHeight;
        newWidth = Math.round(targetHeight * aspectRatio);
      } else {
        // Neither specified, use original size
        newWidth = originalWidth;
        newHeight = originalHeight;
      }

      // Draw on canvas
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // High quality resampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Export without compression (highest quality)
      const mimeType = file.type || "image/jpeg";
      // Use quality 1.0 for JPEG to avoid compression, PNG is lossless by default
      const outputQuality = mimeType === "image/png" ? undefined : 1.0;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to process image"));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blob,
              dataUrl: reader.result as string,
              width: newWidth,
              height: newHeight,
              size: blob.size,
            });
          };
          reader.onerror = () => {
            reject(new Error("Failed to read image data"));
          };
          reader.readAsDataURL(blob);
        },
        mimeType,
        outputQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}


