import type { AiProvider } from "@/lib/ai/types";

type ReplicateModelIdentifier =
  | "flux-kontext-apps/multi-image-kontext-pro";

export type ReplicateConfig = {
  provider: AiProvider;
  apiToken: string;
  model: ReplicateModelIdentifier;
};

export function getReplicateConfig(): ReplicateConfig {
  const provider = (process.env.AI_PROVIDER ?? "replicate") as AiProvider;
  const apiToken = process.env.REPLICATE_API_TOKEN ?? "";
  const model =
    process.env.REPLICATE_MODEL ?? "flux-kontext-apps/multi-image-kontext-pro";

  if (provider !== "replicate") {
    throw new Error("AI_PROVIDER must be set to 'replicate' for this flow.");
  }

  if (!apiToken) {
    throw new Error(
      "REPLICATE_API_TOKEN is not set. Add it to your local environment before using Replicate.",
    );
  }

  const supportedModels: ReplicateModelIdentifier[] = [
    "flux-kontext-apps/multi-image-kontext-pro",
  ];

  if (!supportedModels.includes(model as ReplicateModelIdentifier)) {
    throw new Error(
      "REPLICATE_MODEL must be 'flux-kontext-apps/multi-image-kontext-pro'.",
    );
  }

  return {
    provider,
    apiToken,
    model: model as ReplicateModelIdentifier,
  };
}
