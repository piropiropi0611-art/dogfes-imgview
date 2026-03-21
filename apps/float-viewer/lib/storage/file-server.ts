import { readFile } from "node:fs/promises";
import path from "node:path";

import { filePathForSource } from "@/lib/storage/local";
import type { ImageSource } from "@/lib/storage/types";

type SupportedFileSource = Extract<ImageSource, "upload" | "extracted">;

function validateSegments(segments: string[]) {
  if (segments.length === 0) {
    throw new Error("ファイル名が指定されていません。");
  }

  for (const segment of segments) {
    if (!segment || segment === "." || segment === ".." || segment.includes("/")) {
      throw new Error("不正なファイルパスです。");
    }
  }
}

function contentTypeFromExtension(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function readStoredFile(
  source: SupportedFileSource,
  segments: string[],
) {
  validateSegments(segments);

  const fileName = segments.join("/");
  const filePath = filePathForSource(source, fileName);
  const buffer = await readFile(filePath);

  return {
    buffer,
    fileName,
    contentType: contentTypeFromExtension(fileName),
  };
}
