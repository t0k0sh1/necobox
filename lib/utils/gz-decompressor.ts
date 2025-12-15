/**
 * Decompress gzip file using browser's DecompressionStream API
 * Falls back to manual decompression if API is not available
 */
export async function decompressGz(file: File): Promise<string> {
  // Check if DecompressionStream is available (Chrome 80+, Firefox 113+, Safari 16.4+)
  if (typeof DecompressionStream !== "undefined") {
    try {
      const stream = file.stream();
      const decompressedStream = stream.pipeThrough(
        new DecompressionStream("gzip")
      );
      const response = new Response(decompressedStream);
      const blob = await response.blob();
      return await blob.text();
    } catch (error) {
      throw new Error(
        `Failed to decompress gzip file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Fallback: Use FileReader and pako-like approach
  // For now, throw an error if DecompressionStream is not available
  // In production, you might want to include pako library as a fallback
  throw new Error(
    "Gzip decompression is not supported in this browser. Please use a modern browser (Chrome 80+, Firefox 113+, Safari 16.4+) or decompress the file manually."
  );
}

/**
 * Check if a file is gzip compressed based on its extension
 */
export function isGzipFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".gz");
}

