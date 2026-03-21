import { FirebaseStorageProvider } from "@/lib/storage/firebase";
import { LocalStorageProvider } from "@/lib/storage/local";
import type { StorageProvider } from "@/lib/storage/types";

export function getStorageProvider(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER ?? "local";

  if (driver === "firebase") {
    return new FirebaseStorageProvider();
  }

  return new LocalStorageProvider();
}
