"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { ImageRecord } from "@/lib/storage/types";

type FloatUploaderProps = {
  onUploaded: (uploadImage: ImageRecord, extractedImage: ImageRecord) => void;
};

export function FloatUploader({ onUploaded }: FloatUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return "未選択";
    }

    const sizeInMb = (selectedFile.size / 1024 / 1024).toFixed(2);
    return `${selectedFile.name} (${sizeInMb} MB)`;
  }, [selectedFile]);

  async function handlePreview() {
    if (!selectedFile) {
      setErrorMessage("アップロードする画像を選択してください。");
      return;
    }

    setIsPreviewing(true);
    setErrorMessage("");
    setStatusMessage("抽出画像を確認用に作成しています...");
    setPreviewUrl("");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const previewResponse = await fetch("/api/preview-extract", {
        method: "POST",
        body: formData,
      });

      const previewPayload = (await previewResponse.json()) as {
        error?: string;
        previewUrl?: string;
      };

      if (!previewResponse.ok || !previewPayload.previewUrl) {
        throw new Error(previewPayload.error ?? "抽出画像の確認に失敗しました。");
      }

      setPreviewUrl(previewPayload.previewUrl);
      setStatusMessage("抽出画像を確認しました。問題なければアップロードしてください。");
    } catch (error) {
      setStatusMessage("");
      setErrorMessage(
        error instanceof Error ? error.message : "抽出画像の確認に失敗しました。",
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("アップロードする画像を選択してください。");
      return;
    }

    if (!previewUrl) {
      setErrorMessage("先に抽出画像を確認してください。");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setStatusMessage("アップロード中です...");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadPayload = (await uploadResponse.json()) as {
        error?: string;
        image?: ImageRecord;
      };

      if (!uploadResponse.ok || !uploadPayload.image) {
        throw new Error(uploadPayload.error ?? "アップロードに失敗しました。");
      }

      setStatusMessage("背景除去で保存用の抽出画像を作成しています...");

      const preprocessResponse = await fetch("/api/preprocess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: uploadPayload.image.id,
        }),
      });

      const preprocessPayload = (await preprocessResponse.json()) as {
        error?: string;
        image?: ImageRecord;
      };

      if (!preprocessResponse.ok || !preprocessPayload.image) {
        throw new Error(preprocessPayload.error ?? "画像抽出に失敗しました。");
      }

      onUploaded(uploadPayload.image, preprocessPayload.image);
      setSelectedFile(null);
      setPreviewUrl("");
      setStatusMessage("抽出画像を追加しました。背景の上をふわふわ飛びます。");
    } catch (error) {
      setStatusMessage("");
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
        <h2>画像をアップロードして抽出</h2>
      </div>

      <form className="uploadForm" onSubmit={handleSubmit}>
        <label className="uploadDropzone" htmlFor="image-file">
          <span className="uploadDropzoneTitle">
            犬の画像を選択して抽出結果を確認
          </span>
          <span className="uploadDropzoneDescription">
            JPG / PNG / WebP を 10MB まで選択できます。まず抽出画像を確認し、問題なければ保存します。
          </span>
          <input
            id="image-file"
            type="file"
            accept="image/*"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setPreviewUrl("");
              setErrorMessage("");
              setStatusMessage("");
            }}
          />
        </label>

        <div className="uploadMetaRow">
          <span className="uploadMetaLabel">選択中</span>
          <span className="uploadMetaValue">{selectedFileSummary}</span>
        </div>

        {selectedFile ? (
          <div className="previewGrid">
            <div className="previewCard">
              <p className="previewTitle">元画像</p>
              {localPreviewUrl ? (
                <div className="previewFrame">
                  <Image
                    src={localPreviewUrl}
                    alt="選択した元画像"
                    width={320}
                    height={320}
                    className="previewImage"
                    unoptimized
                  />
                </div>
              ) : null}
            </div>

            <div className="previewCard">
              <p className="previewTitle">抽出プレビュー</p>
              {previewUrl ? (
                <div className="previewFrame previewFrameDark">
                  <Image
                    src={previewUrl}
                    alt="抽出プレビュー"
                    width={320}
                    height={320}
                    className="previewImage"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="previewPlaceholder">
                  <p>まだ抽出プレビューはありません。</p>
                  <p className="mutedText">
                    「抽出画像を確認する」を押すとここに表示されます。
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {statusMessage ? <p className="infoText">{statusMessage}</p> : null}
        {errorMessage ? <p className="errorText">{errorMessage}</p> : null}

        <div className="actionRow">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void handlePreview()}
            disabled={!selectedFile || isPreviewing || isUploading}
          >
            {isPreviewing ? "抽出確認中..." : "抽出画像を確認する"}
          </button>

          <button
            className="primaryButton"
            type="submit"
            disabled={!selectedFile || !previewUrl || isPreviewing || isUploading}
          >
            {isUploading ? "アップロード中..." : "問題なければアップロード"}
          </button>
        </div>
      </form>
    </section>
  );
}
