-- ============================================================
-- HomePower — Initial Database Schema
-- 在 Supabase SQL Editor 執行此檔案
-- ============================================================

-- -----------------------------------------------------------
-- 1. devices: 使用者的模擬設備
-- -----------------------------------------------------------
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    '空調', '廚房', '熱水', '洗衣', '娛樂', '辦公', '照明', '交通'
  )),
  rated_power_w INTEGER NOT NULL CHECK (rated_power_w > 0),
  daily_hours DECIMAL(4,1) NOT NULL CHECK (daily_hours >= 0 AND daily_hours <= 24),
  is_active BOOLEAN DEFAULT true,
  schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------
-- 2. usage_logs: 每日用電紀錄（模擬生成）
-- -----------------------------------------------------------
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  kwh DECIMAL(8,3) NOT NULL CHECK (kwh >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 加速查詢：依 user + date
CREATE INDEX idx_usage_logs_user_date ON usage_logs (user_id, date);

-- 避免重複：同一設備同一天同一小時只有一筆
CREATE UNIQUE INDEX idx_usage_logs_unique
  ON usage_logs (user_id, device_id, date, hour);

-- -----------------------------------------------------------
-- 3. user_settings: 使用者偏好設定
-- -----------------------------------------------------------
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  plan_type TEXT DEFAULT 'residential' CHECK (plan_type IN (
    'residential', 'time_of_use_2', 'time_of_use_3'
  )),
  location TEXT DEFAULT '高雄',
  household_size INTEGER DEFAULT 3 CHECK (household_size > 0)
);

-- -----------------------------------------------------------
-- 4. RLS Policies
-- -----------------------------------------------------------
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own devices"
  ON devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own usage logs"
  ON usage_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
