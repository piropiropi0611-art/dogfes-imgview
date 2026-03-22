import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const STORAGE_ROOT = process.env.STORAGE_ROOT?.trim();
const DATA_DIR = STORAGE_ROOT ? STORAGE_ROOT : path.join(process.cwd(), "data");
const TEMP_PREVIEW_DIR = path.join(DATA_DIR, "temp-previews");
const TEMP_PREVIEW_TTL_MS = 30 * 60 * 1000;

type TempPreviewMetadata = {
  token: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type TempPreview = TempPreviewMetadata & {
  buffer: Buffer;
};

function metadataPath(token: string) {
  return path.join(TEMP_PREVIEW_DIR, `${token}.json`);
}

function bufferPath(token: string) {
  return path.join(TEMP_PREVIEW_DIR, `${token}.bin`);
}

function previewUrl(token: string) {
  return `/api/preview-extract/${token}`;
}

function assertToken(token: string) {
  if (!/^[a-f0-9-]{36}$/.test(token)) {
    throw new Error("抽出プレビューの識別子が不正です。");
  }
}

async function ensureTempPreviewDir() {
  await mkdir(TEMP_PREVIEW_DIR, { recursive: true });
}

async function deleteTempPreviewFiles(token: string) {
  await Promise.all([
    rm(metadataPath(token), { force: true }),
    rm(bufferPath(token), { force: true }),
  ]);
}

async function cleanupExpiredTempPreviews() {
  await ensureTempPreviewDir();

  const entries = await readdir(TEMP_PREVIEW_DIR, { withFileTypes: true });
  const metadataFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".json"),
  );

  await Promise.all(
    metadataFiles.map(async (entry) => {
      const token = entry.name.replace(/\.json$/, "");

      try {
        const raw = await readFile(metadataPath(token), "utf8");
        const metadata = JSON.parse(raw) as TempPreviewMetadata;
        const createdAt = new Date(metadata.createdAt).getTime();

        if (!Number.isFinite(createdAt) || Date.now() - createdAt > TEMP_PREVIEW_TTL_MS) {
          await deleteTempPreviewFiles(token);
        }
      } catch {
        await deleteTempPreviewFiles(token);
      }
    }),
  );
}

async function readMetadata(token: string): Promise<TempPreviewMetadata> {
  assertToken(token);
  await cleanupExpiredTempPreviews();

  let raw: string;
  try {
    raw = await readFile(metadataPath(token), "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error("抽出プレビューが見つかりません。もう一度確認してください。");
    }

    throw error;
  }
  const metadata = JSON.parse(raw) as TempPreviewMetadata;
  const createdAt = new Date(metadata.createdAt).getTime();

  if (!Number.isFinite(createdAt) || Date.now() - createdAt > TEMP_PREVIEW_TTL_MS) {
    await deleteTempPreviewFiles(token);
    throw new Error("抽出プレビューの有効期限が切れました。もう一度確認してください。");
  }

  return metadata;
}

export async function createTempPreview(input: {
  buffer: Buffer;
  mimeType: string;
  size: number;
}) {
  await cleanupExpiredTempPreviews();

  const token = randomUUID();
  const metadata: TempPreviewMetadata = {
    token,
    mimeType: input.mimeType,
    size: input.size,
    createdAt: new Date().toISOString(),
  };

  await Promise.all([
    writeFile(metadataPath(token), JSON.stringify(metadata, null, 2) + "\n", "utf8"),
    writeFile(bufferPath(token), input.buffer),
  ]);

  return {
    previewToken: token,
    previewUrl: previewUrl(token),
    mimeType: metadata.mimeType,
    size: metadata.size,
  };
}

export async function readTempPreview(token: string): Promise<TempPreview> {
  const metadata = await readMetadata(token);
  let buffer: Buffer;

  try {
    buffer = await readFile(bufferPath(token));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error("抽出プレビューが見つかりません。もう一度確認してください。");
    }

    throw error;
  }

  return {
    ...metadata,
    buffer,
  };
}

export async function consumeTempPreview(token: string): Promise<TempPreview> {
  const preview = await readTempPreview(token);
  await deleteTempPreviewFiles(token);
  return preview;
}
