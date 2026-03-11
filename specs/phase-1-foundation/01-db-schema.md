# Task #1: 建立 Supabase DB Schema + RLS

## 目標

在 Supabase 建立三張核心資料表並啟用 RLS。

## 產出

- `specs/migrations/001_initial_schema.sql`

## Schema

### devices（使用者的模擬設備）

| Column        | Type                     | Constraint                              |
| ------------- | ------------------------ | --------------------------------------- |
| id            | UUID                     | PK, DEFAULT gen_random_uuid()           |
| user_id       | UUID                     | NOT NULL, FK → auth.users(id)           |
| name          | TEXT                     | NOT NULL                                |
| category      | TEXT                     | NOT NULL (空調/廚房/洗衣/娛樂/辦公/照明/交通) |
| rated_power_w | INTEGER                  | NOT NULL (額定功率 Watt)                |
| daily_hours   | DECIMAL(4,1)             | NOT NULL (每日使用時數)                 |
| is_active     | BOOLEAN                  | DEFAULT true                            |
| schedule      | JSONB                    | 可選，格式 `{start: "08:00", end: "22:00"}` |
| created_at    | TIMESTAMPTZ              | DEFAULT now()                           |
| updated_at    | TIMESTAMPTZ              | DEFAULT now()                           |

### usage_logs（每日用電紀錄）

| Column     | Type         | Constraint                            |
| ---------- | ------------ | ------------------------------------- |
| id         | UUID         | PK, DEFAULT gen_random_uuid()         |
| user_id    | UUID         | NOT NULL, FK → auth.users(id)         |
| device_id  | UUID         | FK → devices(id)                      |
| date       | DATE         | NOT NULL                              |
| hour       | INTEGER      | CHECK (0-23)                          |
| kwh        | DECIMAL(8,3) | NOT NULL                              |
| created_at | TIMESTAMPTZ  | DEFAULT now()                         |

### user_settings（使用者偏好）

| Column         | Type    | Constraint                     |
| -------------- | ------- | ------------------------------ |
| user_id        | UUID    | PK, FK → auth.users(id)       |
| plan_type      | TEXT    | DEFAULT 'residential'          |
| location       | TEXT    | DEFAULT '高雄'                 |
| household_size | INTEGER | DEFAULT 3                      |

### RLS Policies

三張表都啟用 RLS，policy 統一為：

```sql
CREATE POLICY "Users manage own [table]"
  ON [table] FOR ALL USING (auth.uid() = user_id);
```

## 驗收標準

- [ ] SQL 檔案可在 Supabase SQL Editor 一次執行成功
- [ ] 用測試帳號 INSERT 一筆 device，能成功寫入
- [ ] 用另一個帳號 SELECT devices，看不到第一個帳號的資料（RLS 驗證）
- [ ] usage_logs.hour 超出 0-23 範圍時 INSERT 失敗（CHECK 驗證）
