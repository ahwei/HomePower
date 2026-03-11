// ============================================================
// HomePower — Core Type Definitions
// ============================================================

// --- Device ---

export type DeviceCategory =
  | "aircon"
  | "kitchen"
  | "water_heater"
  | "laundry"
  | "entertainment"
  | "office"
  | "lighting"
  | "ev_charging";

export interface Device {
  id: string;
  userId: string;
  name: string;
  category: DeviceCategory;
  ratedPowerW: number;
  dailyHours: number;
  isActive: boolean;
  schedule?: DeviceSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceSchedule {
  start: string; // "08:00"
  end: string; // "22:00"
}

/** 預設設備模板（用於 AddDeviceDialog） */
export interface DevicePreset {
  name: string;
  category: DeviceCategory;
  ratedPowerW: number;
  dailyHours: number;
}

/** 計算屬性：月用電量 */
export function computeMonthlyKwh(device: {
  ratedPowerW: number;
  dailyHours: number;
}): number {
  return (device.ratedPowerW * device.dailyHours * 30) / 1000;
}

// --- Electricity Plan ---

export interface ElectricityPlan {
  id: string;
  name: string;
  type: PlanType;
  tiers: PriceTier[];
  peakHours?: { start: number; end: number };
}

export type PlanType = "residential" | "time_of_use_2" | "time_of_use_3";

export interface PriceTier {
  min: number;
  max: number | null; // null = 無上限
  summerRate: number; // TWD/kWh（夏月 6-9 月）
  nonSummerRate: number; // TWD/kWh（非夏月）
}

export interface BillResult {
  totalAmount: number;
  breakdown: TierBreakdown[];
  avgRate: number;
  planType: PlanType;
  isSummer: boolean;
}

export interface TierBreakdown {
  tier: string;
  kwh: number;
  rate: number;
  amount: number;
}

// --- Grid Status ---

export type GridStatusLevel = "green" | "yellow" | "orange" | "red";

export interface GridStatus {
  status: GridStatusLevel;
  supplyCapacityMW: number;
  currentLoadMW: number;
  reserveMarginPercent: number;
  updatedAt: string;
}

// --- Weather ---

export interface WeatherForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  description: string;
  estimatedAcHours: number;
}

// --- Usage Log ---

export interface UsageLog {
  id: string;
  userId: string;
  deviceId: string;
  date: string;
  hour: number;
  kwh: number;
}

// --- User Settings ---

export interface UserSettings {
  userId: string;
  planType: PlanType;
  location: string;
  householdSize: number;
}
