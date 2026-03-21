import type { ImageRecord, SaveImageInput, StorageProvider } from "@/lib/storage/types";

export class FirebaseStorageProvider implements StorageProvider {
  async saveImage(input: SaveImageInput): Promise<ImageRecord> {
    void input;
    throw new Error("Firebase Storage provider is not implemented yet.");
  }

  async listImages(): Promise<ImageRecord[]> {
    throw new Error("Firebase Storage provider is not implemented yet.");
  }
}
