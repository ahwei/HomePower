/**
 * Add 5 extra devices + usage_logs for a specific user.
 * Run: SEED_USER_ID=xxx npx tsx scripts/seed-extra.ts
 */
import "dotenv/config";
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;
if (!process.env.SEED_USER_ID) {
  console.log("SEED_USER_ID not set, skipping.");
  process.exit(0);
}
const USER_ID = process.env.SEED_USER_ID;

const NEW_DEVICES = [
  { name: "除濕機", category: "aircon", rated_power_w: 350, daily_hours: 6, is_active: true, start_hour: 10 },
  { name: "電鍋", category: "kitchen", rated_power_w: 800, daily_hours: 0.5, is_active: true, start_hour: 17 },
  { name: "空氣清淨機", category: "aircon", rated_power_w: 45, daily_hours: 12, is_active: true, start_hour: 8 },
  { name: "NAS 伺服器", category: "office", rated_power_w: 80, daily_hours: 24, is_active: true, start_hour: 0 },
  { name: "吹風機", category: "water_heater", rated_power_w: 1200, daily_hours: 0.3, is_active: true, start_hour: 21 },
];

function seasonalMultiplier(month: number, category: string): number {
  const isSummer = month >= 6 && month <= 9;
  if (category === "aircon") return isSummer ? 1.6 : 0.3;
  if (category === "water_heater") return isSummer ? 0.6 : 1.3;
  return 1.0;
}

function jitter(base: number): number {
  return base * (0.8 + Math.random() * 0.4);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const deviceIds: string[] = [];
  for (const d of NEW_DEVICES) {
    const res = await client.query(
      `INSERT INTO devices (user_id, name, category, rated_power_w, daily_hours, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [USER_ID, d.name, d.category, d.rated_power_w, d.daily_hours, d.is_active]
    );
    deviceIds.push(res.rows[0].id);
  }
  console.log(`Inserted ${deviceIds.length} new devices`);

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

    for (let i = 0; i < NEW_DEVICES.length; i++) {
      const device = NEW_DEVICES[i];
      const numHours = Math.max(1, Math.round(device.daily_hours));
      for (let h = 0; h < numHours; h++) {
        const hour = (device.start_hour + h) % 24;
        const baseKwh = (device.rated_power_w / 1000) * (device.daily_hours / numHours);
        const kwh = Math.max(0.001, jitter(baseKwh * seasonalMultiplier(month, device.category)));

        values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`);
        params.push(USER_ID, deviceIds[i], dateStr, hour, Number(kwh.toFixed(3)));
        paramIdx += 5;
        totalRows++;

        if (values.length >= batchSize) {
          await client.query(
            `INSERT INTO usage_logs (user_id, device_id, date, hour, kwh) VALUES ${values.join(",")} ON CONFLICT DO NOTHING`,
            params
          );
          values = [];
          params = [];
          paramIdx = 1;
        }
      }
    }
  }

  if (values.length > 0) {
    await client.query(
      `INSERT INTO usage_logs (user_id, device_id, date, hour, kwh) VALUES ${values.join(",")} ON CONFLICT DO NOTHING`,
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
