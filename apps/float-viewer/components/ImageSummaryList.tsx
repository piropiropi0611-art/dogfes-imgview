import Image from "next/image";
import { useState } from "react";

import type { ImageRecord } from "@/lib/storage/types";

type ImageSummaryListProps = {
  title: string;
  images: ImageRecord[];
  emptyMessage: string;
  helperText?: string;
  deletingImageId?: string | null;
  onDelete?: (image: ImageRecord) => void;
  showPreview?: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ImageSummaryList({
  title,
  images,
  emptyMessage,
  helperText,
  deletingImageId,
  onDelete,
  showPreview,
}: ImageSummaryListProps) {
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);

  return (
    <section className="panel">
      <div className="panelHeader">
        <p className="eyebrow">Library</p>
        <h2>{title}</h2>
        {helperText ? <p className="mutedText">{helperText}</p> : null}
      </div>

      {images.length === 0 ? (
        <p className="mutedText">{emptyMessage}</p>
      ) : (
        <div className="summaryList">
          {images.map((image) => (
            <article
              className={`summaryCard${expandedImageId === image.id ? " summaryCardExpanded" : ""}`}
              key={image.id}
              onClick={() =>
                setExpandedImageId((current) => (current === image.id ? null : image.id))
              }
            >
              <div className="summaryRow">
                <div className="summaryBody">
                  <p className="summaryTitle">{image.storedName}</p>
                  <p className="summaryMeta">
                    {formatDate(image.createdAt)} / {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {showPreview ? (
                  <div className="summaryThumb">
                    <Image
                      src={image.url}
                      alt={image.storedName}
                      fill
                      sizes="72px"
                      className="summaryPreviewImage"
                    />
                  </div>
                ) : null}
              </div>
              {showPreview && expandedImageId === image.id ? (
                <div className="summaryPreview">
                  <Image
                    src={image.url}
                    alt={image.storedName}
                    fill
                    sizes="(max-width: 899px) 100vw, 420px"
                    className="summaryPreviewImage"
                  />
                </div>
              ) : null}
              {onDelete ? (
                <div className="summaryActions">
                  <button
                    className="secondaryButton summaryDeleteButton"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(image);
                    }}
                    disabled={deletingImageId === image.id}
                  >
                    {deletingImageId === image.id ? "削除中..." : "削除"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
