// Seed initial data for Fantasy Workplace
import { storage } from "./storage";
import type { InsertBadge, InsertSeason } from "@shared/schema";

export async function seedInitialData() {
  try {
    // Check if we already have badges
    const existingBadges = await storage.getAllBadges();
    if (existingBadges.length === 0) {
      console.log("Seeding initial badges...");
      
      const badges: InsertBadge[] = [
        {
          name: "First Win",
          description: "Win your first matchup",
          icon: "trophy",
          category: "performance",
        },
        {
          name: "Consistency Champion",
          description: "Submit KPI data for 5 consecutive weeks",
          icon: "target",
          category: "consistency",
        },
        {
          name: "Comeback King",
          description: "Win after being down in the standings",
          icon: "trending-up",
          category: "comeback",
        },
        {
          name: "Dominant Force",
          description: "Win 5 matchups in a row",
          icon: "zap",
          category: "dominance",
        },
        {
          name: "Perfect Week",
          description: "Score maximum points in all KPIs for one week",
          icon: "star",
          category: "performance",
        },
        {
          name: "Season Champion",
          description: "Win the season championship",
          icon: "crown",
          category: "dominance",
        },
      ];
      
      for (const badge of badges) {
        await storage.createBadge(badge);
      }
      
      console.log("✓ Badges seeded successfully");
    }
    
    // Check if we have an active season
    const activeSeason = await storage.getActiveSeason();
    if (!activeSeason) {
      console.log("Creating default season...");
      
      const now = new Date();
      const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const seasonEnd = new Date(now.getFullYear(), now.getMonth() + 4, 0);
      
      const season: InsertSeason = {
        name: `${now.getFullYear()} Q${Math.floor(now.getMonth() / 3) + 1} Season`,
        startDate: seasonStart,
        endDate: seasonEnd,
        regularSeasonWeeks: 10,
        playoffWeeks: 4,
        currentWeek: 1,
        isActive: true,
      };
      
      await storage.createSeason(season);
      console.log("✓ Default season created successfully");
    }
    
    console.log("✓ All initial data seeded");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}
