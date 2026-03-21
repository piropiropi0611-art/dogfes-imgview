# Float Viewer

犬画像のアップロード、背景除去、抽出画像の表示を行う Next.js アプリです。

## Local

```bash
npm run dev
```

`STORAGE_ROOT` を指定しない場合は、ローカル開発向けに `public/uploads`、`public/extracted`、`data/images.json` を使います。

## Railway

最短公開手順:

1. Railway で新しい Project を作成する
2. このリポジトリを接続する
3. Service の Root Directory を `apps/float-viewer` に設定する
4. Volume を 1 つ作成して `/data` にマウントする
5. 環境変数 `STORAGE_ROOT=/data` を設定する
6. Deploy する

## Railway での保存先

`STORAGE_ROOT=/data` の場合、保存先は次のようになります。

- 元画像: `/data/uploads`
- 抽出画像: `/data/extracted`
- 画像メタデータ: `/data/images.json`

画像の公開 URL はアプリ側で次のように配信します。

- `/uploads/<storedName>`
- `/extracted/<storedName>`

そのため、Railway Volume 自体を直接公開する必要はありません。
