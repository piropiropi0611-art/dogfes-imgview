"use client";

import { useEffect, useState } from "react";

import { ImageGallery } from "@/components/ImageGallery";
import { ImageGeneratorPanel } from "@/components/ImageGeneratorPanel";
import { ImageUploader } from "@/components/ImageUploader";
import type { ImageRecord } from "@/lib/storage/types";

function getSelectableSourceImage(images: ImageRecord[]) {
  return images.find((image) => image.source === "upload");
}

export function ImageDashboard() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadImages() {
      try {
        const response = await fetch("/api/images", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          error?: string;
          images?: ImageRecord[];
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "画像一覧の取得に失敗しました。");
        }

        if (active) {
          const nextImages = payload.images ?? [];
          setImages(nextImages);
          setSelectedImageId((current) => {
            const currentImage = nextImages.find((image) => image.id === current);
            if (currentImage?.source === "upload") {
              return currentImage.id;
            }

            return getSelectableSourceImage(nextImages)?.id ?? null;
          });
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "画像一覧の取得に失敗しました。",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadImages();

    return () => {
      active = false;
    };
  }, []);

  function handleUploaded(image: ImageRecord) {
    setImages((current) => [image, ...current]);
    setSelectedImageId(image.id);
    setErrorMessage("");
  }

  async function handleGenerate() {
    if (!selectedImageId) {
      setErrorMessage("生成元画像を選択してください。");
      return;
    }

    const selectedSourceImage = images.find((image) => image.id === selectedImageId);
    if (!selectedSourceImage || selectedSourceImage.source !== "upload") {
      setErrorMessage("生成元に使えるのはアップロードした元画像のみです。");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: selectedImageId,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        image?: ImageRecord;
        preprocessedImage?: ImageRecord;
      };

      if (!response.ok || !payload.image) {
        throw new Error(payload.error ?? "画像生成に失敗しました。");
      }

      setImages((current) => {
        const nextImages = [...current];

        if (payload.preprocessedImage) {
          nextImages.unshift(payload.preprocessedImage);
        }

        nextImages.unshift(payload.image as ImageRecord);
        return nextImages;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "画像生成に失敗しました。",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const selectedImage = images.find((image) => image.id === selectedImageId);

  return (
    <div className="dashboardShell">
      <div className="heroBlock">
        <p className="eyebrow">Local First / Future Ready</p>
        <h1>スマホ公開を見据えた画像アップロード基盤</h1>
        <p className="heroLead">
          まずはローカル保存で動かしながら、将来は Firebase Storage と生成 AI
          API を接続しやすい構成にしています。
        </p>
      </div>

      {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}

      <div className="dashboardGrid">
        <ImageUploader onUploaded={handleUploaded} />
        <ImageGeneratorPanel
          selectedImage={selectedImage}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
        />
      </div>

      <ImageGallery
        images={images}
        isLoading={isLoading}
        selectedImageId={selectedImageId}
        onSelectImage={setSelectedImageId}
      />
    </div>
  );
}
