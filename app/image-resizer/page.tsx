"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  processImage,
  formatFileSize,
  type ProcessedImage,
} from "@/lib/utils/image-processor";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";

export default function ImageResizerPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [resizedImage, setResizedImage] = useState<ProcessedImage | null>(
    null
  );
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [shouldAutoResize, setShouldAutoResize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image using server API
  const compressImage = useCallback(async (blob: Blob, mimeType: string, width: number, height: number): Promise<ProcessedImage | null> => {
    try {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("mimeType", mimeType);

      const response = await fetch("/api/image/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to compress image");
      }

      const data = await response.json();

      // Convert base64 data URL back to Blob for download
      const base64Data = data.dataUrl.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const compressedBlob = new Blob([bytes], { type: mimeType });

      return {
        blob: compressedBlob,
        dataUrl: data.dataUrl,
        width,
        height,
        size: data.size,
      };
    } catch (err) {
      console.error("Compression error:", err);
      return null;
    }
  }, []);

  // Process file (used by both file input and drag & drop)
  const processFile = useCallback(async (file: File, preserveDimensions: boolean = false) => {
    // Only allow PNG/JPEG formats
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      setError("Please select a PNG or JPEG image");
      return;
    }

    // Check if width/height are modified (different from original)
    const currentWidth = width ? parseInt(width, 10) : 0;
    const currentHeight = height ? parseInt(height, 10) : 0;
    const wasModified = preserveDimensions &&
      originalWidth > 0 &&
      originalHeight > 0 &&
      (currentWidth !== originalWidth || currentHeight !== originalHeight);

    // Save current dimensions if they were modified
    const savedWidth = wasModified ? currentWidth : undefined;
    const savedHeight = wasModified ? currentHeight : undefined;

    setError("");
    setOriginalFile(file);
    setIsProcessing(true);
    setResizedImage(null);

    try {
      // Load original image
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setOriginalImage(dataUrl);

        // Calculate aspect ratio and set initial dimensions
        const img = new Image();
        img.onload = async () => {
          const ratio = img.width / img.height;
          setAspectRatio(ratio);
          setOriginalWidth(img.width);
          setOriginalHeight(img.height);

          if (savedWidth && savedHeight && wasModified) {
            // Preserve user-modified dimensions
            setWidth(savedWidth.toString());
            setHeight(savedHeight.toString());
            setShouldAutoResize(true);
          } else {
            // Set initial width and height to original dimensions
            setWidth(img.width.toString());
            setHeight(img.height.toString());
            setShouldAutoResize(false);
          }

          setIsProcessing(false);

          // Auto-resize if dimensions were preserved
          if (savedWidth && savedHeight && wasModified && file) {
            try {
              const processed = await processImage(
                file,
                savedWidth,
                savedHeight
              );

              // Compress using server API
              const mimeType = file.type || "image/jpeg";
              const compressed = await compressImage(processed.blob, mimeType, processed.width, processed.height);

              if (compressed) {
                setResizedImage(compressed);
              } else {
                // Fallback to client-resized image if compression fails
                setResizedImage(processed);
              }
            } catch (err) {
              console.error("Auto-resize error:", err);
            }
          }
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        setError("Failed to load image");
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process image");
      setIsProcessing(false);
    }
  }, [width, height, originalWidth, originalHeight, compressImage]);

  // Handle file selection
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await processFile(file, true);
  };

  // Handle drag & drop
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      // Only set dragging to false when we leave the document
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter = 0;

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (file) {
        await processFile(file, true);
      }
    };

    // Add event listeners to document
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    // Cleanup
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [processFile]);

  // Auto-calculate height when width changes
  const handleWidthChange = (value: string) => {
    setWidth(value);
    if (value && aspectRatio) {
      const numWidth = parseInt(value, 10);
      if (!isNaN(numWidth) && numWidth > 0) {
        const calculatedHeight = Math.round(numWidth / aspectRatio);
        setHeight(calculatedHeight.toString());
      }
    }
  };

  // Auto-calculate width when height changes
  const handleHeightChange = (value: string) => {
    setHeight(value);
    if (value && aspectRatio) {
      const numHeight = parseInt(value, 10);
      if (!isNaN(numHeight) && numHeight > 0) {
        const calculatedWidth = Math.round(numHeight * aspectRatio);
        setWidth(calculatedWidth.toString());
      }
    }
  };

  // Handle resize
  const handleResize = async () => {
    if (!originalFile) return;

    const targetWidth = width ? parseInt(width, 10) : undefined;
    const targetHeight = height ? parseInt(height, 10) : undefined;

    if (!targetWidth && !targetHeight) {
      setError("Please enter width or height");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // First, resize the image on client
      const processed = await processImage(
        originalFile,
        targetWidth,
        targetHeight
      );

      // Then compress using server API
      const mimeType = originalFile.type || "image/jpeg";
      const compressed = await compressImage(processed.blob, mimeType, processed.width, processed.height);

      if (compressed) {
        setResizedImage(compressed);
      } else {
        // Fallback to client-resized image if compression fails
        setResizedImage(processed);
      }
    } catch (err) {
      setError("Failed to resize image");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle download
  const handleDownload = (image: ProcessedImage, filename: string) => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Select new file
  const handleNewFile = () => {
    setOriginalFile(null);
    setOriginalImage("");
    setOriginalWidth(0);
    setOriginalHeight(0);
    setResizedImage(null);
    setWidth("");
    setHeight("");
    setAspectRatio(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg border-2 border-blue-500">
            <div className="flex flex-col items-center gap-4">
              <ImageIcon className="w-16 h-16 text-blue-500" />
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                Drop image here
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full items-start justify-center py-4 px-4">
        <div className="w-full max-w-6xl">
        <Breadcrumbs items={[{ label: "Image Resizer" }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Image Resizer</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Resize PNG/JPEG images
            </p>
          </div>

          {/* File upload */}
          <div className="space-y-4">
            {/* Hidden file input for programmatic access */}
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Image preview */}
          {originalImage && (
            <div className="space-y-6">
              {/* Images side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Original image */}
                <div className="space-y-2 flex flex-col">
                  <h2 className="text-lg font-semibold">Original Image</h2>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md border p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-center min-h-[400px] flex-1">
                      {originalFile && (
                        <img
                          src={originalImage}
                          alt="Original"
                          className="max-w-full max-h-[400px] object-contain"
                        />
                      )}
                    </div>
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {originalFile ? (
                        <>
                          <p>
                            Dimensions: {originalWidth} × {originalHeight} px
                          </p>
                          <p>
                            File size: {formatFileSize(originalFile.size)}
                          </p>
                        </>
                      ) : (
                        <div className="h-[3rem]"></div>
                      )}
                    </div>
                    <div className="h-[2.5rem]"></div>
                  </div>
                </div>

                {/* Resized image */}
                {resizedImage ? (
                  <div className="space-y-2 flex flex-col">
                    <h2 className="text-lg font-semibold">Resized Image</h2>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md border p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-center min-h-[400px] flex-1">
                        <img
                          src={resizedImage.dataUrl}
                          alt="Resized"
                          className="max-w-full max-h-[400px] object-contain"
                        />
                      </div>
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          Dimensions: {resizedImage.width} × {resizedImage.height}{" "}
                          px
                        </p>
                        <p>File size: {formatFileSize(resizedImage.size)}</p>
                      </div>
                      <Button
                        onClick={() =>
                          handleDownload(
                            resizedImage,
                            `resized-${originalFile?.name || "image"}`
                          )
                        }
                        className="w-full mt-3"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col">
                    <h2 className="text-lg font-semibold">Resized Image</h2>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md border p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-center min-h-[400px] flex-1 text-gray-400 text-sm">
                        Resized image will appear here
                      </div>
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="h-[3rem]"></div>
                      </div>
                      <div className="h-[2.5rem]"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resize settings */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-xl font-semibold">Resize Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="1"
                      placeholder="Enter width"
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="1"
                      placeholder="Enter height"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                    />
                  </div>
                </div>
                {aspectRatio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aspect ratio: {aspectRatio.toFixed(2)} (maintained automatically)
                  </p>
                )}

                <Button
                  onClick={handleResize}
                  disabled={isProcessing || (!width && !height)}
                  className="w-full md:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Resize"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Initial state message */}
          {!originalImage && !isProcessing && (
            <div className="text-center py-12 text-gray-400">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Please select an image file</p>
              <p className="text-sm mt-2">Supported formats: PNG, JPEG</p>
            </div>
          )}

          {isProcessing && !originalImage && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading image...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

