import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getFixedBackgroundImagePath } from "@/lib/ai/background";
import { getFixedReplicatePrompt } from "@/lib/ai";
import { removeSourceBackgroundLocally } from "@/lib/ai/preprocess";
import { generateImageWithReplicate } from "@/lib/ai/replicate";
import { getStorageProvider } from "@/lib/storage";

export const runtime = "nodejs";

type GenerateRequestBody = {
  imageId?: string;
};

function imagePathFromUrl(imageUrl: string) {
  if (!imageUrl.startsWith("/uploads/")) {
    throw new Error("生成元画像の URL が不正です。");
  }

  return path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequestBody;
    const imageId = body.imageId?.trim();

    if (!imageId) {
      return NextResponse.json(
        { error: "生成元画像を選択してください。" },
        { status: 400 },
      );
    }

    const storage = getStorageProvider();
    const images = await storage.listImages();
    const sourceImage = images.find((image) => image.id === imageId);

    if (!sourceImage) {
      return NextResponse.json(
        { error: "生成元画像が見つかりません。" },
        { status: 404 },
      );
    }

    if (sourceImage.source !== "upload") {
      return NextResponse.json(
        { error: "生成元に使えるのはアップロードした元画像のみです。" },
        { status: 400 },
      );
    }

    const sourceImagePath = imagePathFromUrl(sourceImage.url);
    const sourceBuffer = await readFile(sourceImagePath);
    const preprocessedSource = await removeSourceBackgroundLocally(
      sourceBuffer,
      sourceImage.mimeType,
    );
    const preprocessedImage = await storage.saveImage({
      buffer: preprocessedSource.buffer,
      originalName: `${sourceImage.storedName}-preprocessed.png`,
      mimeType: preprocessedSource.mimeType,
      size: preprocessedSource.buffer.byteLength,
      source: "preprocessed",
      status: "generated",
      derivedFromId: sourceImage.id,
    });
    const backgroundImagePath = getFixedBackgroundImagePath();
    const backgroundBuffer = await readFile(backgroundImagePath);
    const prompt = getFixedReplicatePrompt(sourceImage);
    const generated = await generateImageWithReplicate({
      prompt,
      sourceImage: preprocessedSource.buffer,
      backgroundImage: backgroundBuffer,
    });

    const generatedImage = await storage.saveImage({
      buffer: generated.buffer,
      originalName: `${sourceImage.storedName}-replicate.png`,
      mimeType: generated.mimeType,
      size: generated.buffer.byteLength,
      source: "ai-generated",
      status: "generated",
      prompt,
      derivedFromId: sourceImage.id,
    });

    return NextResponse.json(
      { image: generatedImage, preprocessedImage },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "画像生成に失敗しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
