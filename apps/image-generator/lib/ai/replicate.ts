import Replicate, { type FileOutput } from "replicate";

import { getReplicateConfig } from "@/lib/ai/config";

type GenerateFromImageInput = {
  prompt: string;
  sourceImage: Buffer;
  backgroundImage: Buffer;
};

type GeneratedImage = {
  buffer: Buffer;
  mimeType: string;
};

function createReplicateClient(auth: string) {
  return new Replicate({
    auth,
    useFileOutput: true,
  });
}

function isFileOutput(value: unknown): value is FileOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    "blob" in value &&
    typeof (value as { blob?: unknown }).blob === "function"
  );
}

async function fetchOutputAsBuffer(outputUrl: string | URL): Promise<GeneratedImage> {
  const response = await fetch(outputUrl);

  if (!response.ok) {
    throw new Error("Replicate の出力画像取得に失敗しました。");
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") ?? "image/png";

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType,
  };
}

async function normalizeReplicateOutput(output: unknown): Promise<GeneratedImage> {
  const firstOutput = Array.isArray(output) ? output[0] : output;

  if (!firstOutput) {
    throw new Error("Replicate から画像出力を取得できませんでした。");
  }

  if (typeof firstOutput === "string" || firstOutput instanceof URL) {
    return fetchOutputAsBuffer(firstOutput);
  }

  if (isFileOutput(firstOutput)) {
    const blob = await firstOutput.blob();
    const arrayBuffer = await blob.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: blob.type || "image/png",
    };
  }

  if (Buffer.isBuffer(firstOutput)) {
    return {
      buffer: firstOutput,
      mimeType: "image/png",
    };
  }

  if (firstOutput instanceof Uint8Array) {
    return {
      buffer: Buffer.from(firstOutput),
      mimeType: "image/png",
    };
  }

  if (firstOutput instanceof ArrayBuffer) {
    return {
      buffer: Buffer.from(firstOutput),
      mimeType: "image/png",
    };
  }

  throw new Error("Replicate の出力形式を解釈できませんでした。");
}

export async function generateImageWithReplicate(
  input: GenerateFromImageInput,
): Promise<GeneratedImage> {
  const config = getReplicateConfig();

  const replicate = createReplicateClient(config.apiToken);

  const output = await replicate.run(config.model, {
    input: {
      prompt: input.prompt,
      input_image_1: input.sourceImage,
      input_image_2: input.backgroundImage,
    },
    wait: {
      // Polling avoids Replicate's 1-60 second Prefer: wait limit.
      mode: "poll",
      interval: 1000,
    },
  });

  return normalizeReplicateOutput(output);
}
