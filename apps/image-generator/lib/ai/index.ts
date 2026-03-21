import { randomUUID } from "node:crypto";

import { buildFixedReplicatePrompt } from "@/lib/ai/prompts";
import type { AiImageJob, AiProvider } from "@/lib/ai/types";
import type { ImageRecord } from "@/lib/storage/types";

type QueueAiImageJobInput = {
  sourceImageId: string;
  provider: AiProvider;
  prompt: string;
  model?: string;
};

export async function queueAiImageJob(
  input: QueueAiImageJobInput,
): Promise<AiImageJob> {
  return {
    id: randomUUID(),
    sourceImageId: input.sourceImageId,
    provider: input.provider,
    prompt: input.prompt,
    createdAt: new Date().toISOString(),
    status: "queued",
    model: input.model,
  };
}

export function getFixedReplicatePrompt(sourceImage: ImageRecord): string {
  return buildFixedReplicatePrompt(sourceImage);
}
