import { NextResponse } from "next/server";

import { readTempPreview } from "@/lib/storage/temp-preview";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const preview = await readTempPreview(token);
    const body = new Uint8Array(preview.buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": preview.mimeType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "抽出プレビューの取得に失敗しました。";

    const status = message.includes("有効期限") || message.includes("不正") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
