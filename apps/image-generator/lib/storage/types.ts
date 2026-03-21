export type ImageStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "generated"
  | "failed";

export type ImageSource = "upload" | "ai-generated" | "preprocessed";

export type ImageRecord = {
  id: string;
  originalName: string;
  storedName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  status: ImageStatus;
  source: ImageSource;
  prompt?: string;
  derivedFromId?: string;
};

export type SaveImageInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  source?: ImageSource;
  status?: ImageStatus;
  prompt?: string;
  derivedFromId?: string;
};

export interface StorageProvider {
  saveImage(input: SaveImageInput): Promise<ImageRecord>;
  listImages(): Promise<ImageRecord[]>;
}
