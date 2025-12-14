import archiver from "archiver";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const toFormat = formData.get("toFormat") as string;
    const asZip = formData.get("asZip") === "true";
    const convertOnly = formData.get("convertOnly") === "true";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (toFormat !== "png" && toFormat !== "jpeg") {
      return NextResponse.json(
        { success: false, error: "Invalid format. Must be 'png' or 'jpeg'" },
        { status: 400 }
      );
    }

    // Collect all converted files
    const convertedFiles: Array<{ name: string; buffer: Buffer }> = [];

    // Process each file
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate file type
        const mimeType = file.type;
        const fileName = file.name;
        const baseName = fileName.replace(/\.[^/.]+$/, "");

        if (
          toFormat === "jpeg" &&
          mimeType !== "image/png" &&
          !fileName.toLowerCase().endsWith(".png")
        ) {
          continue; // Skip non-PNG files when converting to JPEG
        }

        if (
          toFormat === "png" &&
          mimeType !== "image/jpeg" &&
          !fileName.toLowerCase().match(/\.(jpg|jpeg)$/i)
        ) {
          continue; // Skip non-JPEG files when converting to PNG
        }

        // Convert image
        let convertedBuffer: Buffer;
        const newExtension = toFormat === "jpeg" ? ".jpg" : ".png";
        const newFileName = `${baseName}${newExtension}`;

        if (toFormat === "jpeg") {
          // PNG to JPEG: convert with white background for transparency
          convertedBuffer = await sharp(buffer)
            .jpeg({ quality: 90 })
            .toBuffer();
        } else {
          // JPEG to PNG: convert to PNG
          convertedBuffer = await sharp(buffer).png().toBuffer();
        }

        convertedFiles.push({ name: newFileName, buffer: convertedBuffer });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    if (convertedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid files to convert" },
        { status: 400 }
      );
    }

    // If convertOnly is true, return JSON with base64 encoded images
    if (convertOnly) {
      const convertedData = convertedFiles.map((file) => ({
        name: file.name,
        data: file.buffer.toString("base64"),
        mimeType: toFormat === "jpeg" ? "image/jpeg" : "image/png",
      }));

      return NextResponse.json({
        success: true,
        files: convertedData,
      });
    }

    // If single file and not requesting ZIP, return single file
    if (convertedFiles.length === 1 && !asZip) {
      const file = convertedFiles[0];
      return new Response(new Uint8Array(file.buffer), {
        headers: {
          "Content-Type": toFormat === "jpeg" ? "image/jpeg" : "image/png",
          "Content-Disposition": `attachment; filename="${file.name}"`,
        },
      });
    }

    // Create ZIP file for multiple files or when explicitly requested
    return new Promise<Response>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      archive.on("data", (chunk: Buffer) => {
        chunks.push(new Uint8Array(chunk));
      });

      archive.on("end", () => {
        const zipBuffer = Buffer.concat(
          chunks.map((chunk) => Buffer.from(chunk))
        );
        resolve(
          new Response(new Uint8Array(zipBuffer), {
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename="converted-images.zip"`,
            },
          })
        );
      });

      archive.on("error", (err) => {
        reject(err);
      });

      // Add all converted files to archive
      convertedFiles.forEach((file) => {
        archive.append(file.buffer, { name: file.name });
      });

      archive.finalize();
    });
  } catch (error) {
    console.error("Error in image converter API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
