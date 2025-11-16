// Storage interface implementing database operations for Fantasy Workplace
import {
  users,
  seasons,
  kpis,
  kpiData,
  matchups,
  badges,
  userBadges,
  aiCoachConversations,
  type User,
  type UpsertUser,
  type Season,
  type InsertSeason,
  type Kpi,
  type InsertKpi,
  type KpiData,
  type InsertKpiData,
  type Matchup,
  type InsertMatchup,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type AiCoachConversation,
  type InsertAiCoachConversation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Season operations
  getActiveSeason(): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: string, data: Partial<Season>): Promise<Season>;

  // KPI operations
  getAllKpis(): Promise<Kpi[]>;
  getKpi(id: string): Promise<Kpi | undefined>;
  createKpi(kpi: InsertKpi): Promise<Kpi>;
  updateKpi(id: string, data: Partial<Kpi>): Promise<Kpi>;
  deleteKpi(id: string): Promise<void>;

  // KPI Data operations
  getKpiDataByUserAndWeek(userId: string, seasonId: string, week: number): Promise<KpiData[]>;
  bulkInsertKpiData(data: InsertKpiData[]): Promise<KpiData[]>;

  // Matchup operations
  getMatchupsByWeek(seasonId: string, week: number): Promise<Matchup[]>;
  getRecentMatchupsByUser(userId: string, seasonId: string, limit: number): Promise<Matchup[]>;
  getMatchupById(id: string): Promise<Matchup | undefined>;
  createMatchup(matchup: InsertMatchup): Promise<Matchup>;
  updateMatchup(id: string, data: Partial<Matchup>): Promise<Matchup>;
  bulkCreateMatchups(matchups: InsertMatchup[]): Promise<Matchup[]>;
  deleteMatchupsByWeek(seasonId: string, week: number): Promise<void>;

  // Badge operations
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;

  // AI Coach operations
  getConversationHistory(userId: string, seasonId: string): Promise<AiCoachConversation[]>;
  saveConversation(conversation: InsertAiCoachConversation): Promise<AiCoachConversation>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { id, ...updateData } = userData;
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...updateData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Cascade delete all related data in a transaction for atomicity
    await db.transaction(async (tx) => {
      // Delete KPI data
      await tx.delete(kpiData).where(eq(kpiData.userId, id));
      
      // Delete user badges
      await tx.delete(userBadges).where(eq(userBadges.userId, id));
      
      // Delete AI coach conversations
      await tx.delete(aiCoachConversations).where(eq(aiCoachConversations.userId, id));
      
      // Delete matchups where user is player1, player2, or winner
      await tx.delete(matchups).where(
        or(
          eq(matchups.player1Id, id),
          eq(matchups.player2Id, id),
          eq(matchups.winnerId, id)
        )
      );
      
      // Finally, delete the user
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  // Season operations
  async getActiveSeason(): Promise<Season | undefined> {
    const [season] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .orderBy(desc(seasons.createdAt))
      .limit(1);
    return season;
  }

  async createSeason(seasonData: InsertSeason): Promise<Season> {
    const [season] = await db.insert(seasons).values(seasonData).returning();
    return season;
  }

  async updateSeason(id: string, data: Partial<Season>): Promise<Season> {
    const [season] = await db
      .update(seasons)
      .set(data)
      .where(eq(seasons.id, id))
      .returning();
    return season;
  }

  // KPI operations
  async getAllKpis(): Promise<Kpi[]> {
    return await db.select().from(kpis).orderBy(kpis.displayOrder);
  }

  async getKpi(id: string): Promise<Kpi | undefined> {
    const [kpi] = await db.select().from(kpis).where(eq(kpis.id, id));
    return kpi;
  }

  async createKpi(kpiData: InsertKpi): Promise<Kpi> {
    const [kpi] = await db.insert(kpis).values(kpiData).returning();
    return kpi;
  }

  async updateKpi(id: string, data: Partial<Kpi>): Promise<Kpi> {
    const [kpi] = await db
      .update(kpis)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(kpis.id, id))
      .returning();
    return kpi;
  }

  async deleteKpi(id: string): Promise<void> {
    await db.delete(kpis).where(eq(kpis.id, id));
  }

  // KPI Data operations
  async getKpiDataByUserAndWeek(userId: string, seasonId: string, week: number): Promise<KpiData[]> {
    return await db
      .select()
      .from(kpiData)
      .where(
        and(
          eq(kpiData.userId, userId),
          eq(kpiData.seasonId, seasonId),
          eq(kpiData.week, week)
        )
      );
  }

  async bulkInsertKpiData(data: InsertKpiData[]): Promise<KpiData[]> {
    if (data.length === 0) return [];
    
    return await db
      .insert(kpiData)
      .values(data)
      .onConflictDoUpdate({
        target: [kpiData.userId, kpiData.kpiId, kpiData.seasonId, kpiData.week],
        set: {
          value: sql`EXCLUDED.value`,
          submittedAt: new Date(),
        },
      })
      .returning();
  }

  // Matchup operations
  async getMatchupsByWeek(seasonId: string, week: number): Promise<Matchup[]> {
    return await db
      .select()
      .from(matchups)
      .where(and(eq(matchups.seasonId, seasonId), eq(matchups.week, week)));
  }

  async getMatchupById(id: string): Promise<Matchup | undefined> {
    const [matchup] = await db
      .select()
      .from(matchups)
      .where(eq(matchups.id, id))
      .limit(1);
    return matchup;
  }

  async getRecentMatchupsByUser(userId: string, seasonId: string, limit: number): Promise<Matchup[]> {
    return await db
      .select()
      .from(matchups)
      .where(
        and(
          eq(matchups.seasonId, seasonId),
          sql`(${matchups.player1Id} = ${userId} OR ${matchups.player2Id} = ${userId})`
        )
      )
      .orderBy(desc(matchups.week))
      .limit(limit);
  }

  async createMatchup(matchupData: InsertMatchup): Promise<Matchup> {
    const [matchup] = await db.insert(matchups).values(matchupData).returning();
    return matchup;
  }

  async updateMatchup(id: string, data: Partial<Matchup>): Promise<Matchup> {
    const [matchup] = await db
      .update(matchups)
      .set(data)
      .where(eq(matchups.id, id))
      .returning();
    return matchup;
  }

  async bulkCreateMatchups(matchupsData: InsertMatchup[]): Promise<Matchup[]> {
    if (matchupsData.length === 0) return [];
    return await db.insert(matchups).values(matchupsData).returning();
  }

  async deleteMatchupsByWeek(seasonId: string, week: number): Promise<void> {
    await db
      .delete(matchups)
      .where(and(eq(matchups.seasonId, seasonId), eq(matchups.week, week)));
  }

  // Badge operations
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async createBadge(badgeData: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges).values(badgeData).returning();
    return badge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }

  async awardBadge(userBadgeData: InsertUserBadge): Promise<UserBadge> {
    const [userBadge] = await db
      .insert(userBadges)
      .values(userBadgeData)
      .onConflictDoNothing()
      .returning();
    return userBadge;
  }

  // AI Coach operations
  async getConversationHistory(userId: string, seasonId: string): Promise<AiCoachConversation[]> {
    return await db
      .select()
      .from(aiCoachConversations)
      .where(
        and(
          eq(aiCoachConversations.userId, userId),
          eq(aiCoachConversations.seasonId, seasonId)
        )
      )
      .orderBy(aiCoachConversations.createdAt)
      .limit(50);
  }

  async saveConversation(conversationData: InsertAiCoachConversation): Promise<AiCoachConversation> {
    const [conversation] = await db
      .insert(aiCoachConversations)
      .values(conversationData)
      .returning();
    return conversation;
  }
}

export const storage = new DatabaseStorage();
