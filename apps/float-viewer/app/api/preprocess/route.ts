import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import { removeSourceBackgroundLocally } from "@/lib/ai/preprocess";
import { getStorageProvider } from "@/lib/storage";
import { filePathFromUrl } from "@/lib/storage/local";

export const runtime = "nodejs";

type PreprocessRequestBody = {
  imageId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreprocessRequestBody;
    const imageId = body.imageId?.trim();

    if (!imageId) {
      return NextResponse.json(
        { error: "前処理対象の元画像を選択してください。" },
        { status: 400 },
      );
    }

    const storage = getStorageProvider();
    const images = await storage.listImages();
    const sourceImage = images.find((image) => image.id === imageId);

    if (!sourceImage) {
      return NextResponse.json(
        { error: "前処理対象画像が見つかりません。" },
        { status: 404 },
      );
    }

    if (sourceImage.source !== "upload") {
      return NextResponse.json(
        { error: "前処理に使えるのはアップロードした元画像のみです。" },
        { status: 400 },
      );
    }

    const existingExtractedImage = images.find(
      (image) => image.source === "extracted" && image.derivedFromId === sourceImage.id,
    );

    if (existingExtractedImage) {
      return NextResponse.json({ image: existingExtractedImage }, { status: 200 });
    }

    const sourceImagePath = filePathFromUrl(sourceImage.url);
    const sourceBuffer = await readFile(sourceImagePath);
    const extractedImage = await removeSourceBackgroundLocally(
      sourceBuffer,
      sourceImage.mimeType,
    );

    const savedImage = await storage.saveImage({
      buffer: extractedImage.buffer,
      originalName: `${sourceImage.storedName}-extracted.png`,
      mimeType: extractedImage.mimeType,
      size: extractedImage.buffer.byteLength,
      source: "extracted",
      status: "generated",
      derivedFromId: sourceImage.id,
    });

    return NextResponse.json({ image: savedImage }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "画像抽出に失敗しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
