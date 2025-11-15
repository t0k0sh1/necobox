import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mimeType = formData.get("mimeType") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let compressedBuffer: Buffer;

    if (mimeType === "image/png") {
      // PNG compression settings with conditional palette option
      const info = await sharp(buffer).metadata();
      const alreadyPalette = info.palette === true;
      const isFullColor =
        info.hasOwnProperty("channels") && info.channels >= 3;
      const bitDepth = info.bitDepth || info.depth || info.bits;

      const shouldUsePalette =
        !alreadyPalette &&
        isFullColor &&
        bitDepth !== undefined &&
        bitDepth <= 8;

      // Check for optimized PNG (Zopfli/pngquant)
      const optimizedHints = ["tinypng", "pngquant", "zopflipng"];
      const creator = (
        (info as any).tEXt?.Software ||
        (info as any).tEXt?.Creator ||
        ""
      ).toLowerCase();
      const isOptimizedSource = optimizedHints.some((keyword) =>
        creator.includes(keyword.toLowerCase())
      );

      if (isOptimizedSource) {
        // 元が最適化済み → palette化すると肥大化しやすい
        console.log("Skipping palette: optimized PNG detected.");
      }

      const usePalette = shouldUsePalette && !isOptimizedSource;

      compressedBuffer = await sharp(buffer)
        .png({
          compressionLevel: 6,
          adaptiveFiltering: true,
          palette: usePalette,
        })
        .toBuffer();
    } else if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      // JPEG compression settings
      compressedBuffer = await sharp(buffer)
        .jpeg({
          quality: 75,
          progressive: true,
          chromaSubsampling: "4:2:0",
        })
        .toBuffer();
    } else {
      return NextResponse.json(
        { error: "Unsupported image type" },
        { status: 400 }
      );
    }

    // Return compressed image as base64
    const base64 = compressedBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      dataUrl,
      size: compressedBuffer.length,
    });
  } catch (error) {
    console.error("Compression error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to compress image",
      },
      { status: 500 }
    );
  }
}

