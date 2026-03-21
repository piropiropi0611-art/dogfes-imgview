# Replicate Setup

## Phase 1 Goal

Replicate をこのアプリから使えるようにするため、アカウント、API トークン、課金、ローカル環境変数を準備する。

## User Steps

1. `https://replicate.com/` でアカウントを作成する
2. `https://replicate.com/account/api-tokens` で API トークンを確認または新規作成する
3. 開発用に課金設定または prepaid credit を用意する
4. プロジェクトルートに `.env.local` を作成し、以下を設定する

```env
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REPLICATE_MODEL=flux-kontext-apps/multi-image-kontext-pro
```

## Notes

- `REPLICATE_API_TOKEN` は秘密情報なのでコミットしない
- 背景画像も入力に使う現行構成では `flux-kontext-apps/multi-image-kontext-pro` を使う
- 犬画像の背景除去前処理はローカルで実行する
- 本番では `Vercel` の環境変数にも同じ値を設定する
