import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ImageRecord,
  ImageSource,
  SaveImageInput,
  StorageProvider,
} from "@/lib/storage/types";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_ARCHIVE_DIR = path.join(process.cwd(), "public", "archive");
const PUBLIC_GENERATED_DIR = path.join(PUBLIC_ARCHIVE_DIR, "generated");
const PUBLIC_PREPROCESSED_DIR = path.join(PUBLIC_ARCHIVE_DIR, "preprocessed");
const DATA_DIR = path.join(process.cwd(), "data");
const IMAGE_INDEX_PATH = path.join(DATA_DIR, "images.json");

async function ensureStorageDirs() {
  await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  await mkdir(PUBLIC_GENERATED_DIR, { recursive: true });
  await mkdir(PUBLIC_PREPROCESSED_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });
}

async function readImageIndex(): Promise<ImageRecord[]> {
  try {
    const file = await readFile(IMAGE_INDEX_PATH, "utf8");
    const data = JSON.parse(file) as ImageRecord[];
    return data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeImageIndex(records: ImageRecord[]) {
  await writeFile(IMAGE_INDEX_PATH, JSON.stringify(records, null, 2), "utf8");
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extensionFromMimeType(mimeType: string) {
  const subtype = mimeType.split("/")[1];
  return subtype ? `.${subtype.replace(/[^a-zA-Z0-9]/g, "")}` : "";
}

function padTwoDigits(value: number) {
  return value.toString().padStart(2, "0");
}

function formatTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());
  const hours = padTwoDigits(date.getHours());
  const minutes = padTwoDigits(date.getMinutes());
  const seconds = padTwoDigits(date.getSeconds());

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function nextSequence(records: ImageRecord[], timestamp: string) {
  const prefix = `IMG_${timestamp}_`;
  const maxSequence = records.reduce((currentMax, record) => {
    if (!record.storedName.startsWith(prefix)) {
      return currentMax;
    }

    const match = record.storedName.match(/^IMG_\d{8}_\d{6}_(\d{2})/);
    if (!match) {
      return currentMax;
    }

    return Math.max(currentMax, Number(match[1]));
  }, 0);

  return padTwoDigits(maxSequence + 1);
}

function publicDirForSource(source: ImageSource) {
  switch (source) {
    case "ai-generated":
      return PUBLIC_GENERATED_DIR;
    case "preprocessed":
      return PUBLIC_PREPROCESSED_DIR;
    case "upload":
    default:
      return PUBLIC_UPLOAD_DIR;
  }
}

function urlPathForSource(source: ImageSource, storedName: string) {
  switch (source) {
    case "ai-generated":
      return `/archive/generated/${storedName}`;
    case "preprocessed":
      return `/archive/preprocessed/${storedName}`;
    case "upload":
    default:
      return `/uploads/${storedName}`;
  }
}

export class LocalStorageProvider implements StorageProvider {
  async saveImage(input: SaveImageInput): Promise<ImageRecord> {
    await ensureStorageDirs();

    const records = await readImageIndex();
    const createdAt = new Date();
    const timestamp = formatTimestamp(createdAt);
    const sequence = nextSequence(records, timestamp);
    const originalName = sanitizeFileName(input.originalName || "upload");
    const extension = path.extname(originalName) || extensionFromMimeType(input.mimeType);
    const storedName = `IMG_${timestamp}_${sequence}${extension}`;
    const source = input.source ?? "upload";
    const targetPath = path.join(publicDirForSource(source), storedName);

    await writeFile(targetPath, input.buffer);

    const record: ImageRecord = {
      id: `${timestamp}-${sequence}`,
      originalName,
      storedName,
      url: urlPathForSource(source, storedName),
      mimeType: input.mimeType,
      size: input.size,
      createdAt: createdAt.toISOString(),
      status: input.status ?? "uploaded",
      source,
      prompt: input.prompt,
      derivedFromId: input.derivedFromId,
    };

    records.unshift(record);
    await writeImageIndex(records);

    return record;
  }

  async listImages(): Promise<ImageRecord[]> {
    await ensureStorageDirs();
    return readImageIndex();
  }
}
