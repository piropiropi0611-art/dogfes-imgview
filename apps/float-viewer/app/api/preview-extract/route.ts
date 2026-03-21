import { NextResponse } from "next/server";

import { removeSourceBackgroundLocally } from "@/lib/ai/preprocess";

export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("image");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: "画像ファイルを選択してください。" },
        { status: 400 },
      );
    }

    if (!fileEntry.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルのみアップロードできます。" },
        { status: 400 },
      );
    }

    if (fileEntry.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "10MB 以下の画像を選択してください。" },
        { status: 400 },
      );
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const extractedImage = await removeSourceBackgroundLocally(
      Buffer.from(arrayBuffer),
      fileEntry.type,
    );
    const previewUrl = `data:${extractedImage.mimeType};base64,${extractedImage.buffer.toString("base64")}`;

    return NextResponse.json(
      {
        previewUrl,
        mimeType: extractedImage.mimeType,
        size: extractedImage.buffer.byteLength,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "抽出画像の確認に失敗しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
