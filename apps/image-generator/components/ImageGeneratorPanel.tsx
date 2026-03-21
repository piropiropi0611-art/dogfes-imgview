"use client";

import type { ImageRecord } from "@/lib/storage/types";

type ImageGeneratorPanelProps = {
  selectedImage: ImageRecord | undefined;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function ImageGeneratorPanel({
  selectedImage,
  isGenerating,
  onGenerate,
}: ImageGeneratorPanelProps) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <p className="eyebrow">Replicate</p>
        <h2>画像から画像を生成</h2>
      </div>

      <div className="generatorMeta">
        <span className="uploadMetaLabel">生成元</span>
        <span className="uploadMetaValue">
          {selectedImage?.storedName ?? "一覧から画像を選択してください"}
        </span>
      </div>

      <p className="mutedText">
        選択した画像を元に、アプリ内に固定した背景画像もあわせて `Replicate`
        へ入力し、背景付きのアニメイラスト風画像を生成します。
      </p>
      <p className="mutedText">
        生成元に使えるのは、ブラウザからアップロードした元画像のみです。
        生成済み画像は再入力できません。
      </p>
      <p className="mutedText">
        生成時には、背景除去した中間画像も一覧へ保存します。これで前処理と生成結果を見比べられます。
      </p>

      <button
        className="primaryButton"
        type="button"
        disabled={isGenerating || !selectedImage}
        onClick={onGenerate}
      >
        {isGenerating ? "生成中..." : "この画像から生成する"}
      </button>
    </section>
  );
}
