import { NextResponse } from "next/server";

import { readStoredFile } from "@/lib/storage/file-server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    segments: string[];
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { segments } = await context.params;
    const file = await readStoredFile("upload", segments);

    return new NextResponse(file.buffer, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "画像が見つかりません。" }, { status: 404 });
  }
}
