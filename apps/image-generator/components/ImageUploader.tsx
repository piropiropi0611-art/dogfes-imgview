"use client";

import { useMemo, useState } from "react";

import type { ImageRecord } from "@/lib/storage/types";

type ImageUploaderProps = {
  onUploaded: (image: ImageRecord) => void;
};

export function ImageUploader({ onUploaded }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return "未選択";
    }

    const sizeInMb = (selectedFile.size / 1024 / 1024).toFixed(2);
    return `${selectedFile.name} (${sizeInMb} MB)`;
  }, [selectedFile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("アップロードする画像を選択してください。");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        error?: string;
        image?: ImageRecord;
      };

      if (!response.ok || !payload.image) {
        throw new Error(payload.error ?? "アップロードに失敗しました。");
      }

      onUploaded(payload.image);
      setSelectedFile(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "アップロードに失敗しました。",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <p className="eyebrow">Upload</p>
        <h2>画像を保管</h2>
      </div>

      <form className="uploadForm" onSubmit={handleSubmit}>
        <label className="uploadDropzone" htmlFor="image-file">
          <span className="uploadDropzoneTitle">
            スマホで撮った画像や PC の画像を選択
          </span>
          <span className="uploadDropzoneDescription">
            JPG / PNG / WebP などの画像を 10MB までアップロードできます。
          </span>
          <input
            id="image-file"
            type="file"
            accept="image/*"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
          />
        </label>

        <div className="uploadMetaRow">
          <span className="uploadMetaLabel">選択中</span>
          <span className="uploadMetaValue">{selectedFileSummary}</span>
        </div>

        {errorMessage ? <p className="errorText">{errorMessage}</p> : null}

        <button className="primaryButton" type="submit" disabled={isUploading}>
          {isUploading ? "アップロード中..." : "アップロードする"}
        </button>
      </form>
    </section>
  );
}
