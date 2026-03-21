import { NextResponse } from "next/server";

import { getStorageProvider } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const storage = getStorageProvider();
    const images = await storage.listImages();

    return NextResponse.json({ images });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "画像一覧の取得に失敗しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
