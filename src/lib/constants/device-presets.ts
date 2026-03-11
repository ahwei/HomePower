import type { DevicePreset } from "@/lib/types";

export const DEVICE_PRESETS: DevicePreset[] = [
  { name: "變頻冷氣 (1 對 1)", category: "aircon", ratedPowerW: 900, dailyHours: 8 },
  { name: "變頻冰箱 (600L)", category: "kitchen", ratedPowerW: 130, dailyHours: 24 },
  { name: "電熱水器 (50L)", category: "water_heater", ratedPowerW: 3000, dailyHours: 1.5 },
  { name: "洗衣機（滾筒）", category: "laundry", ratedPowerW: 500, dailyHours: 0.5 },
  { name: "烘衣機", category: "laundry", ratedPowerW: 2400, dailyHours: 0.5 },
  { name: "電視 (65 吋 LED)", category: "entertainment", ratedPowerW: 120, dailyHours: 5 },
  { name: "桌上型電腦 + 螢幕", category: "office", ratedPowerW: 350, dailyHours: 8 },
  { name: "LED 照明 (全屋)", category: "lighting", ratedPowerW: 100, dailyHours: 6 },
  { name: "電鍋 / 電子鍋", category: "kitchen", ratedPowerW: 800, dailyHours: 0.5 },
  { name: "除濕機", category: "aircon", ratedPowerW: 350, dailyHours: 6 },
  { name: "EV 充電 (Level 2)", category: "ev_charging", ratedPowerW: 7200, dailyHours: 4 },
];

/** DeviceCategory → 中文顯示名稱 */
export const CATEGORY_LABELS: Record<string, string> = {
  aircon: "空調",
  kitchen: "廚房",
  water_heater: "熱水",
  laundry: "洗衣",
  entertainment: "娛樂",
  office: "辦公",
  lighting: "照明",
  ev_charging: "交通",
};

/** DeviceCategory → DB category 中文對照 */
export const CATEGORY_TO_DB: Record<string, string> = {
  aircon: "空調",
  kitchen: "廚房",
  water_heater: "熱水",
  laundry: "洗衣",
  entertainment: "娛樂",
  office: "辦公",
  lighting: "照明",
  ev_charging: "交通",
};

/** 碳排放係數（台電 2024 年） */
export const CO2_FACTOR_KG_PER_KWH = 0.494;
