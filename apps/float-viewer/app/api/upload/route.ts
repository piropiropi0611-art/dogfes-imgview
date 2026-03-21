import { NextResponse } from "next/server";

import { getStorageProvider } from "@/lib/storage";

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
    const storage = getStorageProvider();
    const image = await storage.saveImage({
      buffer: Buffer.from(arrayBuffer),
      originalName: fileEntry.name,
      mimeType: fileEntry.type,
      size: fileEntry.size,
      source: "upload",
      status: "uploaded",
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "アップロードに失敗しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
