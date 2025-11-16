import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (IMPORTANT: mandatory for Replit Auth, don't drop it)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (IMPORTANT: mandatory for Replit Auth, with role extension)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default('employee'), // employee, admin, cio
  salesRepNumber: integer("sales_rep_number").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Schema for admin user updates - only allow updating role and salesRepNumber
export const updateUserSchema = z.object({
  role: z.enum(['employee', 'admin', 'cio']).optional(),
  salesRepNumber: z.number().int().min(1).max(14).nullable().optional(),
});
export type UpdateUser = z.infer<typeof updateUserSchema>;

// Seasons table - represents a competition period
export const seasons = pgTable("seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  regularSeasonWeeks: integer("regular_season_weeks").notNull().default(10),
  playoffWeeks: integer("playoff_weeks").notNull().default(4),
  currentWeek: integer("current_week").notNull().default(1),
  activeUserSpots: integer("active_user_spots").notNull().default(8),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
  createdAt: true,
});
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Season = typeof seasons.$inferSelect;

// KPIs table - Key Performance Indicators
export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }), // e.g., "calls", "sales", "%", "hours"
  weight: real("weight").notNull().default(1.0), // weight in score calculation (0-100)
  conversionFormula: text("conversion_formula"), // formula to convert raw value to points (e.g., "value / 300")
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKpiSchema = createInsertSchema(kpis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpis.$inferSelect;

// KPI Data table - actual performance data submitted by users
export const kpiData = pgTable("kpi_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  kpiId: varchar("kpi_id").notNull().references(() => kpis.id),
  seasonId: varchar("season_id").notNull().references(() => seasons.id),
  week: integer("week").notNull(),
  value: real("value").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.kpiId, table.seasonId, table.week)
]);

export const insertKpiDataSchema = createInsertSchema(kpiData).omit({
  id: true,
  submittedAt: true,
});
export type InsertKpiData = z.infer<typeof insertKpiDataSchema>;
export type KpiData = typeof kpiData.$inferSelect;

// Matchups table - head-to-head weekly competitions
export const matchups = pgTable("matchups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id),
  week: integer("week").notNull(),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").notNull().references(() => users.id),
  player1Score: real("player1_score"),
  player2Score: real("player2_score"),
  winnerId: varchar("winner_id").references(() => users.id),
  isPlayoff: boolean("is_playoff").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.seasonId, table.week, table.player1Id, table.player2Id)
]);

export const insertMatchupSchema = createInsertSchema(matchups).omit({
  id: true,
  createdAt: true,
});
export type InsertMatchup = z.infer<typeof insertMatchupSchema>;
export type Matchup = typeof matchups.$inferSelect;

// Badges table - achievement definitions
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }), // icon name from lucide-react
  category: varchar("category", { length: 50 }), // performance, consistency, comeback, dominance
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Badges table - badges earned by users
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  seasonId: varchar("season_id").references(() => seasons.id),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.badgeId, table.seasonId)
]);

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// AI Coach Conversations table - track AI coaching sessions
export const aiCoachConversations = pgTable("ai_coach_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  seasonId: varchar("season_id").notNull().references(() => seasons.id),
  week: integer("week").notNull(),
  userMessage: text("user_message"),
  aiResponse: text("ai_response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiCoachConversationSchema = createInsertSchema(aiCoachConversations).omit({
  id: true,
  createdAt: true,
});
export type InsertAiCoachConversation = z.infer<typeof insertAiCoachConversationSchema>;
export type AiCoachConversation = typeof aiCoachConversations.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  kpiData: many(kpiData),
  matchupsAsPlayer1: many(matchups, { relationName: "player1" }),
  matchupsAsPlayer2: many(matchups, { relationName: "player2" }),
  userBadges: many(userBadges),
  aiCoachConversations: many(aiCoachConversations),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  kpiData: many(kpiData),
  matchups: many(matchups),
  userBadges: many(userBadges),
  aiCoachConversations: many(aiCoachConversations),
}));

export const kpisRelations = relations(kpis, ({ many }) => ({
  kpiData: many(kpiData),
}));

export const kpiDataRelations = relations(kpiData, ({ one }) => ({
  user: one(users, { fields: [kpiData.userId], references: [users.id] }),
  kpi: one(kpis, { fields: [kpiData.kpiId], references: [kpis.id] }),
  season: one(seasons, { fields: [kpiData.seasonId], references: [seasons.id] }),
}));

export const matchupsRelations = relations(matchups, ({ one }) => ({
  season: one(seasons, { fields: [matchups.seasonId], references: [seasons.id] }),
  player1: one(users, { fields: [matchups.player1Id], references: [users.id], relationName: "player1" }),
  player2: one(users, { fields: [matchups.player2Id], references: [users.id], relationName: "player2" }),
  winner: one(users, { fields: [matchups.winnerId], references: [users.id] }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
  season: one(seasons, { fields: [userBadges.seasonId], references: [seasons.id] }),
}));

export const aiCoachConversationsRelations = relations(aiCoachConversations, ({ one }) => ({
  user: one(users, { fields: [aiCoachConversations.userId], references: [users.id] }),
  season: one(seasons, { fields: [aiCoachConversations.seasonId], references: [seasons.id] }),
}));
