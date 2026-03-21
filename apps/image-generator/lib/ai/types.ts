import type { ImageRecord, ImageStatus } from "@/lib/storage/types";

export type AiProvider = "openai" | "gemini" | "replicate" | "custom";

export type AiJobStatus = Extract<
  ImageStatus,
  "queued" | "processing" | "generated" | "failed"
>;

export type AiImageJob = {
  id: string;
  sourceImageId: ImageRecord["id"];
  provider: AiProvider;
  prompt: string;
  createdAt: string;
  status: AiJobStatus;
  model?: string;
  externalJobId?: string;
  outputUrls?: string[];
  resultImageId?: ImageRecord["id"];
  errorMessage?: string;
};
