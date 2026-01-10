# 中央SIM管理システム

合同会社ピーチの複数サービス（物販/バーサス/Avaris等）を横断する中央SIM管理システム

## 概要

このシステムは、複数の既存Supabaseサービスと連携し、SIM（ICCID単位）を中央で一元管理するためのプラットフォームです。

### 主要機能

1. **スーパー回線一覧** - ICCID単位で全サービスのSIMを一元管理
2. **履歴管理** - SIMのライフサイクル（顧客ごとの契約履歴）を記録
3. **CSV一括登録** - SIM情報の初期登録・更新
4. **ハイブリッド同期** - 既存サービスDBから定期的に状態を同期
5. **公開API** - ICCID→MSISDN変換APIを既存管理画面へ提供
6. **販売可能数集計** - 用途タグ×期間で利用可能なSIM数を計算

## 技術スタック

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** (ORM)
- **PostgreSQL** (Database)
- **Tailwind CSS** (Styling)
- **Zod** (Validation)
- **Supabase Client** (External service integration)

## 環境構築

### 前提条件

- Node.js 18.17以上
- PostgreSQL 14以上
- npm または yarn

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd supermobile-Lines
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、以下の値を設定します：

```bash
cp .env.example .env
```

`.env` ファイルを編集：

```env
# PostgreSQL接続文字列（実際のDB情報に置き換えてください）
DATABASE_URL="postgresql://user:password@localhost:5432/sim_management"

# 公開APIキー（既存管理画面からのアクセス用）
# 生成: openssl rand -hex 32
PUBLIC_API_KEY="your-secure-api-key-here"

# 暗号化キー（ServiceSourceのserviceRoleKey暗号化用）
# 生成: openssl rand -base64 32
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# アプリURL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 環境
NODE_ENV="development"
```

### 4. データベースのセットアップ

PostgreSQLでデータベースを作成：

```bash
createdb sim_management
```

Prismaマイグレーションを実行：

```bash
npm run db:migrate
```

初期データを投入（サンプルSIM、用途タグ等）：

```bash
npm run db:seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## プロジェクト構造

```
/workspaces/supermobile-Lines/
├── app/                          # Next.js App Router
│   ├── api/                      # APIルート
│   │   ├── sims/                 # SIM管理API
│   │   ├── sync/                 # 同期API
│   │   ├── availability/         # 販売可能数API
│   │   ├── public/msisdn/        # 公開API（ICCID→MSISDN）
│   │   ├── usage-tags/           # 用途タグAPI
│   │   └── usage-rules/          # ルールAPI
│   ├── sims/                     # SIM一覧・詳細ページ
│   ├── import/                   # CSV取込ページ
│   └── rules/                    # ルール管理ページ
├── lib/                          # ユーティリティ
│   ├── prisma.ts                 # Prismaクライアント
│   ├── encryption.ts             # 暗号化/復号化
│   ├── validation.ts             # Zodバリデーションスキーマ
│   ├── supabase.ts               # Supabaseクライアント
│   └── utils.ts                  # 汎用ユーティリティ
├── services/                     # ビジネスロジック
├── types/                        # TypeScript型定義
├── components/                   # Reactコンポーネント
├── prisma/
│   ├── schema.prisma             # データモデル
│   └── seed.ts                   # 初期データ
└── public/templates/
    └── sim-import-template.csv   # CSVテンプレート
```

## 使い方

### CSV一括取込

1. http://localhost:3000/import にアクセス
2. CSVテンプレートをダウンロード（または `public/templates/sim-import-template.csv` を参照）
3. CSVファイルを編集してSIM情報を入力
4. ファイルをアップロード

**CSVフォーマット例：**

```csv
iccid,msisdn,supplier,ownerCompany,plan,customerType,supplierServiceStartDate,supplierServiceEndDate
8981100001234567890,09012345678,アーツ,Company A,Plan A,Type A,2024-01-01,2025-12-31
```

### 既存サービスDBとの同期

**⚠️ 重要**: 同期機能を使用する前に、各サービス（物販/バーサス/Avaris）のSupabase接続情報を設定する必要があります。

#### 1. サービス接続情報の設定

`prisma/seed.ts` を編集して、実際のSupabase情報を入力：

```typescript
supabaseUrl: 'https://your-actual-project.supabase.co',
serviceRoleKey: encrypt('your-actual-service-role-key'),
tableName: 'subscriptions', // 実際のテーブル名
enabled: true, // 有効化
```

#### 2. 同期の実行

APIエンドポイントを呼び出す：

```bash
# 全サービス同期
curl -X POST http://localhost:3000/api/sync

