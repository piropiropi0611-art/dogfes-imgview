import Image from "next/image";

import type { ImageRecord } from "@/lib/storage/types";

type ImageGalleryProps = {
  images: ImageRecord[];
  isLoading: boolean;
  selectedImageId: string | null;
  onSelectImage: (imageId: string) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sourceLabel(source: ImageRecord["source"]) {
  switch (source) {
    case "upload":
      return "元画像";
    case "ai-generated":
      return "生成画像";
    case "preprocessed":
      return "前処理画像";
  }
}

export function ImageGallery({
  images,
  isLoading,
  selectedImageId,
  onSelectImage,
}: ImageGalleryProps) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <p className="eyebrow">Library</p>
        <h2>アップロード済み画像</h2>
      </div>

      {isLoading ? <p className="mutedText">画像一覧を読み込み中です...</p> : null}

      {!isLoading && images.length === 0 ? (
        <div className="emptyState">
          <p>まだ画像はありません。</p>
          <p className="mutedText">
            ここに保存済み画像が並び、将来は AI 生成の結果も同じ一覧で扱えます。
          </p>
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="sourceLegend" aria-label="画像種別の凡例">
          <span className="sourceBadge source-upload">元画像</span>
          <span className="sourceBadge source-ai-generated">生成画像</span>
          <span className="sourceBadge source-preprocessed">前処理画像</span>
        </div>
      ) : null}

      <div className="galleryGrid">
        {images.map((image) => {
          const canUseAsSource = image.source === "upload";

          return (
            <article
              className={`imageCard ${
                selectedImageId === image.id ? "imageCardSelected" : ""
              }`}
              key={image.id}
            >
            <div className="imageCardFrame">
              <Image
                src={image.url}
                alt={image.storedName}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="galleryImage"
              />
            </div>

            <div className="imageCardBody">
              <div className="imageCardTopRow">
                <p className="imageCardName">{image.storedName}</p>
                <div className="imageCardBadges">
                  <span className={`sourceBadge source-${image.source}`}>
                    {sourceLabel(image.source)}
                  </span>
                  <span className={`statusBadge status-${image.status}`}>
                    {image.status}
                  </span>
                </div>
              </div>
              <p className="imageCardMeta">
                {formatDate(image.createdAt)} / {(image.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="imageCardMeta">
                種別: {sourceLabel(image.source)}
                {image.prompt ? " / 固定プロンプトあり" : ""}
              </p>
              <button
                className="secondaryButton"
                type="button"
                disabled={!canUseAsSource}
                onClick={() => {
                  if (canUseAsSource) {
                    onSelectImage(image.id);
                  }
                }}
              >
                {!canUseAsSource
                  ? "元画像以外は再入力不可"
                  : selectedImageId === image.id
                    ? "生成元として選択中"
                    : "この画像を生成元にする"}
              </button>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}
