import type { ImageRecord } from "@/lib/storage/types";

type ImageSummaryListProps = {
  title: string;
  images: ImageRecord[];
  emptyMessage: string;
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
}: ImageSummaryListProps) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <p className="eyebrow">Library</p>
        <h2>{title}</h2>
      </div>

      {images.length === 0 ? (
        <p className="mutedText">{emptyMessage}</p>
      ) : (
        <div className="summaryList">
          {images.map((image) => (
            <article className="summaryCard" key={image.id}>
              <p className="summaryTitle">{image.storedName}</p>
              <p className="summaryMeta">
                {formatDate(image.createdAt)} / {(image.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
