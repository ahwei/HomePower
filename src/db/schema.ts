import {
  pgTable,
  uuid,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const devices = pgTable("devices", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  ratedPowerW: integer("rated_power_w").notNull(),
  dailyHours: decimal("daily_hours", { precision: 4, scale: 1 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  schedule: jsonb("schedule"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usageLogs = pgTable(
  "usage_logs",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id").notNull(),
    deviceId: uuid("device_id").references(() => devices.id, {
      onDelete: "cascade",
    }),
    date: date("date", { mode: "date" }).notNull(),
    hour: integer("hour").notNull(),
    kwh: decimal("kwh", { precision: 8, scale: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("usage_logs_unique").on(
      table.userId,
      table.deviceId,
      table.date,
      table.hour
    ),
    index("usage_logs_user_date").on(table.userId, table.date),
  ]
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey(),
  planType: text("plan_type").notNull().default("residential"),
  location: text("location").notNull().default("高雄"),
  householdSize: integer("household_size").notNull().default(3),
});