# 特定サービスのみ同期
curl -X POST "http://localhost:3000/api/sync?serviceName=buppan"
```

### 公開API（ICCID→MSISDN変換）

既存の管理画面から電話番号を取得する際に使用します。

```bash
curl -H "X-API-KEY: your-api-key" \
  "http://localhost:3000/api/public/msisdn?iccid=8981100001234567890"
```

**レスポンス例：**

```json
{
  "iccid": "8981100001234567890",
  "msisdn": "09012345678"
}
```

### 販売可能数の計算

用途タグと期間を指定して、利用可能なSIM数を取得：

```bash
curl "http://localhost:3000/api/availability?usageTagId=1&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z"
```

**レスポンス例：**

```json
{
  "usageTagId": 1,
  "usageTagName": "ポケカ認証",
  "requestedPeriod": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.000Z"
  },
  "availableCount": 15,
  "sims": [
    {
      "iccid": "8981100001234567890",
      "msisdn": "09012345678",
      "supplier": "アーツ",
      "plan": "Plan A"
    }
  ]
}
```

## データモデル

### 主要テーブル

- **Sim** - SIM基本情報（ICCID主キー）
- **SimHistory** - SIMライフサイクル履歴
- **ServiceSource** - 既存サービスDB接続情報
- **UsageTag** - 用途タグマスタ（ポケカ認証/物販等）
- **UsageRule** - 販売可能判定ルール
- **SyncLog** - 同期・操作ログ

詳細は [prisma/schema.prisma](prisma/schema.prisma) を参照

## 開発

### データベース管理

```bash
# Prisma Studio（GUIでDBを確認・編集）
npm run db:studio

# マイグレーション作成
npx prisma migrate dev --name description

# データベースリセット（開発時のみ）
npx prisma migrate reset
```

### ビルド

```bash
npm run build
npm start
```

## TODO・注意事項

### ⚠️ 実装前に確認が必要な項目

1. **既存Supabase DBの実テーブル構造**
   - 各サービス（物販/バーサス/Avaris）のテーブル名を確認
   - カラム名（ICCID, 顧客ID, 契約期間, 発送日等）を確認
   - `ServiceSource.columnMappings`に反映

2. **Supabase接続情報**
   - 各サービスのsupabaseUrl
   - 各サービスのserviceRoleKey（暗号化して保存）
   - Seedデータ（`prisma/seed.ts`）に追記

3. **本番DB環境**
   - PostgreSQLホスト情報
   - 接続文字列（DATABASE_URL）
   - バックアップ戦略

### 実装フェーズ

現在の実装状況: **Phase 1 完了（基盤構築）**

- [x] Phase 1: 基盤構築
- [ ] Phase 2: コアSIM管理機能（CRUD API、一覧・詳細ページ）
- [ ] Phase 3: CSV一括取込機能
- [ ] Phase 4: 既存Supabase同期機能
- [ ] Phase 5: 履歴・ルール管理
- [ ] Phase 6: 公開API・本番対応

## トラブルシューティング

### PostgreSQLに接続できない

- `.env` の `DATABASE_URL` が正しいか確認
- PostgreSQLサービスが起動しているか確認
- データベースが作成されているか確認（`createdb sim_management`）

### 暗号化エラー

- `ENCRYPTION_KEY` が32文字以上か確認
- `openssl rand -base64 32` で新しいキーを生成

### 同期エラー

- ServiceSourceのSupabase接続情報が正しいか確認
- `enabled` が `true` になっているか確認
- ServiceRoleKeyが正しく暗号化されているか確認

## ライセンス

Private - 合同会社ピーチ

## サポート

質問・問題がある場合は、プロジェクト管理者に連絡してください。