# Supabase Storage Architecture

## Buckets

| Bucket | 用途 | 公開讀取 | 寫入限制 |
|--------|------|---------|----------|
| `avatars` | 使用者大頭貼 | Yes | 僅本人資料夾 |
| `device-images` | 設備圖片 | Yes | 僅本人資料夾 |

## 路徑規則

- **大頭貼**: `avatars/{userId}/avatar.webp`
- **設備圖片**: `device-images/{userId}/{deviceId}.webp`

## RLS Policies

所有 bucket 皆為 public（SELECT 開放），寫入操作透過 RLS 限制：

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

確保使用者只能寫入自己的資料夾。

## 圖片上傳流程

1. Client 端選擇圖片
2. `browser-image-compression` 壓縮（轉為 WebP）
3. 上傳至 Supabase Storage（`upsert: true`）
4. 取得 public URL
5. 寫入 DB 或 Auth metadata

### 壓縮參數

| 類型 | maxSizeMB | maxWidthOrHeight |
|------|-----------|------------------|
| 設備圖片 | 0.5 MB | 800px |
| 大頭貼 | 0.2 MB | 256px |

### 接受格式

- `image/jpeg`
- `image/png`
- `image/webp`

## 資料儲存位置

- **大頭貼 URL**: `user.user_metadata.avatar_url`（Supabase Auth metadata，不需 DB 欄位）
- **設備圖片 URL**: `devices.image_url` 欄位

## 刪除流程

- **刪除設備**: Server Action `deleteDevice()` 會先刪除 Storage 中的圖片，再刪除 DB 記錄
- **大頭貼**: 上傳時使用 `upsert: true` 直接覆蓋，無需手動刪除舊檔
