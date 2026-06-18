import { pgTable, serial, text, timestamp, varchar, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  type: varchar("type", { length: 100 }),
  basePrice: integer("base_price"),
  sellingPrice: integer("selling_price"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
