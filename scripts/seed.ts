/**
 * Seed script — creates fake devices + usage_logs for the existing user.
 * Run: npx tsx scripts/seed.ts
 */
import "dotenv/config";
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;
if (!process.env.SEED_USER_ID) {
  console.log("SEED_USER_ID not set, skipping seed.");
  process.exit(0);
}
const USER_ID: string = process.env.SEED_USER_ID;

interface SeedDevice {
  name: string;
  category: string;
  rated_power_w: number;
  daily_hours: number;
  is_active: boolean;
}

const DEVICES: SeedDevice[] = [
  { name: "客廳冷氣", category: "aircon", rated_power_w: 1200, daily_hours: 8, is_active: true },
  { name: "主臥冷氣", category: "aircon", rated_power_w: 900, daily_hours: 7, is_active: true },
  { name: "電冰箱", category: "kitchen", rated_power_w: 130, daily_hours: 24, is_active: true },
  { name: "電熱水器", category: "water_heater", rated_power_w: 3000, daily_hours: 1.5, is_active: true },
  { name: "洗衣機", category: "laundry", rated_power_w: 500, daily_hours: 1, is_active: true },
  { name: "烘衣機", category: "laundry", rated_power_w: 2400, daily_hours: 0.5, is_active: false },
  { name: "電視", category: "entertainment", rated_power_w: 150, daily_hours: 5, is_active: true },
  { name: "桌上型電腦", category: "office", rated_power_w: 350, daily_hours: 6, is_active: true },
  { name: "客廳燈具", category: "lighting", rated_power_w: 60, daily_hours: 6, is_active: true },
  { name: "電磁爐", category: "kitchen", rated_power_w: 1800, daily_hours: 0.5, is_active: true },
];

// Seasonal multiplier: summer months (6-9) use more AC
function seasonalMultiplier(month: number, category: string): number {
  const isSummer = month >= 6 && month <= 9;
  if (category === "aircon") return isSummer ? 1.6 : 0.3;
  if (category === "water_heater") return isSummer ? 0.6 : 1.3;
  return 1.0;
}

// Random variation ±20%
function jitter(base: number): number {
  return base * (0.8 + Math.random() * 0.4);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Clear existing seed data
  await client.query("DELETE FROM usage_logs WHERE user_id = $1", [USER_ID]);
  await client.query("DELETE FROM devices WHERE user_id = $1", [USER_ID]);
  console.log("Cleared existing data");

  // Insert devices
  const deviceIds: string[] = [];
  for (const d of DEVICES) {
    const res = await client.query(
      `INSERT INTO devices (user_id, name, category, rated_power_w, daily_hours, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [USER_ID, d.name, d.category, d.rated_power_w, d.daily_hours, d.is_active]
    );
    deviceIds.push(res.rows[0].id);
  }
  console.log(`Inserted ${deviceIds.length} devices`);

  // Generate usage_logs: 2025-01-01 ~ 2026-12-31, one row per device per day (aggregated)
  const startDate = new Date("2025-01-01");
  const endDate = new Date("2026-12-31");
  const batchSize = 500;
  let values: string[] = [];
  let params: (string | number)[] = [];
  let paramIdx = 1;
  let totalRows = 0;

  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    const dateStr = dt.toISOString().slice(0, 10);
    const month = dt.getMonth() + 1;

    for (let i = 0; i < DEVICES.length; i++) {
      const device = DEVICES[i];
      if (!device.is_active) continue;

      // Generate a few hourly entries per device per day
      const hoursPerDay = device.daily_hours;
      // Distribute across typical usage hours
      const startHour = device.category === "aircon" ? 12 :
                         device.category === "water_heater" ? 18 :
                         device.category === "kitchen" ? 17 :
                         device.category === "laundry" ? 9 :
                         device.category === "lighting" ? 18 : 8;

      const numHours = Math.max(1, Math.round(hoursPerDay));
      for (let h = 0; h < numHours; h++) {
        const hour = (startHour + h) % 24;
        const baseKwh = (device.rated_power_w / 1000) * (hoursPerDay / numHours);
        const kwh = Math.max(0.001, jitter(baseKwh * seasonalMultiplier(month, device.category)));

        values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`);
        params.push(USER_ID, deviceIds[i], dateStr, hour, Number(kwh.toFixed(3)));
        paramIdx += 5;
        totalRows++;

        if (values.length >= batchSize) {
          await client.query(
            `INSERT INTO usage_logs (user_id, device_id, date, hour, kwh) VALUES ${values.join(",")}
             ON CONFLICT DO NOTHING`,
            params
          );
          values = [];
          params = [];
          paramIdx = 1;
        }
      }
    }
  }

  // Flush remaining
  if (values.length > 0) {
    await client.query(
      `INSERT INTO usage_logs (user_id, device_id, date, hour, kwh) VALUES ${values.join(",")}
       ON CONFLICT DO NOTHING`,
      params
    );
  }

  console.log(`Inserted ${totalRows} usage_log rows`);
  await client.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
