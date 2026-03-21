# DogFes Apps

このディレクトリは、犬まつり向けの 2 つの Next.js アプリをまとめるワークスペースです。

## Apps

- `apps/image-generator`
  - アップロード画像を元に、Replicate を使って背景付きのアニメイラストを生成するアプリ
- `apps/float-viewer`
  - 抽出した犬画像を背景上で動かして表示するアプリ

## Run

### image-generator

```bash
cd apps/image-generator
npm run dev
```

### float-viewer

```bash
cd apps/float-viewer
npm run dev -- --port 3001
```

## Notes

- それぞれ独立した `package.json` を持つ構成です。
- 環境変数、保存画像、`data/images.json` は各アプリ配下にあります。
